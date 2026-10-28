from django.db import models


class Driver(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    photo_url = models.URLField(blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.5)
    years_experience = models.PositiveSmallIntegerField(default=1)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    number = models.CharField(max_length=20, unique=True)
    kind = models.CharField(max_length=50, help_text='e.g. AC Sedan, Innova, Tempo Traveller')
    capacity = models.PositiveSmallIntegerField(default=4)
    operator_name = models.CharField(max_length=100, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.kind} {self.number}'


class Assignment(models.Model):
    # booking is referenced by its ref string so modules stay decoupled
    booking_ref = models.CharField(max_length=10, db_index=True)
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    pickup_time = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    driver_card_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.booking_ref}: {self.driver} / {self.vehicle}'
