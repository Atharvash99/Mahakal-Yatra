from django.contrib import admin

from core.admin import AuditedAdmin

from .models import Review


@admin.register(Review)
class ReviewAdmin(AuditedAdmin):
    list_display = ('booking_ref', 'customer_name', 'rating', 'approved', 'created_at')
    list_filter = ('approved', 'rating', 'package_slug')
    list_editable = ('approved',)
    actions = ['approve']

    @admin.action(description='Approve selected reviews')
    def approve(self, request, queryset):
        queryset.update(approved=True)
