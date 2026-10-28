from django.contrib import admin

from bookings.models import Booking
from bookings import services as booking_services
from core.admin import AuditedAdmin

from .models import Assignment, Driver, Vehicle


@admin.register(Driver)
class DriverAdmin(AuditedAdmin):
    list_display = ('name', 'phone', 'rating', 'years_experience', 'has_pin', 'active')
    list_editable = ('active',)
    search_fields = ('name', 'phone')
    actions = ['reset_pin']

    @admin.display(boolean=True, description='Portal PIN set')
    def has_pin(self, obj):
        return bool(obj.pin_hash)

    @admin.action(description='Generate a new portal PIN (shown once)')
    def reset_pin(self, request, queryset):
        from .services import reset_driver_pin
        for d in queryset:
            self.message_user(request, f'{d.name}: new PIN is {reset_driver_pin(d)} (share it privately)')


@admin.register(Vehicle)
class VehicleAdmin(AuditedAdmin):
    list_display = ('number', 'kind', 'capacity', 'operator_name', 'active')
    list_editable = ('active',)
    search_fields = ('number',)


@admin.register(Assignment)
class AssignmentAdmin(AuditedAdmin):
    list_display = ('booking_ref', 'driver', 'vehicle', 'pickup_time', 'driver_card_sent_at',
                    'started_at', 'completed_at', 'cash_collected')
    search_fields = ('booking_ref',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        booking = Booking.objects.filter(ref=obj.booking_ref).first()
        if booking:
            booking_services.mark_assigned(booking)
