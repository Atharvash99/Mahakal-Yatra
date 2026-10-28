import re
from datetime import date

from rest_framework import serializers

from .models import Enquiry


class EnquirySerializer(serializers.ModelSerializer):
    # honeypot: real users never see or fill this field
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Enquiry
        fields = [
            'id', 'name', 'phone', 'email', 'package_slug', 'travel_date',
            'travellers', 'pickup_point', 'message', 'website',
        ]
        read_only_fields = ['id']

    def validate_phone(self, value):
        digits = re.sub(r'[\s\-+]', '', value)
        if digits.startswith('91') and len(digits) == 12:
            digits = digits[2:]
        if not re.fullmatch(r'[6-9]\d{9}', digits):
            raise serializers.ValidationError('Enter a valid 10-digit Indian mobile number.')
        return digits

    def validate_travellers(self, value):
        if not 1 <= value <= 100:
            raise serializers.ValidationError('Travellers must be between 1 and 100.')
        return value

    def validate_travel_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError('Travel date cannot be in the past.')
        return value

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError('Spam detected.')
        return value

    def create(self, validated_data):
        validated_data.pop('website', None)
        return super().create(validated_data)
