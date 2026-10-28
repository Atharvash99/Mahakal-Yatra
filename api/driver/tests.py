from datetime import date

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from bookings import services
from bookings.models import Booking
from finance import services as finance
from finance.models import Payable
from notifications.models import NotificationLog
from operations.models import Assignment, Driver, Vehicle
from operations.services import reset_driver_pin
from reviews.models import Review

SLUG = 'ujjain-temple-circuit'
PHONE = '9876500000'


class TripLifecycleTests(TestCase):
    """A booking made for today, driven through the driver portal and reviewed."""

    def setUp(self):
        call_command('seed_catalog', verbosity=0)
        self.api = APIClient()
        booking, payment = services.create_booking(
            package=SLUG, travel_date=date.today(), travellers=2, customer_name='Meena Joshi', phone=PHONE,
            pickup_point='Indore airport')
        services.mark_payment_paid(provider_order_id=payment.provider_order_id, provider_payment_id='pay_x')
        self.booking = Booking.objects.get(pk=booking.pk)
        self.driver = Driver.objects.create(name='Ramesh', phone='9000000001')
        self.pin = reset_driver_pin(self.driver)
        vehicle = Vehicle.objects.create(number='MP09AB1234', kind='Innova')
        self.assignment = Assignment.objects.create(booking_ref=booking.ref, driver=self.driver, vehicle=vehicle)
        services.mark_assigned(self.booking)

    def login(self):
        res = self.api.post('/api/driver/login/', {'phone': '9000000001', 'pin': self.pin}, format='json')
        self.assertEqual(res.status_code, 200)
        self.api.credentials(HTTP_AUTHORIZATION=f"Bearer {res.json()['token']}")

    def test_wrong_pin_and_no_token_rejected(self):
        self.assertEqual(self.api.post('/api/driver/login/', {'phone': '9000000001', 'pin': '0000x'}, format='json').status_code, 401)
        self.assertEqual(self.api.get('/api/driver/trips/').status_code, 401)

    def test_driver_runs_trip_and_customer_reviews(self):
        self.login()
        trips = self.api.get('/api/driver/trips/').json()['trips']
        self.assertEqual([t['ref'] for t in trips], [self.booking.ref])
        self.assertEqual(trips[0]['customer_phone'], PHONE)

        tid = trips[0]['id']
        # cannot complete before starting
        self.assertEqual(self.api.post(f'/api/driver/trips/{tid}/complete/', {}, format='json').status_code, 400)
        self.assertEqual(self.api.post(f'/api/driver/trips/{tid}/start/').status_code, 200)
        # cash cannot exceed the balance
        too_much = self.booking.balance_due + 1
        self.assertEqual(self.api.post(f'/api/driver/trips/{tid}/complete/', {'cash_collected': too_much}, format='json').status_code, 400)
        res = self.api.post(f'/api/driver/trips/{tid}/complete/', {'cash_collected': self.booking.balance_due}, format='json')
        self.assertEqual(res.status_code, 200)
        done = Booking.objects.get(pk=self.booking.pk)
        self.assertEqual(done.status, 'completed')
        self.assertEqual(done.balance_due, 0)  # cash collected is recorded as a payment
        self.assertTrue(NotificationLog.objects.filter(kind='review_request').exists())

        # customer review: needs matching phone, one per trip, hidden until approved
        self.api.credentials()
        body = {'ref': self.booking.ref, 'phone': PHONE, 'rating': 5, 'comment': 'Smooth yatra'}
        self.assertEqual(self.api.post('/api/reviews/submit/', {**body, 'phone': '9000099999'}, format='json').status_code, 404)
        self.assertEqual(self.api.post('/api/reviews/submit/', body, format='json').status_code, 201)
        self.assertEqual(self.api.post('/api/reviews/submit/', body, format='json').status_code, 400)
        self.assertEqual(self.api.get('/api/reviews/').json()['count'], 0)
        Review.objects.update(approved=True)
        data = self.api.get(f'/api/reviews/?package={SLUG}').json()
        self.assertEqual((data['count'], data['average']), (1, 5.0))
        self.assertEqual(data['reviews'][0]['name'], 'Meena')  # first name only

    def test_review_requires_completed_trip(self):
        res = self.api.post('/api/reviews/submit/', {'ref': self.booking.ref, 'phone': PHONE, 'rating': 4}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_finance_summary_and_report_page(self):
        Payable.objects.create(supplier_name='City Cabs', amount=1500)
        s = finance.summary(date.today(), date.today())
        self.assertEqual(s['bookings'], 1)
        self.assertEqual(s['revenue'], 5000)
        self.assertEqual(s['payables_outstanding'], 1500)
        self.assertEqual(s['tax'] + s['cost'] + s['margin'], s['revenue'])
        admin = get_user_model().objects.create_superuser('boss', 'b@example.com', 'x')
        self.client.force_login(admin)
        res = self.client.get('/admin/finance/payable/report/')
        self.assertContains(res, 'Finance report')
        self.assertContains(res, 'Ujjain Temple Circuit')
