import json
import re

from django.conf import settings
from rest_framework import serializers
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from operations.services import driver_card

from . import services
from .gateways import get_gateway
from .models import Booking, Payment


class BookingThrottle(AnonRateThrottle):
    scope = 'booking'


class LookupThrottle(AnonRateThrottle):
    scope = 'lookup'


def clean_phone(value: str) -> str:
    digits = re.sub(r'[\s\-+]', '', value or '')
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    if not re.fullmatch(r'[6-9]\d{9}', digits):
        raise serializers.ValidationError('Enter a valid 10-digit Indian mobile number.')
    return digits


class CreateBooking(serializers.Serializer):
    package = serializers.SlugField()
    travel_date = serializers.DateField()
    travellers = serializers.IntegerField(min_value=1, max_value=100)
    customer_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    pickup_point = serializers.CharField(max_length=200, required=False, allow_blank=True)
    special_requests = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    addons = serializers.ListField(child=serializers.SlugField(), required=False, default=list)
    coupon = serializers.CharField(required=False, allow_blank=True, default='')
    website = serializers.CharField(required=False, allow_blank=True)  # honeypot

    def validate_phone(self, v):
        return clean_phone(v)

    def validate_website(self, v):
        if v:
            raise serializers.ValidationError('Spam detected.')
        return v


def booking_json(b: Booking) -> dict:
    refunds = [{'amount': r.amount, 'percent': r.refund_percent, 'status': r.status} for r in b.refunds.all()]
    return {
        'ref': b.ref, 'status': b.status, 'status_label': b.get_status_display(),
        'package_slug': b.package_slug, 'package_name': b.package_name,
        'travel_date': b.travel_date.isoformat(), 'travellers': b.num_travellers,
        'customer_name': b.customer_name, 'pickup_point': b.pickup_point,
        'festival_label': b.festival_label,
        'price': {
            'unit': b.unit_price, 'total': b.total_amount, 'tax': b.tax_amount,
            'addons': b.addons, 'addons_total': b.addons_amount,
            'discount': b.discount_amount, 'coupon': b.coupon_code,
            'advance': b.advance_amount, 'paid': b.paid_amount, 'balance_due': b.balance_due,
        },
        'cancellation_policy': b.cancellation_policy,
        'refunds': refunds,
        'driver_card': driver_card(b.ref) if b.status in ('assigned', 'completed') else None,
    }


def payment_json(p: Payment) -> dict:
    return {
        'gateway': p.provider, 'order_id': p.provider_order_id, 'amount': p.amount, 'kind': p.kind,
        'public': getattr(p, 'public', {}),
    }


def find_booking(ref: str, phone: str) -> Booking | None:
    try:
        phone = clean_phone(phone)
    except serializers.ValidationError:
        return None
    return Booking.objects.filter(ref=(ref or '').upper().strip(), phone=phone).first()


@api_view(['POST'])
@throttle_classes([BookingThrottle])
def create_booking(request):
    s = CreateBooking(data=request.data)
    s.is_valid(raise_exception=True)
    data = {k: v for k, v in s.validated_data.items() if k != 'website'}
    try:
        booking, payment = services.create_booking(**data)
    except services.BookingError as e:
        return Response({'detail': str(e)}, status=400)
    return Response({'booking': booking_json(booking), 'payment': payment_json(payment)}, status=201)


@api_view(['POST'])
@throttle_classes([LookupThrottle])
def lookup(request):
    b = find_booking(request.data.get('ref'), request.data.get('phone'))
    if not b:
        return Response({'detail': 'No booking found for that reference and phone number.'}, status=404)
    return Response({'booking': booking_json(b)})


@api_view(['POST'])
@throttle_classes([LookupThrottle])
def mock_pay(request):
    """Development only: stands in for the gateway checkout."""
    if settings.PAYMENT_GATEWAY != 'mock':
        return Response({'detail': 'Not available.'}, status=404)
    b = find_booking(request.data.get('ref'), request.data.get('phone'))
    payment = Payment.objects.filter(
        booking=b, provider_order_id=request.data.get('order_id'), status=Payment.Status.CREATED).first() if b else None
    if not payment:
        return Response({'detail': 'Payment not found.'}, status=404)
    services.simulate_mock_payment(b, payment)
    b.refresh_from_db()
    return Response({'booking': booking_json(b)})


@api_view(['POST'])
@throttle_classes([LookupThrottle])
def pay_balance(request):
    b = find_booking(request.data.get('ref'), request.data.get('phone'))
    if not b:
        return Response({'detail': 'Booking not found.'}, status=404)
    try:
        payment = services.start_balance_payment(b)
    except services.BookingError as e:
        return Response({'detail': str(e)}, status=400)
    return Response({'payment': payment_json(payment)})


@api_view(['POST'])
@throttle_classes([LookupThrottle])
def cancel(request):
    b = find_booking(request.data.get('ref'), request.data.get('phone'))
    if not b:
        return Response({'detail': 'Booking not found.'}, status=404)
    try:
        refund = services.cancel_booking(b)
    except services.BookingError as e:
        return Response({'detail': str(e)}, status=400)
    b.refresh_from_db()
    return Response({'booking': booking_json(b), 'refund': refund and {'amount': refund.amount, 'percent': refund.refund_percent}})


@api_view(['POST'])
def payment_webhook(request):
    """Provider webhook: verified by signature, idempotent by event id."""
    gw = get_gateway()
    if not gw.verify_webhook(request.body, request.headers.get('X-Razorpay-Signature', '')):
        return Response({'detail': 'Bad signature.'}, status=400)
    try:
        payload = json.loads(request.body)
        if gw.name == 'razorpay':
            if payload.get('event') != 'payment.captured':
                return Response({'status': 'ignored'})
            entity = payload['payload']['payment']['entity']
            event_id = request.headers.get('X-Razorpay-Event-Id') or entity['id']
            order_id, payment_id = entity['order_id'], entity['id']
        else:
            event_id, order_id, payment_id = payload['event_id'], payload['order_id'], payload['payment_id']
    except (KeyError, ValueError):
        return Response({'detail': 'Malformed payload.'}, status=400)
    try:
        fresh = services.handle_webhook(event_id, order_id, payment_id)
    except Payment.DoesNotExist:
        return Response({'detail': 'Unknown order.'}, status=404)
    return Response({'status': 'processed' if fresh else 'duplicate'})
