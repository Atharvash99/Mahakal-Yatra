from datetime import date, timedelta

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from bookings import services
from bookings.models import Booking, Payment
from catalog.models import Package, PackageDeparture
from notifications.models import NotificationLog
from operations.models import Assignment, Driver, Vehicle

SLUG = 'ujjain-omkareshwar-2-days'


def payload(**kw):
    base = dict(package=SLUG, travel_date=(date.today() + timedelta(days=10)).isoformat(), travellers=3,
                customer_name='Asha', phone='9876543210')
    base.update(kw)
    return base


class BookingFlowTests(TestCase):
    def setUp(self):
        call_command('seed_catalog', verbosity=0)
        self.api = APIClient()

    def make(self, **kw):
        res = self.api.post('/api/bookings/', payload(**kw), format='json')
        self.assertEqual(res.status_code, 201, res.content)
        return res.json()

    def test_quote_breakdown_adds_up(self):
        res = self.api.post('/api/quotes/', {
            'package': SLUG, 'travel_date': payload()['travel_date'], 'travellers': 3}, format='json').json()
        self.assertEqual(res['total'], 6500 * 3)
        self.assertEqual(res['tax'] + res['cost'] + res['margin'], res['total'])
        self.assertEqual(res['advance'] + res['balance'], res['total'])

    @override_settings(DEBUG=True)  # the mock webhook is only accepted in debug
    def test_payment_confirms_booking_and_is_idempotent(self):
        data = self.make()
        ref, order = data['booking']['ref'], data['payment']['order_id']
        self.assertEqual(data['booking']['status'], 'pending_payment')
        body = {'ref': ref, 'phone': '9876543210', 'order_id': order}
        with self.captureOnCommitCallbacks(execute=True):
            res = self.api.post('/api/bookings/mock-pay/', body, format='json')
        self.assertEqual(res.json()['booking']['status'], 'confirmed')
        # replayed webhook must not double-process
        hook = {'event_id': 'evt_1', 'order_id': order, 'payment_id': 'pay_1'}
        self.assertEqual(self.api.post('/api/webhooks/payment/', hook, format='json').status_code, 200)
        self.assertEqual(self.api.post('/api/webhooks/payment/', hook, format='json').json()['status'], 'duplicate')
        self.assertEqual(Payment.objects.filter(booking__ref=ref, status='paid').count(), 1)
        self.assertEqual(NotificationLog.objects.filter(kind='booking_confirmed').count(), 1)

    def test_lookup_needs_matching_phone(self):
        ref = self.make()['booking']['ref']
        self.assertEqual(self.api.post('/api/bookings/lookup/', {'ref': ref, 'phone': '9000000000'}, format='json').status_code, 404)
        self.assertEqual(self.api.post('/api/bookings/lookup/', {'ref': ref, 'phone': '+91 98765 43210'}, format='json').status_code, 200)

    def test_seat_cap_on_festival_date(self):
        d = date.today() + timedelta(days=30)
        PackageDeparture.objects.create(package=Package.objects.get(slug=SLUG), date=d, label='Mahashivratri', seats_total=4, price_override=9000)
        first = self.make(travel_date=d.isoformat(), travellers=3)
        self.assertEqual(first['booking']['price']['unit'], 9000)
        res = self.api.post('/api/bookings/', payload(travel_date=d.isoformat(), travellers=2), format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('seats left', res.json()['detail'])

    def test_cancel_refunds_by_policy_and_releases_seats(self):
        d = date.today() + timedelta(days=30)
        PackageDeparture.objects.create(package=Package.objects.get(slug=SLUG), date=d, seats_total=10)
        data = self.make(travel_date=d.isoformat(), travellers=2)
        ref, order = data['booking']['ref'], data['payment']['order_id']
        creds = {'ref': ref, 'phone': '9876543210'}
        self.api.post('/api/bookings/mock-pay/', {**creds, 'order_id': order}, format='json')
        res = self.api.post('/api/bookings/cancel/', creds, format='json').json()
        advance = data['payment']['amount']
        self.assertEqual(res['refund']['percent'], 90)
        self.assertEqual(res['refund']['amount'], advance * 90 // 100)
        self.assertEqual(PackageDeparture.objects.get(date=d).seats_booked, 0)
        # cannot cancel twice
        self.assertEqual(self.api.post('/api/bookings/cancel/', creds, format='json').status_code, 400)

    def test_driver_assignment_moves_to_assigned_and_exposes_card(self):
        data = self.make()
        ref, order = data['booking']['ref'], data['payment']['order_id']
        creds = {'ref': ref, 'phone': '9876543210'}
        self.api.post('/api/bookings/mock-pay/', {**creds, 'order_id': order}, format='json')
        driver = Driver.objects.create(name='Ramesh', phone='9000000001')
        vehicle = Vehicle.objects.create(number='MP09AB1234', kind='Innova')
        Assignment.objects.create(booking_ref=ref, driver=driver, vehicle=vehicle)
        services.mark_assigned(Booking.objects.get(ref=ref))
        res = self.api.post('/api/bookings/lookup/', creds, format='json').json()['booking']
        self.assertEqual(res['status'], 'assigned')
        self.assertEqual(res['driver_card']['vehicle_number'], 'MP09AB1234')

    def test_invalid_transition_rejected(self):
        b = Booking.objects.get(ref=self.make()['booking']['ref'])
        with self.assertRaises(services.BookingError):
            services.mark_completed(b)  # pending_payment cannot jump to completed

    def test_rejects_bad_phone_and_past_date(self):
        self.assertEqual(self.api.post('/api/bookings/', payload(phone='123'), format='json').status_code, 400)
        past = (date.today() - timedelta(days=1)).isoformat()
        self.assertEqual(self.api.post('/api/bookings/', payload(travel_date=past), format='json').status_code, 400)



