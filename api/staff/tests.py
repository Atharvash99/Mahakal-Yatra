from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from bookings import services
from bookings.models import Booking, Refund
from core.models import AuditLog
from customers.models import Enquiry
from operations.models import Assignment, Driver, Vehicle

SLUG = 'ujjain-temple-circuit'
User = get_user_model()


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class StaffApiTests(TestCase):
    def setUp(self):
        cache.clear()  # login throttle state lives in the cache
        call_command('seed_catalog', verbosity=0)
        call_command('setup_roles', verbosity=0)
        self.api = APIClient()
        self.owner = User.objects.create_superuser('owner', 'o@example.com', 'owner-pw-1', first_name='Asha')
        self.ops = self.user('ops', 'Operations manager')
        self.support = self.user('support', 'Support agent')
        self.accountant = self.user('acct', 'Accountant')
        self.driver = Driver.objects.create(name='Ramesh', phone='9000000001')
        self.vehicle = Vehicle.objects.create(number='MP09AB1234', kind='Innova', capacity=6)
        self.booking = self.paid_booking(date.today())

    def user(self, name, group):
        u = User.objects.create_user(name, f'{name}@example.com', 'pw-12345', is_staff=True)
        u.groups.add(Group.objects.get(name=group))
        return u

    def paid_booking(self, when, travellers=2):
        booking, payment = services.create_booking(
            package=SLUG, travel_date=when, travellers=travellers, customer_name='Meena Joshi', phone='9876500000')
        services.mark_payment_paid(provider_order_id=payment.provider_order_id, provider_payment_id=f'p_{booking.ref}')
        return Booking.objects.get(pk=booking.pk)

    def login(self, username, password):
        res = self.api.post('/api/staff/login/', {'username': username, 'password': password}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.api.credentials(HTTP_AUTHORIZATION=f"Bearer {res.json()['token']}")
        return res.json()

    def test_login_and_me(self):
        bad = self.api.post('/api/staff/login/', {'username': 'owner', 'password': 'nope'}, format='json')
        self.assertEqual(bad.status_code, 401)
        data = self.login('owner', 'owner-pw-1')
        self.assertEqual(data['me']['role'], 'Owner')
        self.assertEqual(data['me']['name'], 'Asha')
        self.assertTrue(data['me']['can']['finance'])
        self.assertEqual(self.api.get('/api/staff/me/').json()['username'], 'owner')

    def test_login_is_throttled(self):
        for _ in range(20):
            self.api.post('/api/staff/login/', {'username': 'owner', 'password': 'nope'}, format='json')
        res = self.api.post('/api/staff/login/', {'username': 'owner', 'password': 'owner-pw-1'}, format='json')
        self.assertEqual(res.status_code, 429)

    def test_non_staff_user_cannot_login(self):
        User.objects.create_user('cust', password='pw-12345')
        res = self.api.post('/api/staff/login/', {'username': 'cust', 'password': 'pw-12345'}, format='json')
        self.assertEqual(res.status_code, 401)

    def test_requires_token(self):
        self.assertEqual(self.api.get('/api/staff/overview/').status_code, 401)
        self.api.credentials(HTTP_AUTHORIZATION='Bearer garbage')
        self.assertEqual(self.api.get('/api/staff/overview/').status_code, 401)

    def test_password_change_signs_old_token_out(self):
        self.login('ops', 'pw-12345')
        self.assertEqual(self.api.get('/api/staff/me/').status_code, 200)
        self.ops.set_password('new-pw-6789')
        self.ops.save()
        self.assertEqual(self.api.get('/api/staff/me/').status_code, 401)

    def test_overview_lists_today_and_unassigned(self):
        self.login('ops', 'pw-12345')
        data = self.api.get('/api/staff/overview/').json()
        self.assertEqual([t['ref'] for t in data['trips_today']], [self.booking.ref])
        self.assertEqual([t['ref'] for t in data['unassigned']], [self.booking.ref])
        self.assertEqual(data['pending_refunds'], [])  # operations role has no refund permission
        self.assertNotIn('finance_30d', data)

    def test_assign_moves_booking_and_logs(self):
        self.login('ops', 'pw-12345')
        res = self.api.post(f'/api/staff/bookings/{self.booking.ref}/assign/',
                            {'driver': self.driver.pk, 'vehicle': self.vehicle.pk, 'pickup_time': '06:30'}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        body = res.json()
        self.assertEqual(body['status'], 'assigned')
        self.assertEqual(body['assignment']['driver']['name'], 'Ramesh')
        self.assertEqual(body['assignment']['pickup_time'], '06:30')
        self.assertTrue(AuditLog.objects.filter(actor=self.ops, model='operations.Assignment').exists())
        # a second assignment is rejected
        again = self.api.post(f'/api/staff/bookings/{self.booking.ref}/assign/',
                              {'driver': self.driver.pk, 'vehicle': self.vehicle.pk}, format='json')
        self.assertEqual(again.status_code, 400)
        self.assertEqual(Assignment.objects.count(), 1)

    def test_assign_validates_input(self):
        self.login('ops', 'pw-12345')
        url = f'/api/staff/bookings/{self.booking.ref}/assign/'
        self.assertEqual(self.api.post(url, {}, format='json').status_code, 400)
        bad_time = self.api.post(url, {'driver': self.driver.pk, 'vehicle': self.vehicle.pk, 'pickup_time': 'x'}, format='json')
        self.assertEqual(bad_time.status_code, 400)
        self.assertEqual(self.api.post('/api/staff/bookings/NOPE/assign/', {}, format='json').status_code, 404)

    def test_support_agent_cannot_assign_or_see_fleet(self):
        self.login('support', 'pw-12345')
        res = self.api.post(f'/api/staff/bookings/{self.booking.ref}/assign/',
                            {'driver': self.driver.pk, 'vehicle': self.vehicle.pk}, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.api.get('/api/staff/fleet/').status_code, 403)
        self.assertEqual(self.api.get('/api/staff/finance/').status_code, 403)
        self.assertEqual(self.api.get('/api/staff/bookings/').status_code, 200)

    def test_booking_search_and_filters(self):
        other = self.paid_booking(date.today() + timedelta(days=5))
        self.login('support', 'pw-12345')
        everything = self.api.get('/api/staff/bookings/').json()
        self.assertEqual(everything['total'], 2)
        by_ref = self.api.get('/api/staff/bookings/', {'q': other.ref.lower()}).json()
        self.assertEqual([r['ref'] for r in by_ref['results']], [other.ref])
        by_date = self.api.get('/api/staff/bookings/', {'from': (date.today() + timedelta(days=3)).isoformat()}).json()
        self.assertEqual(by_date['total'], 1)
        self.assertEqual(self.api.get('/api/staff/bookings/', {'status': 'cancelled'}).json()['total'], 0)

    def test_detail_hides_margin_without_finance_permission(self):
        self.login('support', 'pw-12345')
        price = self.api.get(f'/api/staff/bookings/{self.booking.ref}/').json()['price']
        self.assertNotIn('margin', price)
        self.login('owner', 'owner-pw-1')
        price = self.api.get(f'/api/staff/bookings/{self.booking.ref}/').json()['price']
        self.assertIn('margin', price)

    def test_cancel_creates_refund_and_accountant_processes_it(self):
        self.login('support', 'pw-12345')
        res = self.api.post(f'/api/staff/bookings/{self.booking.ref}/cancel/')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()['status'], 'cancelled')
        refund = Refund.objects.get(booking=self.booking)
        # support cannot process refunds, the accountant can
        self.assertEqual(self.api.post(f'/api/staff/refunds/{refund.pk}/process/').status_code, 403)
        self.login('acct', 'pw-12345')
        self.assertEqual(len(self.api.get('/api/staff/refunds/').json()['results']), 1)
        done = self.api.post(f'/api/staff/refunds/{refund.pk}/process/')
        self.assertEqual(done.status_code, 200)
        self.assertEqual(done.json()['status'], 'processed')
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'refunded')
        self.assertEqual(self.api.post(f'/api/staff/refunds/{refund.pk}/process/').status_code, 400)

    def test_complete_and_driver_card(self):
        self.login('ops', 'pw-12345')
        url = f'/api/staff/bookings/{self.booking.ref}'
        self.assertEqual(self.api.post(f'{url}/driver-card/').status_code, 400)  # nobody assigned yet
        self.assertEqual(self.api.post(f'{url}/complete/').status_code, 400)  # not assigned yet
        self.api.post(f'{url}/assign/', {'driver': self.driver.pk, 'vehicle': self.vehicle.pk}, format='json')
        card = self.api.post(f'{url}/driver-card/')
        self.assertEqual(card.status_code, 200)
        self.assertIsNotNone(card.json()['assignment']['driver_card_sent_at'])
        done = self.api.post(f'{url}/complete/')
        self.assertEqual(done.json()['status'], 'completed')

    def test_fleet_create_toggle_and_pin(self):
        self.login('ops', 'pw-12345')
        d = self.api.post('/api/staff/fleet/drivers/', {'name': 'Suresh', 'phone': '+91 90000 00002'}, format='json')
        self.assertEqual(d.status_code, 201, d.content)
        dup = self.api.post('/api/staff/fleet/drivers/', {'name': 'Again', 'phone': '9000000002'}, format='json')
        self.assertEqual(dup.status_code, 400)
        v = self.api.post('/api/staff/fleet/vehicles/', {'number': 'mp 09 cd 5678', 'kind': 'Sedan', 'capacity': 4}, format='json')
        self.assertEqual(v.status_code, 201)
        self.assertEqual(v.json()['number'], 'MP09CD5678')
        bad = self.api.post('/api/staff/fleet/vehicles/', {'number': 'X1', 'kind': 'Bus', 'capacity': 0}, format='json')
        self.assertEqual(bad.status_code, 400)
        did = d.json()['id']
        off = self.api.post(f'/api/staff/fleet/drivers/{did}/active/', {'active': False}, format='json').json()
        self.assertFalse(off['active'])
        pin = self.api.post(f'/api/staff/fleet/drivers/{did}/reset-pin/').json()
        self.assertEqual(len(pin['pin']), 4)
        self.assertTrue(pin['driver']['has_pin'])
        fleet = self.api.get('/api/staff/fleet/').json()
        self.assertEqual(len(fleet['drivers']), 2)
        self.assertEqual(len(fleet['vehicles']), 2)

    def test_enquiries_list_and_update(self):
        e = Enquiry.objects.create(name='Kiran', phone='9876500009')
        self.login('support', 'pw-12345')
        self.assertEqual(len(self.api.get('/api/staff/enquiries/').json()['results']), 1)
        res = self.api.post(f'/api/staff/enquiries/{e.pk}/', {'status': 'contacted', 'internal_notes': 'called'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'contacted')
        self.assertEqual(self.api.post(f'/api/staff/enquiries/{e.pk}/', {'status': 'bogus'}, format='json').status_code, 400)
        self.assertEqual(self.api.get('/api/staff/enquiries/', {'status': 'new'}).json()['results'], [])

    def test_finance_for_owner_and_accountant(self):
        self.login('acct', 'pw-12345')
        res = self.api.get('/api/staff/finance/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['bookings'], 1)
        bad = self.api.get('/api/staff/finance/', {'start': '2026-12-01', 'end': '2026-11-01'})
        self.assertEqual(bad.status_code, 400)
