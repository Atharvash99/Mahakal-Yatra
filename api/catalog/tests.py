from datetime import date, timedelta

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Coupon

SLUG = 'ujjain-omkareshwar-2-days'


class PricingTests(TestCase):
    def setUp(self):
        call_command('seed_catalog', verbosity=0)
        self.api = APIClient()
        self.day = (date.today() + timedelta(days=10)).isoformat()

    def q(self, **kw):
        body = {'package': SLUG, 'travel_date': self.day, 'travellers': 2}
        body.update(kw)
        return self.api.post('/api/quotes/', body, format='json')

    def test_package_api_serves_content(self):
        data = self.api.get('/api/packages/').json()
        self.assertEqual(len(data), 3)
        flagship = self.api.get(f'/api/packages/{SLUG}/').json()
        self.assertEqual(flagship['duration'], '2 days')
        self.assertTrue(flagship['inclusions'] and flagship['itinerary'])

    def test_addons_and_discount_flow_into_total(self):
        res = self.q(addons=['guide', 'puja'], coupon='yatra5').json()
        # 2 x 6500 base; guide 800 per person? (seed: flat) + puja 500
        self.assertEqual(res['base'], 13000)
        self.assertEqual(res['addons_total'], sum(a['amount'] for a in res['addons']))
        self.assertEqual(res['discount'], 13000 * 5 // 100)
        self.assertEqual(res['total'], res['base'] + res['addons_total'] - res['discount'])
        self.assertEqual(res['tax'] + res['cost'] + res['margin'], res['total'])
        self.assertEqual(res['coupon_code'], 'YATRA5')

    def test_bad_coupon_and_addon_rejected(self):
        self.assertEqual(self.q(coupon='NOPE').status_code, 400)
        self.assertEqual(self.q(addons=['does-not-exist']).status_code, 400)

    def test_coupon_limits(self):
        Coupon.objects.create(code='ONCE', flat_off=500, max_uses=1)
        Coupon.objects.filter(code='ONCE').update(used_count=1)
        res = self.q(coupon='once')
        self.assertEqual(res.status_code, 400)
        self.assertIn('fully used', res.json()['detail'])
        Coupon.objects.create(code='OLD', flat_off=100, valid_until=date.today() - timedelta(days=1))
        self.assertIn('expired', self.q(coupon='OLD').json()['detail'])
