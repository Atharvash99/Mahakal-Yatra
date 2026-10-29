"""Booking workflow. All state changes go through these functions."""
import secrets
from datetime import datetime, time

from django.db import transaction
from django.utils import timezone

from catalog import services as catalog
from notifications import services as notify

from .gateways import get_gateway
from .models import Booking, Payment, Refund, Traveller, WebhookEvent


class BookingError(ValueError):
    pass


def _set_status(booking: Booking, new: str) -> None:
    if new not in Booking.TRANSITIONS[booking.status]:
        raise BookingError(f'Cannot change a {booking.status} booking to {new}.')
    booking.status = new
    booking.save(update_fields=['status', 'updated_at'])


def _new_payment(booking: Booking, kind: str, amount: int) -> Payment:
    gw = get_gateway()
    order = gw.create_order(booking.ref, amount)
    payment = Payment.objects.create(
        booking=booking, kind=kind, amount=amount, provider=gw.name, provider_order_id=order['order_id'])
    payment.public = order['public']
    return payment


@transaction.atomic
def create_booking(*, package, travel_date, travellers, customer_name, phone, email='',
                   pickup_point='', special_requests='', traveller_names=(),
                   addons=(), coupon='') -> tuple[Booking, Payment]:
    try:
        q = catalog.quote(package, travel_date, travellers, addons=addons, coupon=coupon)
        catalog.reserve_seats(package, travel_date, travellers)
        if q.coupon_code:
            catalog.redeem_coupon(q.coupon_code)
    except catalog.QuoteError as e:
        raise BookingError(str(e))
    pkg = catalog.get_package(package)
    booking = Booking.objects.create(
        package_slug=pkg.slug, package_name=pkg.name, travel_date=travel_date, num_travellers=travellers,
        customer_name=customer_name, phone=phone, email=email, pickup_point=pickup_point,
        special_requests=special_requests, unit_price=q.unit_price, total_amount=q.total,
        tax_amount=q.tax, cost_amount=q.cost, margin_amount=q.margin, advance_amount=q.advance,
        festival_label=q.festival_label, cancellation_policy=pkg.cancellation_policy,
        addons=q.addons, addons_amount=q.addons_total, discount_amount=q.discount, coupon_code=q.coupon_code,
    )
    for t in traveller_names:
        Traveller.objects.create(booking=booking, name=t)
    return booking, _new_payment(booking, Payment.Kind.ADVANCE, q.advance)


@transaction.atomic
def mark_payment_paid(*, provider_order_id: str, provider_payment_id: str) -> Payment:
    """Idempotent: safe to call many times for the same payment (webhook retries)."""
    payment = Payment.objects.select_for_update().get(provider_order_id=provider_order_id)
    if payment.status == Payment.Status.PAID:
        return payment
    payment.status = Payment.Status.PAID
    payment.provider_payment_id = provider_payment_id
    payment.paid_at = timezone.now()
    payment.save(update_fields=['status', 'provider_payment_id', 'paid_at'])
    booking = Booking.objects.select_for_update().get(pk=payment.booking_id)
    if payment.kind == Payment.Kind.ADVANCE and booking.status == Booking.Status.PENDING_PAYMENT:
        _set_status(booking, Booking.Status.CONFIRMED)
        transaction.on_commit(lambda: notify.booking_confirmed(booking))
    return payment


def handle_webhook(event_id: str, order_id: str, payment_id: str) -> bool:
    """Returns False if this event was already processed."""
    with transaction.atomic():
        _, created = WebhookEvent.objects.get_or_create(event_id=event_id)
        if not created:
            return False
        mark_payment_paid(provider_order_id=order_id, provider_payment_id=payment_id)
    return True


def simulate_mock_payment(booking: Booking, payment: Payment) -> Payment:
    if payment.provider != 'mock':
        raise BookingError('Mock payments are only available with the mock gateway.')
    return mark_payment_paid(
        provider_order_id=payment.provider_order_id, provider_payment_id=f'mock_pay_{secrets.token_hex(8)}')


def start_balance_payment(booking: Booking) -> Payment:
    if booking.status not in (Booking.Status.CONFIRMED, Booking.Status.ASSIGNED) or booking.balance_due <= 0:
        raise BookingError('No balance is due on this booking.')
    return _new_payment(booking, Payment.Kind.BALANCE, booking.balance_due)


def record_cash_payment(booking: Booking, amount: int) -> Payment | None:
    """Balance collected in cash by the driver, so the booking shows what was actually paid."""
    if amount <= 0:
        return None
    return Payment.objects.create(
        booking=booking, kind=Payment.Kind.BALANCE, amount=amount, provider='cash',
        provider_order_id=f'cash_{booking.ref}_{secrets.token_hex(4)}',
        status=Payment.Status.PAID, paid_at=timezone.now())


def refund_percent_for(booking: Booking, now=None) -> int:
    now = now or timezone.now()
    trip_start = timezone.make_aware(datetime.combine(booking.travel_date, time(6, 0)))
    hours_left = (trip_start - now).total_seconds() / 3600
    for rule in sorted(booking.cancellation_policy, key=lambda r: -r['hours_before']):
        if hours_left >= rule['hours_before']:
            return rule['refund_percent']
    return 0


@transaction.atomic
def cancel_booking(booking: Booking) -> Refund | None:
    booking = Booking.objects.select_for_update().get(pk=booking.pk)
    was_paid = booking.paid_amount
    _set_status(booking, Booking.Status.CANCELLED)
    catalog.release_seats(booking.package_slug, booking.travel_date, booking.num_travellers)
    if was_paid <= 0:
        return None
    pct = refund_percent_for(booking)
    refund = Refund.objects.create(
        booking=booking, amount=was_paid * pct // 100, refund_percent=pct, reason='Customer cancellation')
    transaction.on_commit(lambda: notify.booking_cancelled(booking, refund.amount))
    return refund


def mark_refund_processed(refund: Refund) -> None:
    with transaction.atomic():
        refund.status = Refund.Status.PROCESSED
        refund.save(update_fields=['status'])
        booking = refund.booking
        if booking.status == Booking.Status.CANCELLED:
            _set_status(booking, Booking.Status.REFUNDED)


def bookings_by_ref(refs) -> dict:
    return {b.ref: b for b in Booking.objects.filter(ref__in=list(refs))}


def find_for_customer(ref: str, phone: str) -> Booking | None:
    """The booking a customer may see: reference and phone must both match."""
    return Booking.objects.filter(ref=(ref or '').upper().strip(), phone=phone).first()


def mark_assigned(booking: Booking) -> None:
    if booking.status == Booking.Status.CONFIRMED:
        _set_status(booking, Booking.Status.ASSIGNED)


def mark_completed(booking: Booking) -> None:
    _set_status(booking, Booking.Status.COMPLETED)


def staff_overview(today) -> dict:
    """What the ops team needs each morning: today's trips, bookings still needing a driver, refunds to pay."""
    live = (Booking.Status.CONFIRMED, Booking.Status.ASSIGNED)
    return {
        'trips_today': list(Booking.objects.filter(travel_date=today, status__in=live).order_by('created_at')),
        'unassigned': list(Booking.objects.filter(
            status=Booking.Status.CONFIRMED, travel_date__gte=today).order_by('travel_date', 'created_at')),
        'pending_refunds': list(Refund.objects.filter(status=Refund.Status.PENDING)
                                .select_related('booking').order_by('created_at')),
    }


def get_by_ref(ref: str) -> Booking | None:
    return Booking.objects.filter(ref=ref).first()
