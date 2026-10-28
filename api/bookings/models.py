import secrets

from django.db import models

REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def new_ref():
    return 'MY' + ''.join(secrets.choice(REF_ALPHABET) for _ in range(6))


class Booking(models.Model):
    class Status(models.TextChoices):
        ENQUIRY = 'enquiry', 'Enquiry'
        PENDING_PAYMENT = 'pending_payment', 'Pending payment'
        CONFIRMED = 'confirmed', 'Confirmed'
        ASSIGNED = 'assigned', 'Driver assigned'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    # allowed state changes; anything else is rejected
    TRANSITIONS = {
        'enquiry': {'pending_payment', 'cancelled'},
        'pending_payment': {'confirmed', 'cancelled'},
        'confirmed': {'assigned', 'cancelled'},
        'assigned': {'completed', 'cancelled'},
        'completed': set(),
        'cancelled': {'refunded'},
        'refunded': set(),
    }

    ref = models.CharField(max_length=10, unique=True, default=new_ref, editable=False)
    package_slug = models.CharField(max_length=100)
    package_name = models.CharField(max_length=120)
    travel_date = models.DateField()
    num_travellers = models.PositiveSmallIntegerField()
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    pickup_point = models.CharField(max_length=200, blank=True)
    special_requests = models.TextField(blank=True, max_length=1000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)

    # price breakdown frozen at booking time (INR)
    unit_price = models.PositiveIntegerField()
    total_amount = models.PositiveIntegerField()
    tax_amount = models.PositiveIntegerField()
    cost_amount = models.PositiveIntegerField()
    margin_amount = models.IntegerField()
    advance_amount = models.PositiveIntegerField()
    festival_label = models.CharField(max_length=100, blank=True)
    cancellation_policy = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.ref} {self.customer_name} {self.travel_date}'

    @property
    def paid_amount(self):
        return sum(p.amount for p in self.payments.all() if p.status == Payment.Status.PAID)

    @property
    def balance_due(self):
        return max(0, self.total_amount - self.paid_amount)


class Traveller(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='travellers')
    name = models.CharField(max_length=100)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    needs_wheelchair = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Payment(models.Model):
    class Kind(models.TextChoices):
        ADVANCE = 'advance', 'Advance'
        BALANCE = 'balance', 'Balance'

    class Status(models.TextChoices):
        CREATED = 'created', 'Created'
        PAID = 'paid', 'Paid'
        FAILED = 'failed', 'Failed'

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    kind = models.CharField(max_length=10, choices=Kind.choices)
    amount = models.PositiveIntegerField()
    provider = models.CharField(max_length=20)
    provider_order_id = models.CharField(max_length=100, unique=True)
    provider_payment_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CREATED)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.booking.ref} {self.kind} {self.amount} {self.status}'


class Refund(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSED = 'processed', 'Processed'

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    amount = models.PositiveIntegerField()
    refund_percent = models.PositiveSmallIntegerField()
    reason = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.booking.ref} refund {self.amount}'


class WebhookEvent(models.Model):
    """One row per payment-provider event id, so replays are ignored."""

    event_id = models.CharField(max_length=100, unique=True)
    received_at = models.DateTimeField(auto_now_add=True)
