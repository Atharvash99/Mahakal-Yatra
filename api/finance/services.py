"""Finance reports built from bookings, refunds and payables."""
from datetime import date

from django.db.models import Count, Sum

from bookings.models import Booking, Refund

from .models import Payable

COUNTED = ('confirmed', 'assigned', 'completed')


def summary(start: date, end: date) -> dict:
    """Revenue, tax, cost, margin, refunds and payables for trips between start and end."""
    qs = Booking.objects.filter(travel_date__range=(start, end), status__in=COUNTED)
    t = qs.aggregate(
        bookings=Count('id'), revenue=Sum('total_amount'), tax=Sum('tax_amount'),
        cost=Sum('cost_amount'), margin=Sum('margin_amount'))
    t = {k: v or 0 for k, v in t.items()}
    by_package = list(
        qs.values('package_name').annotate(bookings=Count('id'), revenue=Sum('total_amount'), margin=Sum('margin_amount'))
        .order_by('-margin'))
    refunds = Refund.objects.filter(booking__travel_date__range=(start, end))
    pending_payables = Payable.objects.filter(status=Payable.Status.PENDING)
    return {
        'start': start, 'end': end, **t,
        'margin_percent': round(t['margin'] * 100 / t['revenue'], 1) if t['revenue'] else 0,
        'refunds_total': refunds.aggregate(s=Sum('amount'))['s'] or 0,
        'refunds_pending': refunds.filter(status='pending').aggregate(s=Sum('amount'))['s'] or 0,
        'payables_outstanding': pending_payables.aggregate(s=Sum('amount'))['s'] or 0,
        'by_package': by_package,
    }
