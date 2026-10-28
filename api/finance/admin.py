from datetime import date, timedelta

from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone

from core.admin import AuditedAdmin

from . import services
from .models import Payable


@admin.register(Payable)
class PayableAdmin(AuditedAdmin):
    list_display = ('supplier_name', 'kind', 'booking_ref', 'amount', 'due_date', 'status')
    list_filter = ('status', 'kind')
    search_fields = ('supplier_name', 'booking_ref')
    actions = ['mark_paid']
    change_list_template = 'finance/payable_changelist.html'

    @admin.action(description='Mark as paid')
    def mark_paid(self, request, queryset):
        queryset.filter(status='pending').update(status='paid', paid_at=timezone.now())

    def get_urls(self):
        return [path('report/', self.admin_site.admin_view(self.report), name='finance_report')] + super().get_urls()

    def report(self, request):
        def parse(key, default):
            try:
                return date.fromisoformat(request.GET.get(key, ''))
            except ValueError:
                return default
        today = date.today()
        start = parse('start', today.replace(day=1))
        end = parse('end', today + timedelta(days=60))
        ctx = {**self.admin_site.each_context(request), 'title': 'Finance report', 's': services.summary(start, end)}
        return TemplateResponse(request, 'finance/report.html', ctx)
