from django.db import models


class NotificationLog(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        SMS = 'sms', 'SMS'
        EMAIL = 'email', 'Email'

    channel = models.CharField(max_length=10, choices=Channel.choices)
    to = models.CharField(max_length=100)
    kind = models.CharField(max_length=40)
    body = models.TextField()
    delivered = models.BooleanField(default=False, help_text='False until a real provider is connected')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.kind} to {self.to}'
