"""Payment gateways. `mock` is for development; `razorpay` needs real keys and has
NOT been tested against the live API yet."""
import hashlib
import hmac
import secrets

import requests
from django.conf import settings


class MockGateway:
    name = 'mock'

    def create_order(self, ref: str, amount_inr: int) -> dict:
        return {'order_id': f'mock_order_{secrets.token_hex(8)}', 'public': {}}

    def verify_webhook(self, raw_body: bytes, signature: str) -> bool:
        return settings.DEBUG


class RazorpayGateway:
    name = 'razorpay'

    def create_order(self, ref: str, amount_inr: int) -> dict:
        res = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            json={'amount': amount_inr * 100, 'currency': 'INR', 'receipt': ref},
            timeout=15,
        )
        res.raise_for_status()
        return {'order_id': res.json()['id'], 'public': {'key': settings.RAZORPAY_KEY_ID}}

    def verify_webhook(self, raw_body: bytes, signature: str) -> bool:
        expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature or '')


def get_gateway():
    return RazorpayGateway() if settings.PAYMENT_GATEWAY == 'razorpay' else MockGateway()
