from django.contrib import admin, messages

from core.admin import AuditedAdmin
from operations import services as operations
from operations.models import Assignment

from . import services
from .models import Booking, Payment, Refund, Traveller


class TravellerInline(admin.TabularInline):
    model = Traveller
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('kind', 'amount', 'provider', 'provider_order_id', 'provider_payment_id', 'status', 'paid_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(AuditedAdmin):
    list_display = ('ref', 'customer_name', 'phone', 'package_name', 'travel_date', 'num_travellers',
                    'status', 'total_amount', 'paid', 'driver')
    list_filter = ('status', 'package_slug', 'travel_date')
    search_fields = ('ref', 'customer_name', 'phone')
    readonly_fields = ('ref', 'unit_price', 'total_amount', 'tax_amount', 'cost_amount', 'margin_amount',
                       'advance_amount', 'cancellation_policy', 'created_at', 'updated_at', 'status')
    inlines = [TravellerInline, PaymentInline]
    actions = ['assign_driver_hint', 'send_driver_card', 'complete_trips']

    @admin.display(description='Paid')
    def paid(self, obj):
        return obj.paid_amount

    @admin.display(description='Driver')
    def driver(self, obj):
        a = Assignment.objects.filter(booking_ref=obj.ref).select_related('driver').last()
        return a.driver.name if a else '-'

    @admin.action(description='How to assign a driver')
    def assign_driver_hint(self, request, queryset):
        self.message_user(request, 'Create an Assignment under Operations > Assignments using the booking ref.')

    @admin.action(description='Send driver card on WhatsApp')
    def send_driver_card(self, request, queryset):
        for b in queryset:
            if not operations.send_driver_card(b):
                self.message_user(request, f'{b.ref}: no driver assigned yet.', messages.WARNING)
        self.message_user(request, 'Driver cards queued (see Notifications).')

    @admin.action(description='Mark trip completed')
    def complete_trips(self, request, queryset):
        for b in queryset:
            try:
                services.mark_completed(b)
            except services.BookingError as e:
                self.message_user(request, f'{b.ref}: {e}', messages.ERROR)


@admin.register(Payment)
class PaymentAdmin(AuditedAdmin):
    list_display = ('booking', 'kind', 'amount', 'provider', 'status', 'paid_at')
    list_filter = ('status', 'kind', 'provider')
    search_fields = ('booking__ref', 'provider_order_id', 'provider_payment_id')


@admin.register(Refund)
class RefundAdmin(AuditedAdmin):
    list_display = ('booking', 'amount', 'refund_percent', 'status', 'created_at')
    list_filter = ('status',)
    actions = ['mark_processed']

    @admin.action(description='Mark refund as processed')
    def mark_processed(self, request, queryset):
        for r in queryset.filter(status=Refund.Status.PENDING):
            services.mark_refund_processed(r)
