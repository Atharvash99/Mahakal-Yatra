import re
import secrets

from django.contrib.auth.hashers import check_password, make_password

from django.utils import timezone

from bookings import services as booking_services
from notifications import services as notify

from .models import Assignment, Driver, Vehicle


def driver_card(booking_ref: str) -> dict | None:
    a = Assignment.objects.filter(booking_ref=booking_ref).select_related('driver', 'vehicle').last()
    if not a:
        return None
    return {
        'driver_name': a.driver.name,
        'driver_phone': a.driver.phone,
        'photo_url': a.driver.photo_url,
        'rating': str(a.driver.rating),
        'years_experience': a.driver.years_experience,
        'vehicle': a.vehicle.kind,
        'vehicle_number': a.vehicle.number,
        'pickup_time': a.pickup_time.strftime('%I:%M %p') if a.pickup_time else None,
    }


def reset_driver_pin(driver: Driver) -> str:
    """Generate a new 4-digit PIN; only its hash is stored. Show the PIN once to staff."""
    pin = f'{secrets.randbelow(10000):04d}'
    driver.pin_hash = make_password(pin)
    driver.save(update_fields=['pin_hash'])
    return pin


def authenticate_driver(phone: str, pin: str) -> Driver | None:
    digits = re.sub(r'\D', '', phone or '')[-10:]
    driver = Driver.objects.filter(phone__endswith=digits, active=True).first() if len(digits) == 10 else None
    if driver and driver.pin_hash and check_password(pin or '', driver.pin_hash):
        return driver
    return None


def assignments_by_ref(refs) -> dict:
    """Latest assignment per booking ref."""
    out = {}
    for a in Assignment.objects.filter(booking_ref__in=list(refs)).select_related('driver', 'vehicle').order_by('id'):
        out[a.booking_ref] = a
    return out


def assign(booking_ref: str, driver: Driver, vehicle: Vehicle, pickup_time=None) -> Assignment:
    """One-click assignment: creates the Assignment and moves the booking to assigned."""
    booking = booking_services.get_by_ref(booking_ref)
    if not booking:
        raise booking_services.BookingError('Unknown booking.')
    if booking.status != 'confirmed':
        raise booking_services.BookingError(f'{booking_ref} is {booking.status}; only confirmed bookings can be assigned.')
    if not driver.active or not vehicle.active:
        raise booking_services.BookingError('Driver and vehicle must be active.')
    if vehicle.capacity < booking.num_travellers:
        raise booking_services.BookingError(
            f'{vehicle} seats {vehicle.capacity}, booking has {booking.num_travellers} travellers.')
    a = Assignment.objects.create(booking_ref=booking_ref, driver=driver, vehicle=vehicle, pickup_time=pickup_time)
    booking_services.mark_assigned(booking)
    return a


def get_driver(pk) -> Driver | None:
    return Driver.objects.filter(pk=pk).first()


def get_vehicle(pk) -> Vehicle | None:
    return Vehicle.objects.filter(pk=pk).first()


def fleet() -> dict:
    return {'drivers': list(Driver.objects.order_by('-active', 'name')),
            'vehicles': list(Vehicle.objects.order_by('-active', 'kind', 'number'))}


def send_driver_card(booking) -> Assignment | None:
    """Send the driver card to the customer; returns None when no driver is assigned yet."""
    a = Assignment.objects.filter(booking_ref=booking.ref).select_related('driver', 'vehicle').last()
    if not a:
        return None
    notify.driver_card(booking, a)
    a.driver_card_sent_at = timezone.now()
    a.save(update_fields=['driver_card_sent_at'])
    return a


class OperationsError(ValueError):
    pass


def create_driver(*, name: str, phone: str, years_experience: int = 1) -> Driver:
    digits = re.sub(r'\D', '', phone or '')[-10:]
    if not name.strip():
        raise OperationsError('Driver name is required.')
    if len(digits) != 10:
        raise OperationsError('Phone must be a 10-digit number.')
    if Driver.objects.filter(phone__endswith=digits).exists():
        raise OperationsError('A driver with this phone number already exists.')
    return Driver.objects.create(name=name.strip()[:100], phone=digits, years_experience=max(0, min(60, years_experience)))


def create_vehicle(*, number: str, kind: str, capacity: int, operator_name: str = '') -> Vehicle:
    number = re.sub(r'\s+', '', number or '').upper()
    if not number or not kind.strip():
        raise OperationsError('Vehicle number and type are required.')
    if not 1 <= capacity <= 60:
        raise OperationsError('Seats must be between 1 and 60.')
    if Vehicle.objects.filter(number=number).exists():
        raise OperationsError('A vehicle with this number already exists.')
    return Vehicle.objects.create(number=number[:20], kind=kind.strip()[:50], capacity=capacity,
                                  operator_name=operator_name.strip()[:100])


def set_active(obj, active: bool) -> None:
    obj.active = active
    obj.save(update_fields=['active'])
