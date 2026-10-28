from django.urls import path

from . import views

urlpatterns = [
    path('bookings/', views.create_booking, name='booking-create'),
    path('bookings/lookup/', views.lookup, name='booking-lookup'),
    path('bookings/mock-pay/', views.mock_pay, name='booking-mock-pay'),
    path('bookings/pay-balance/', views.pay_balance, name='booking-pay-balance'),
    path('bookings/cancel/', views.cancel, name='booking-cancel'),
    path('webhooks/payment/', views.payment_webhook, name='payment-webhook'),
]
