from django.contrib import admin

from core.admin import AuditedAdmin

from .models import Package, PackageDeparture


class DepartureInline(admin.TabularInline):
    model = PackageDeparture
    extra = 0
    readonly_fields = ('seats_booked',)


@admin.register(Package)
class PackageAdmin(AuditedAdmin):
    list_display = ('name', 'duration_days', 'price_per_person', 'cost_per_person', 'advance_percent', 'active')
    list_editable = ('active',)
    inlines = [DepartureInline]


@admin.register(PackageDeparture)
class PackageDepartureAdmin(AuditedAdmin):
    list_display = ('package', 'date', 'label', 'seats_total', 'seats_booked', 'price_override')
    list_filter = ('package',)
    readonly_fields = ('seats_booked',)
