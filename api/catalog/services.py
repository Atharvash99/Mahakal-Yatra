"""Pricing and availability. Other modules call these functions, not the tables."""
import math
from dataclasses import dataclass, asdict
from datetime import date

from django.conf import settings

from .models import Package, PackageDeparture


class QuoteError(ValueError):
    pass


@dataclass
class Quote:
    package: str
    travel_date: str
    travellers: int
    unit_price: int
    total: int          # final price, tax included
    tax: int            # GST portion of the total
    cost: int           # our supplier cost
    margin: int         # total - tax - cost
    advance: int
    balance: int
    advance_percent: int
    festival_label: str
    seats_left: int | None  # None = no cap for this date

    def as_dict(self):
        return asdict(self)


def get_package(slug: str) -> Package:
    try:
        return Package.objects.get(slug=slug, active=True)
    except Package.DoesNotExist:
        raise QuoteError('Unknown package.')


def reserve_seats(slug: str, travel_date: date, n: int) -> None:
    """Take seats on a capped date. Call inside a transaction. No-op on uncapped dates."""
    dep = (PackageDeparture.objects.select_for_update()
           .filter(package__slug=slug, date=travel_date).first())
    if not dep:
        return
    if n > dep.seats_left:
        raise QuoteError(f'Only {dep.seats_left} seats left on this date.')
    dep.seats_booked += n
    dep.save(update_fields=['seats_booked'])


def release_seats(slug: str, travel_date: date, n: int) -> None:
    dep = (PackageDeparture.objects.select_for_update()
           .filter(package__slug=slug, date=travel_date).first())
    if dep:
        dep.seats_booked = max(0, dep.seats_booked - n)
        dep.save(update_fields=['seats_booked'])


def quote(slug: str, travel_date: date, travellers: int, *, departure: PackageDeparture | None = None) -> Quote:
    pkg = get_package(slug)
    if travel_date < date.today():
        raise QuoteError('Travel date cannot be in the past.')
    if not 1 <= travellers <= pkg.max_travellers:
        raise QuoteError(f'Travellers must be between 1 and {pkg.max_travellers}.')

    dep = departure or PackageDeparture.objects.filter(package=pkg, date=travel_date).first()
    unit = (dep.price_override if dep and dep.price_override else pkg.price_per_person)
    seats_left = dep.seats_left if dep else None
    if dep and travellers > dep.seats_left:
        raise QuoteError(f'Only {dep.seats_left} seats left on this date.')

    total = unit * travellers
    gst = settings.GST_PERCENT
    tax = round(total * gst / (100 + gst))
    cost = pkg.cost_per_person * travellers
    advance = math.ceil(total * pkg.advance_percent / 100)
    return Quote(
        package=pkg.slug, travel_date=travel_date.isoformat(), travellers=travellers,
        unit_price=unit, total=total, tax=tax, cost=cost, margin=total - tax - cost,
        advance=advance, balance=total - advance, advance_percent=pkg.advance_percent,
        festival_label=dep.label if dep else '', seats_left=seats_left,
    )
