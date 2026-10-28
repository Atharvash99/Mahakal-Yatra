from datetime import date, timedelta

from django.conf import settings
from django.core import signing
from django.utils import timezone
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from bookings import services as booking_services
from notifications import services as notify
from operations.models import Assignment, Driver
from operations.services import authenticate_driver

SALT = 'driver-portal'
TOKEN_MAX_AGE = 60 * 60 * 24 * 7


class LoginThrottle(AnonRateThrottle):
    rate = '10/hour'  # a 4-digit PIN must not be brute-forceable


def current_driver(request) -> Driver | None:
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    try:
        data = signing.loads(header[7:], salt=SALT, max_age=TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    return Driver.objects.filter(pk=data.get('d'), active=True).first()


def trip_json(a: Assignment, b) -> dict:
    return {
        'id': a.id, 'ref': a.booking_ref,
        'customer_name': b.customer_name, 'customer_phone': b.phone,
        'package': b.package_name, 'travel_date': b.travel_date.isoformat(), 'travellers': b.num_travellers,
        'pickup_point': b.pickup_point, 'pickup_time': a.pickup_time.strftime('%I:%M %p') if a.pickup_time else None,
        'special_requests': b.special_requests, 'balance_due': b.balance_due,
        'vehicle': f'{a.vehicle.kind} {a.vehicle.number}', 'notes': a.notes,
        'started': bool(a.started_at), 'completed': bool(a.completed_at),
    }


@api_view(['POST'])
@throttle_classes([LoginThrottle])
def login(request):
    d = authenticate_driver(request.data.get('phone'), request.data.get('pin'))
    if not d:
        return Response({'detail': 'Wrong phone number or PIN.'}, status=401)
    return Response({'token': signing.dumps({'d': d.pk}, salt=SALT), 'name': d.name})


@api_view(['GET'])
def trips(request):
    driver = current_driver(request)
    if not driver:
        return Response({'detail': 'Please sign in.'}, status=401)
    rows = Assignment.objects.filter(driver=driver).select_related('vehicle').order_by('-created_at')[:60]
    by_ref = booking_services.bookings_by_ref(a.booking_ref for a in rows)
    today = date.today()
    out = []
    for a in rows:
        b = by_ref.get(a.booking_ref)
        if b and b.status in ('assigned', 'completed') and b.travel_date >= today - timedelta(days=1):
            out.append(trip_json(a, b))
    out.sort(key=lambda t: t['travel_date'])
    return Response({'today': today.isoformat(), 'trips': out})


def _own_trip(request, trip_id):
    driver = current_driver(request)
    if not driver:
        return None, None, Response({'detail': 'Please sign in.'}, status=401)
    a = Assignment.objects.filter(pk=trip_id, driver=driver).select_related('vehicle').first()
    b = booking_services.bookings_by_ref([a.booking_ref]).get(a.booking_ref) if a else None
    if not a or not b:
        return None, None, Response({'detail': 'Trip not found.'}, status=404)
    return a, b, None


@api_view(['POST'])
def start_trip(request, trip_id):
    a, b, err = _own_trip(request, trip_id)
    if err:
        return err
    if b.status != 'assigned':
        return Response({'detail': 'This trip cannot be started.'}, status=400)
    if b.travel_date > date.today():
        return Response({'detail': 'This trip is not today.'}, status=400)
    if not a.started_at:
        a.started_at = timezone.now()
        a.save(update_fields=['started_at'])
    return Response(trip_json(a, b))


@api_view(['POST'])
def complete_trip(request, trip_id):
    a, b, err = _own_trip(request, trip_id)
    if err:
        return err
    if not a.started_at:
        return Response({'detail': 'Start the trip first.'}, status=400)
    if a.completed_at:
        return Response(trip_json(a, b))
    try:
        cash = int(request.data.get('cash_collected') or 0)
    except (TypeError, ValueError):
        return Response({'detail': 'Cash collected must be a number.'}, status=400)
    if not 0 <= cash <= b.balance_due:
        return Response({'detail': f'Cash collected must be between 0 and {b.balance_due}.'}, status=400)
    try:
        booking_services.mark_completed(b)
    except booking_services.BookingError as e:
        return Response({'detail': str(e)}, status=400)
    booking_services.record_cash_payment(b, cash)
    a.completed_at = timezone.now()
    a.cash_collected = cash
    a.notes = (a.notes + '\n' + (request.data.get('notes') or '')[:500]).strip()
    a.save(update_fields=['completed_at', 'cash_collected', 'notes'])
    notify.review_request(b, settings.SITE_URL)
    return Response(trip_json(a, b))
