from .models import Assignment


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
