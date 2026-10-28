from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking
from notifications import services
from operations.models import Assignment


class Command(BaseCommand):
    help = "Send driver cards for tomorrow's trips. Schedule this nightly (e.g. 8 PM)."

    def handle(self, *args, **options):
        tomorrow = date.today() + timedelta(days=1)
        sent = 0
        for b in Booking.objects.filter(travel_date=tomorrow, status=Booking.Status.ASSIGNED):
            a = Assignment.objects.filter(booking_ref=b.ref, driver_card_sent_at__isnull=True)\
                .select_related('driver', 'vehicle').last()
            if a:
                services.driver_card(b, a)
                a.driver_card_sent_at = timezone.now()
                a.save(update_fields=['driver_card_sent_at'])
                sent += 1
        self.stdout.write(f'Driver cards sent for {sent} bookings')
