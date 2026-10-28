"""Outgoing messages. Today they are written to NotificationLog; connect a
WhatsApp provider (Gupshup, Interakt or Meta Cloud API) inside `_deliver`."""
from .models import NotificationLog


def _deliver(channel: str, to: str, body: str) -> bool:
    # TODO: call the WhatsApp/SMS/email provider here and return True on success.
    return False


def send(channel: str, to: str, kind: str, body: str) -> NotificationLog:
    delivered = _deliver(channel, to, body)
    return NotificationLog.objects.create(channel=channel, to=to, kind=kind, body=body, delivered=delivered)


def booking_confirmed(booking) -> None:
    send('whatsapp', booking.phone, 'booking_confirmed', (
        f'Jai Mahakal {booking.customer_name}! Your {booking.package_name} on {booking.travel_date:%d %b %Y} '
        f'is confirmed. Booking ref: {booking.ref}. Paid: Rs {booking.paid_amount}. '
        f'Balance Rs {booking.balance_due} is payable on the trip. '
        f'We will send your driver details the night before.'
    ))


def driver_card(booking, assignment) -> None:
    d, v = assignment.driver, assignment.vehicle
    pickup = f'{assignment.pickup_time:%I:%M %p}' if assignment.pickup_time else 'as confirmed by our team'
    send('whatsapp', booking.phone, 'driver_card', (
        f'Your MahakalYatra driver card ({booking.ref})\n'
        f'Driver: {d.name} ({d.phone}), rating {d.rating}, {d.years_experience} yrs\n'
        f'Vehicle: {v.kind} {v.number}\n'
        f'Pickup: {booking.pickup_point or "as agreed"} at {pickup}\n'
        f'Balance on trip: Rs {booking.balance_due}'
    ))


def review_request(booking, site_url: str) -> None:
    send('whatsapp', booking.phone, 'review_request', (
        f'Thank you for travelling with MahakalYatra, {booking.customer_name}! '
        f'How was your trip? Rate it here: {site_url}/review?ref={booking.ref}'
    ))


def booking_cancelled(booking, refund_amount: int) -> None:
    send('whatsapp', booking.phone, 'booking_cancelled', (
        f'Your booking {booking.ref} has been cancelled. Refund: Rs {refund_amount} '
        f'(as per the cancellation policy), processed to the original payment method.'
    ))
