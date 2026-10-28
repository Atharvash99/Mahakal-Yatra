import re
import secrets

from django.contrib.auth.hashers import check_password, make_password

from .models import Assignment, Driver


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
