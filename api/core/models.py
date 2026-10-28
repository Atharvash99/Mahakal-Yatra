from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Every manual change made in the admin panel."""

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=20)
    model = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    summary = models.CharField(max_length=300, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} {self.model}#{self.object_id}'
