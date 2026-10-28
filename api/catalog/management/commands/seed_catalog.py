from django.core.management.base import BaseCommand

from catalog.models import Package

POLICY = [
    {'hours_before': 72, 'refund_percent': 90},
    {'hours_before': 24, 'refund_percent': 50},
    {'hours_before': 0, 'refund_percent': 0},
]

# PLACEHOLDER prices and costs; replace with confirmed supplier rates.
PACKAGES = [
    dict(slug='ujjain-temple-circuit', name='Ujjain Temple Circuit', hindi='उज्जैन',
         tagline='Mahakaleshwar and the major Ujjain temples in one comfortable day',
         duration_days=1, price_per_person=2500, cost_per_person=1750,
         pickup_point='Your Ujjain hotel, Ujjain railway station or Indore (on request)'),
    dict(slug='omkareshwar-day-trip', name='Omkareshwar Day Trip', hindi='ओंकारेश्वर',
         tagline='Omkareshwar Jyotirlinga from Indore or Ujjain',
         duration_days=1, price_per_person=3000, cost_per_person=2100,
         pickup_point='Indore airport, Indore railway station or your Indore/Ujjain hotel'),
    dict(slug='ujjain-omkareshwar-2-days', name='Ujjain + Omkareshwar', hindi='महाकाल यात्रा',
         tagline='Our flagship two-day yatra covering both Jyotirlingas',
         duration_days=2, price_per_person=6500, cost_per_person=4550,
         pickup_point='Indore airport, Indore railway station or your hotel'),
]


class Command(BaseCommand):
    help = 'Create or update the launch packages (placeholder rates).'

    def handle(self, *args, **options):
        for data in PACKAGES:
            obj, created = Package.objects.update_or_create(
                slug=data['slug'], defaults={**data, 'cancellation_policy': POLICY})
            self.stdout.write(f"{'created' if created else 'updated'} {obj.slug}")
