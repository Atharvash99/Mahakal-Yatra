from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Addon, Package, PackageDeparture
from .services import QuoteError, quote


class QuoteRequest(serializers.Serializer):
    package = serializers.SlugField()
    travel_date = serializers.DateField()
    travellers = serializers.IntegerField(min_value=1, max_value=100)
    addons = serializers.ListField(child=serializers.SlugField(), required=False, default=list)
    coupon = serializers.CharField(required=False, allow_blank=True, default='')


@api_view(['POST'])
def quote_view(request):
    s = QuoteRequest(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    try:
        q = quote(d['package'], d['travel_date'], d['travellers'], addons=d['addons'], coupon=d['coupon'])
    except QuoteError as e:
        return Response({'detail': str(e)}, status=400)
    return Response(q.as_dict())


def package_json(p: Package) -> dict:
    return {
        'slug': p.slug, 'name': p.name, 'hindi': p.hindi, 'tagline': p.tagline,
        'duration': f'{p.duration_days} day{"s" if p.duration_days > 1 else ""}',
        'price': p.price_per_person, 'pickupPoint': p.pickup_point,
        'advancePercent': p.advance_percent, 'maxTravellers': p.max_travellers,
        'highlights': p.highlights, 'itinerary': p.itinerary,
        'inclusions': p.inclusions, 'exclusions': p.exclusions,
        'cancellation': [
            {'hoursBefore': r['hours_before'], 'refundPercent': r['refund_percent']}
            for r in p.cancellation_policy
        ],
    }


@api_view(['GET'])
def packages_view(request):
    return Response([package_json(p) for p in Package.objects.filter(active=True).order_by('price_per_person')])


@api_view(['GET'])
def package_detail_view(request, slug):
    return Response(package_json(get_object_or_404(Package, slug=slug, active=True)))


@api_view(['GET'])
def addons_view(request):
    return Response([
        {'slug': a.slug, 'name': a.name, 'description': a.description, 'price': a.price, 'perPerson': a.per_person}
        for a in Addon.objects.filter(active=True)
    ])


@api_view(['GET'])
def departures_view(request, slug):
    """Upcoming festival or capped dates for a package."""
    deps = PackageDeparture.objects.filter(package__slug=slug, date__gte=date.today())[:20]
    return Response([
        {'date': d.date.isoformat(), 'label': d.label, 'seats_left': d.seats_left,
         'price': d.price_override or d.package.price_per_person}
        for d in deps
    ])
