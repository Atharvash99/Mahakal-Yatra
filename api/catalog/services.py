"""Pricing and availability. Other modules call these functions, not the tables."""
import math
from dataclasses import asdict, dataclass, field
from datetime import date

from django.conf import settings
from django.db.models import F

from .models import Addon, Coupon, Package, PackageDeparture


class QuoteError(ValueError):
    pass


@dataclass
class Quote:
    package: str
    travel_date: str
    travellers: int
    unit_price: int
    base: int               # unit_price * travellers
    addons: list = field(default_factory=list)   # [{slug, name, amount}]
    addons_total: int = 0
    coupon_code: str = ''
    discount: int = 0
    total: int = 0          # final price, tax included
    tax: int = 0            # GST portion of the total
    cost: int = 0           # our supplier cost
    margin: int = 0         # total - tax - cost
    advance: int = 0
    balance: int = 0
    advance_percent: int = 30
    festival_label: str = ''
    seats_left: int | None = None  # None = no cap for this date

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


def _coupon_discount(code: str, base: int) -> tuple[Coupon, int]:
    try:
        c = Coupon.objects.get(code=code.upper().strip(), active=True)
    except Coupon.DoesNotExist:
        raise QuoteError('This coupon code is not valid.')
    if c.valid_until and c.valid_until < date.today():
        raise QuoteError('This coupon has expired.')
    if c.max_uses is not None and c.used_count >= c.max_uses:
        raise QuoteError('This coupon has been fully used.')
    if base < c.min_total:
        raise QuoteError(f'This coupon needs a minimum booking of Rs {c.min_total}.')
    amount = base * c.percent_off // 100 if c.percent_off else (c.flat_off or 0)
    return c, min(amount, base)


def redeem_coupon(code: str) -> None:
    """Count a use. Call inside the booking transaction."""
    Coupon.objects.filter(code=code.upper().strip()).update(used_count=F('used_count') + 1)


def quote(slug: str, travel_date: date, travellers: int, *, addons=(), coupon: str = '') -> Quote:
    pkg = get_package(slug)
    if travel_date < date.today():
        raise QuoteError('Travel date cannot be in the past.')
    if not 1 <= travellers <= pkg.max_travellers:
        raise QuoteError(f'Travellers must be between 1 and {pkg.max_travellers}.')

    dep = PackageDeparture.objects.filter(package=pkg, date=travel_date).first()
    unit = dep.price_override if dep and dep.price_override else pkg.price_per_person
    seats_left = dep.seats_left if dep else None
    if dep and travellers > dep.seats_left:
        raise QuoteError(f'Only {dep.seats_left} seats left on this date.')

    base = unit * travellers
    cost = pkg.cost_per_person * travellers

    lines, addons_total = [], 0
    for a in Addon.objects.filter(slug__in=list(addons), active=True):
        amount = a.price * (travellers if a.per_person else 1)
        lines.append({'slug': a.slug, 'name': a.name, 'amount': amount})
        addons_total += amount
        cost += a.cost * (travellers if a.per_person else 1)
    if len(lines) != len(set(addons)):
        raise QuoteError('One of the selected add-ons is not available.')

    discount, code = 0, ''
    if coupon:
        c, discount = _coupon_discount(coupon, base)
        code = c.code

    total = base + addons_total - discount
    gst = settings.GST_PERCENT
    tax = round(total * gst / (100 + gst))
    advance = math.ceil(total * pkg.advance_percent / 100)
    return Quote(
        package=pkg.slug, travel_date=travel_date.isoformat(), travellers=travellers,
        unit_price=unit, base=base, addons=lines, addons_total=addons_total, coupon_code=code,
        discount=discount, total=total, tax=tax, cost=cost, margin=total - tax - cost,
        advance=advance, balance=total - advance, advance_percent=pkg.advance_percent,
        festival_label=dep.label if dep else '', seats_left=seats_left,
    )
