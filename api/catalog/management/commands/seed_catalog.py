from django.core.management.base import BaseCommand

from catalog.models import Addon, Coupon, Package

# PLACEHOLDER prices, costs and content: replace via the admin once supplier rates are confirmed.

POLICY = [
    {'hours_before': 72, 'refund_percent': 90},
    {'hours_before': 24, 'refund_percent': 50},
    {'hours_before': 0, 'refund_percent': 0},
]

CAB = {'label': 'AC cab with driver for the whole trip', 'keywords': ['cab', 'car', 'taxi', 'vehicle', 'driver', 'transport', 'ac']}
TOLL = {'label': 'Fuel, toll, parking and driver allowance', 'keywords': ['fuel', 'petrol', 'diesel', 'toll', 'parking', 'allowance']}
CARD = {'label': 'Driver card (name, photo, vehicle number) on WhatsApp the night before', 'keywords': ['driver card', 'driver details', 'driver name', 'vehicle number']}
WATER = {'label': 'Bottled water in the vehicle', 'keywords': ['water', 'bottle']}
FOOD = {'label': 'Meals', 'keywords': ['food', 'meal', 'meals', 'lunch', 'dinner', 'breakfast', 'veg']}
ENTRY = {'label': 'Temple entry or special darshan tickets', 'keywords': ['ticket', 'tickets', 'entry', 'darshan', 'vip', 'special darshan', 'temple fee']}
BHASMA = {'label': 'Bhasma Aarti registration or guaranteed access', 'keywords': ['bhasma', 'aarti', 'bhasm', 'registration']}
PERSONAL = {'label': 'Personal expenses, tips and shopping', 'keywords': ['tip', 'tips', 'shopping', 'personal', 'puja items', 'prasad']}

PACKAGES = [
    dict(slug='ujjain-temple-circuit', name='Ujjain Temple Circuit', hindi='उज्जैन',
         tagline='Mahakaleshwar and the major Ujjain temples in one comfortable day',
         duration_days=1, price_per_person=2500, cost_per_person=1750,
         pickup_point='Your Ujjain hotel, Ujjain railway station or Indore (on request)',
         highlights=['Mahakaleshwar Jyotirlinga', 'Kal Bhairav', 'Harsiddhi', 'Ram Ghat', 'Sandipani Ashram', 'Mangalnath'],
         itinerary=[
             {'title': 'Morning', 'detail': 'Pickup, Mahakaleshwar darshan and Ram Ghat.'},
             {'title': 'Midday', 'detail': 'Kal Bhairav and Harsiddhi temples, vegetarian lunch stop.'},
             {'title': 'Afternoon', 'detail': 'Sandipani Ashram and Mangalnath, drop at your stay.'}],
         inclusions=[CAB, TOLL, CARD, WATER], exclusions=[FOOD, ENTRY, BHASMA, PERSONAL]),
    dict(slug='omkareshwar-day-trip', name='Omkareshwar Day Trip', hindi='ओंकारेश्वर',
         tagline='Omkareshwar Jyotirlinga from Indore or Ujjain',
         duration_days=1, price_per_person=3000, cost_per_person=2100,
         pickup_point='Indore airport, Indore railway station or your Indore/Ujjain hotel',
         highlights=['Omkareshwar Jyotirlinga', 'Mamleshwar', 'Narmada ghat'],
         itinerary=[
             {'title': 'Early morning', 'detail': 'Pickup and drive to Omkareshwar.'},
             {'title': 'Midday', 'detail': 'Darshan, Narmada ghat, vegetarian lunch stop.'},
             {'title': 'Evening', 'detail': 'Return drive and drop.'}],
         inclusions=[CAB, TOLL, CARD, WATER], exclusions=[FOOD, ENTRY, PERSONAL]),
    dict(slug='ujjain-omkareshwar-2-days', name='Ujjain + Omkareshwar', hindi='महाकाल यात्रा',
         tagline='Our flagship two-day yatra covering both Jyotirlingas',
         duration_days=2, price_per_person=6500, cost_per_person=4550,
         pickup_point='Indore airport, Indore railway station or your hotel',
         highlights=['Mahakaleshwar Jyotirlinga', 'Omkareshwar Jyotirlinga', 'Kal Bhairav', 'Harsiddhi', 'Ram Ghat'],
         itinerary=[
             {'title': 'Day 1', 'detail': 'Indore pickup, Ujjain temple circuit, overnight stay in Ujjain.'},
             {'title': 'Day 2', 'detail': 'Drive to Omkareshwar, darshan, return and drop at Indore.'}],
         inclusions=[CAB, TOLL, CARD, WATER,
                     {'label': '1 night stay in a standard hotel (twin sharing)', 'keywords': ['hotel', 'stay', 'room', 'night', 'accommodation', 'lodging']},
                     {'label': 'Breakfast at the hotel', 'keywords': ['breakfast']}],
         exclusions=[{'label': 'Lunch and dinner', 'keywords': ['lunch', 'dinner', 'food', 'meal', 'meals', 'veg']},
                     ENTRY, BHASMA, PERSONAL]),
]

ADDONS = [
    dict(slug='guide', name='Hindi-speaking guide', description='Temple history and darshan help', price=800, cost=500),
    dict(slug='puja', name='Puja booking assistance', description='Arranged puja items and pandit coordination', price=500, cost=300, per_person=False),
    dict(slug='photo-video', name='Photo and video', description='Trip photos and a short reel', price=1500, cost=1000),
    dict(slug='prasad', name='Prasad delivery', description='Prasad couriered to your home', price=400, cost=250),
]


class Command(BaseCommand):
    help = 'Create or update launch packages, add-ons and a sample coupon (placeholder values).'

    def handle(self, *args, **options):
        for data in PACKAGES:
            obj, created = Package.objects.update_or_create(
                slug=data['slug'], defaults={**data, 'cancellation_policy': POLICY})
            self.stdout.write(f"{'created' if created else 'updated'} package {obj.slug}")
        for data in ADDONS:
            Addon.objects.update_or_create(slug=data['slug'], defaults=data)
        Coupon.objects.get_or_create(code='YATRA5', defaults=dict(percent_off=5, min_total=2000))
        self.stdout.write('add-ons and coupon YATRA5 ready')
