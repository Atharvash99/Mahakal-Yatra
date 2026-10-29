from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from bookings import services
from bookings.models import Booking
from core.models import AuditLog
from operations.models import Assignment, Driver, Vehicle

SLUG = 'ujjain-temple-circuit'


class DashboardTests(TestCase):
    def setUp(self):
        call_command('seed_catalog', verbosity=0)
        self.booking = self.paid_booking(date.today())
        self.driver = Driver.objects.create(name='Ramesh', phone='9000000001')
        self.vehicle = Vehicle.objects.create(number='MP09AB1234', kind='Innova', capacity=6)
        self.staff = get_user_model().objects.create_superuser('boss', 'boss@example.com', 'pw')
        self.client.force_login(self.staff)

    def paid_booking(self, when, travellers=2):
        booking, payment = services.create_booking(
            package=SLUG, travel_date=when, travellers=travellers, customer_name='Meena', phone='9876500000')
        services.mark_payment_paid(provider_order_id=payment.provider_order_id, provider_payment_id=f'p_{booking.ref}')
        return Booking.objects.get(pk=booking.pk)

    def post_assign(self, ref, **extra):
        data = {'ref': ref, 'driver': self.driver.pk, 'vehicle': self.vehicle.pk, 'pickup_time': '06:30', **extra}
        return self.client.post('/admin/operations/assignment/dashboard/', data)

    def test_dashboard_lists_unassigned_and_todays_trips(self):
        res = self.client.get('/admin/operations/assignment/dashboard/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, self.booking.ref)
        self.assertContains(res, 'Not assigned')

    def test_one_click_assign_moves_booking_and_logs(self):
        res = self.post_assign(self.booking.ref)
        self.assertEqual(res.status_code, 302)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.ASSIGNED)
        a = Assignment.objects.get(booking_ref=self.booking.ref)
        self.assertEqual(a.pickup_time.strftime('%H:%M'), '06:30')
        self.assertTrue(AuditLog.objects.filter(model='operations.Assignment', object_id=str(a.pk)).exists())

    def test_assign_twice_rejected(self):
        self.post_assign(self.booking.ref)
        self.post_assign(self.booking.ref)
        self.assertEqual(Assignment.objects.filter(booking_ref=self.booking.ref).count(), 1)

    def test_vehicle_too_small_rejected(self):
        big = self.paid_booking(date.today() + timedelta(days=2), travellers=8)
        self.post_assign(big.ref)
        self.assertFalse(Assignment.objects.filter(booking_ref=big.ref).exists())

    def test_user_without_add_permission_cannot_assign(self):
        viewer = get_user_model().objects.create_user('viewer', password='pw', is_staff=True)
        from django.contrib.auth.models import Permission
        viewer.user_permissions.add(Permission.objects.get(codename='view_assignment'))
        self.client.force_login(viewer)
        self.post_assign(self.booking.ref)
        self.assertFalse(Assignment.objects.exists())
