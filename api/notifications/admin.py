from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'kind', 'channel', 'to', 'delivered')
    list_filter = ('kind', 'channel', 'delivered')
    search_fields = ('to', 'body')
