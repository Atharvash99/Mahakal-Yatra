from datetime import date

from rest_framework import serializers
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from .models import PackageDeparture
from .services import QuoteError, quote


class QuoteRequest(serializers.Serializer):
    package = serializers.SlugField()
    travel_date = serializers.DateField()
    travellers = serializers.IntegerField(min_value=1, max_value=100)


@api_view(['POST'])
def quote_view(request):
    s = QuoteRequest(data=request.data)
    s.is_valid(raise_exception=True)
    try:
        d = s.validated_data
        q = quote(d['package'], d['travel_date'], d['travellers'])
    except QuoteError as e:
        return Response({'detail': str(e)}, status=400)
    return Response(q.as_dict())


@api_view(['GET'])
def departures_view(request, slug):
    """Upcoming festival or capped dates for a package."""
    deps = PackageDeparture.objects.filter(package__slug=slug, date__gte=date.today())[:20]
    return Response([
        {'date': d.date.isoformat(), 'label': d.label, 'seats_left': d.seats_left,
         'price': d.price_override or d.package.price_per_person}
        for d in deps
    ])
