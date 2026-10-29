from datetime import date, time

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse

from bookings.models import Booking
from bookings import services as booking_services
from core.admin import AuditedAdmin
from core.models import AuditLog

from . import services
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
    change_list_template = 'operations/assignment_changelist.html'

    def get_urls(self):
        return [path('dashboard/', self.admin_site.admin_view(self.dashboard), name='operations_dashboard')]             + super().get_urls()

    def dashboard(self, request):
        if not self.has_view_permission(request):
            return redirect('admin:index')
        if request.method == 'POST':
            return self._assign(request)
        overview = booking_services.staff_overview(date.today())
        refs = {b.ref for b in overview['trips_today']}
        assigned = services.assignments_by_ref(refs)
        ctx = {
            **self.admin_site.each_context(request), 'title': 'Operations dashboard',
            'today': date.today(), 'o': overview,
            'trips': [(b, assigned.get(b.ref)) for b in overview['trips_today']],
            'drivers': Driver.objects.filter(active=True).order_by('name'),
            'vehicles': Vehicle.objects.filter(active=True).order_by('kind', 'number'),
            'can_assign': self.has_add_permission(request),
            'refund_url': reverse('admin:bookings_refund_changelist'),
        }
        return TemplateResponse(request, 'operations/dashboard.html', ctx)

    def _assign(self, request):
        back = redirect('admin:operations_dashboard')
        if not self.has_add_permission(request):
            messages.error(request, 'You do not have permission to assign drivers.')
            return back
        driver = Driver.objects.filter(pk=request.POST.get('driver')).first()
        vehicle = Vehicle.objects.filter(pk=request.POST.get('vehicle')).first()
        if not driver or not vehicle:
            messages.error(request, 'Pick a driver and a vehicle.')
            return back
        pickup = None
        raw = request.POST.get('pickup_time', '')
        if raw:
            try:
                pickup = time.fromisoformat(raw)
            except ValueError:
                messages.error(request, 'Pickup time is not valid.')
                return back
        ref = request.POST.get('ref', '')
        try:
            a = services.assign(ref, driver, vehicle, pickup)
        except booking_services.BookingError as e:
            messages.error(request, str(e))
            return back
        AuditLog.objects.create(actor=request.user, action='create', model=a._meta.label, object_id=str(a.pk),
                                summary=str(a)[:300], changes={'via': 'dashboard'})
        messages.success(request, f'{ref} assigned to {driver.name}.')
        return back

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        booking = Booking.objects.filter(ref=obj.booking_ref).first()
        if booking:
            booking_services.mark_assigned(booking)
