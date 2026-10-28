from django.contrib import admin

from core.admin import AuditedAdmin

from .models import Addon, Coupon, Package, PackageDeparture


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


@admin.register(Addon)
class AddonAdmin(AuditedAdmin):
    list_display = ('name', 'price', 'cost', 'per_person', 'active')
    list_editable = ('active',)


@admin.register(Coupon)
class CouponAdmin(AuditedAdmin):
    list_display = ('code', 'percent_off', 'flat_off', 'min_total', 'used_count', 'max_uses', 'valid_until', 'active')
    list_editable = ('active',)
