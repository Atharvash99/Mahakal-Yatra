from django.db import models


class Package(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    hindi = models.CharField(max_length=60, blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    duration_days = models.PositiveSmallIntegerField(default=1)
    pickup_point = models.CharField(max_length=200, blank=True)
    # all amounts in INR per person
    price_per_person = models.PositiveIntegerField(help_text='Final price shown to customers, tax included')
    cost_per_person = models.PositiveIntegerField(help_text='Our supplier cost, used for margin reports')
    advance_percent = models.PositiveSmallIntegerField(default=30)
    max_travellers = models.PositiveSmallIntegerField(default=12, help_text='Per booking (one vehicle group)')
    # cancellation policy as data so refunds can be computed:
    # [{"hours_before": 72, "refund_percent": 90}, ..., {"hours_before": 0, "refund_percent": 0}]
    cancellation_policy = models.JSONField(default=list)
    # page content: edited in the admin, served to the website
    highlights = models.JSONField(default=list, help_text='["Mahakaleshwar", ...]')
    itinerary = models.JSONField(default=list, help_text='[{"title": "Day 1", "detail": "..."}]')
    inclusions = models.JSONField(default=list, help_text='[{"label": "...", "keywords": ["cab"]}]')
    exclusions = models.JSONField(default=list, help_text='[{"label": "...", "keywords": ["lunch"]}]')
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Addon(models.Model):
    """Optional extras sold with any package: hotel, puja, guide, photo and video."""

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200, blank=True)
    price = models.PositiveIntegerField(help_text='INR, tax included')
    cost = models.PositiveIntegerField(default=0, help_text='Our cost, for margin reports')
    per_person = models.BooleanField(default=False)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    percent_off = models.PositiveSmallIntegerField(null=True, blank=True)
    flat_off = models.PositiveIntegerField(null=True, blank=True)
    min_total = models.PositiveIntegerField(default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0, editable=False)
    valid_until = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.code


class PackageDeparture(models.Model):
    """A special date (festival or capped departure) with its own price and seat limit."""

    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='departures')
    date = models.DateField()
    label = models.CharField(max_length=100, blank=True, help_text='e.g. Mahashivratri')
    seats_total = models.PositiveIntegerField()
    seats_booked = models.PositiveIntegerField(default=0, editable=False)
    price_override = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('package', 'date')
        ordering = ['date']

    def __str__(self):
        return f'{self.package.name} {self.date}'

    @property
    def seats_left(self):
        return max(0, self.seats_total - self.seats_booked)
