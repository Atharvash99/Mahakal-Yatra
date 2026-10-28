from django.db import models


class Payable(models.Model):
    """Money we owe a supplier (cab operator, hotel, guide) for a trip."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'

    booking_ref = models.CharField(max_length=10, db_index=True, blank=True)
    supplier_name = models.CharField(max_length=120)
    kind = models.CharField(max_length=30, blank=True, help_text='cab, hotel, guide, other')
    description = models.CharField(max_length=200, blank=True)
    amount = models.PositiveIntegerField(help_text='INR')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['status', 'due_date']

    def __str__(self):
        return f'{self.supplier_name} Rs {self.amount} ({self.status})'
