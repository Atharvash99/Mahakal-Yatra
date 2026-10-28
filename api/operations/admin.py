from django.contrib import admin

from bookings.models import Booking
from bookings import services as booking_services
from core.admin import AuditedAdmin

from .models import Assignment, Driver, Vehicle


@admin.register(Driver)
class DriverAdmin(AuditedAdmin):
    list_display = ('name', 'phone', 'rating', 'years_experience', 'active')
    list_editable = ('active',)
    search_fields = ('name', 'phone')


@admin.register(Vehicle)
class VehicleAdmin(AuditedAdmin):
    list_display = ('number', 'kind', 'capacity', 'operator_name', 'active')
    list_editable = ('active',)
    search_fields = ('number',)


@admin.register(Assignment)
class AssignmentAdmin(AuditedAdmin):
    list_display = ('booking_ref', 'driver', 'vehicle', 'pickup_time', 'driver_card_sent_at')
    search_fields = ('booking_ref',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        booking = Booking.objects.filter(ref=obj.booking_ref).first()
        if booking:
            booking_services.mark_assigned(booking)
