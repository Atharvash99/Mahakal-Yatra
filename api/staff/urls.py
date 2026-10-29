from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.login),
    path('me/', views.me),
    path('overview/', views.overview),
    path('bookings/', views.booking_list),
    path('bookings/<str:ref>/', views.booking_detail),
    path('bookings/<str:ref>/assign/', views.booking_assign),
    path('bookings/<str:ref>/cancel/', views.booking_cancel),
    path('bookings/<str:ref>/complete/', views.booking_complete),
    path('bookings/<str:ref>/driver-card/', views.booking_driver_card),
    path('refunds/', views.refund_list),
    path('refunds/<int:refund_id>/process/', views.refund_process),
    path('fleet/', views.fleet),
    path('fleet/drivers/', views.driver_create),
    path('fleet/drivers/<int:driver_id>/active/', views.driver_active),
    path('fleet/drivers/<int:driver_id>/reset-pin/', views.driver_reset_pin),
    path('fleet/vehicles/', views.vehicle_create),
    path('fleet/vehicles/<int:vehicle_id>/active/', views.vehicle_active),
    path('enquiries/', views.enquiry_list),
    path('enquiries/<int:enquiry_id>/', views.enquiry_update),
    path('finance/', views.finance_report),
]
