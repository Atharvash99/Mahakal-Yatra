from rest_framework.generics import CreateAPIView
from rest_framework.throttling import AnonRateThrottle

from .serializers import EnquirySerializer


class EnquiryThrottle(AnonRateThrottle):
    scope = 'enquiry'


class EnquiryCreateView(CreateAPIView):
    serializer_class = EnquirySerializer
    throttle_classes = [EnquiryThrottle]
    permission_classes = []
