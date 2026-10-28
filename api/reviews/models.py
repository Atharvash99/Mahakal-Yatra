from django.db import models


class Review(models.Model):
    booking_ref = models.CharField(max_length=10, unique=True)
    package_slug = models.CharField(max_length=100, db_index=True)
    customer_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, max_length=1000)
    approved = models.BooleanField(default=False, help_text='Only approved reviews are shown on the website')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.booking_ref} {self.rating}★'
