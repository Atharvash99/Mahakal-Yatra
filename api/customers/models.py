from django.db import models


class Enquiry(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        CONVERTED = 'converted', 'Converted to booking'
        LOST = 'lost', 'Lost'

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    package_slug = models.CharField(max_length=100, blank=True)
    travel_date = models.DateField(null=True, blank=True)
    travellers = models.PositiveSmallIntegerField(default=1)
    pickup_point = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True, max_length=1000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    internal_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'enquiries'

    def __str__(self):
        return f'{self.name} ({self.phone})'
