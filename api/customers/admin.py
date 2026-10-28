from django.contrib import admin

from core.admin import AuditedAdmin

from .models import Enquiry


@admin.register(Enquiry)
class EnquiryAdmin(AuditedAdmin):
    list_display = ('name', 'phone', 'package_slug', 'travel_date', 'travellers', 'status', 'created_at')
    list_filter = ('status', 'package_slug')
    search_fields = ('name', 'phone', 'email')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
