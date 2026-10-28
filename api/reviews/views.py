import re

from django.conf import settings
from django.db.models import Avg, Count
from rest_framework import serializers
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from bookings.services import find_for_customer

from .models import Review


class ReviewThrottle(AnonRateThrottle):
    rate = '20/hour'


class ReviewIn(serializers.Serializer):
    ref = serializers.CharField(max_length=10)
    phone = serializers.CharField(max_length=20)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)


def _phone(v: str) -> str:
    d = re.sub(r'[\s\-+]', '', v)
    return d[2:] if d.startswith('91') and len(d) == 12 else d


@api_view(['POST'])
@throttle_classes([ReviewThrottle])
def submit_review(request):
    s = ReviewIn(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    booking = find_for_customer(d['ref'], _phone(d['phone']))
    if not booking:
        return Response({'detail': 'No booking found for that reference and phone number.'}, status=404)
    if booking.status != 'completed':
        return Response({'detail': 'You can review once your trip is completed.'}, status=400)
    if Review.objects.filter(booking_ref=booking.ref).exists():
        return Response({'detail': 'You have already reviewed this trip. Thank you!'}, status=400)
    Review.objects.create(
        booking_ref=booking.ref, package_slug=booking.package_slug, customer_name=booking.customer_name.split()[0],
        rating=d['rating'], comment=d.get('comment', ''))
    # happy customers are pointed to Google; the Google profile is the strongest local trust signal
    google = settings.GOOGLE_REVIEW_URL if d['rating'] >= 4 else ''
    return Response({'status': 'received', 'google_review_url': google}, status=201)


@api_view(['GET'])
def list_reviews(request):
    qs = Review.objects.filter(approved=True)
    if request.query_params.get('package'):
        qs = qs.filter(package_slug=request.query_params['package'])
    stats = qs.aggregate(avg=Avg('rating'), count=Count('id'))
    return Response({
        'average': round(stats['avg'], 1) if stats['avg'] else None,
        'count': stats['count'],
        'reviews': [
            {'name': r.customer_name, 'rating': r.rating, 'comment': r.comment,
             'package': r.package_slug, 'date': r.created_at.date().isoformat()}
            for r in qs[:12]
        ],
    })
