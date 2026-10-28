from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.login, name='driver-login'),
    path('trips/', views.trips, name='driver-trips'),
    path('trips/<int:trip_id>/start/', views.start_trip, name='driver-start'),
    path('trips/<int:trip_id>/complete/', views.complete_trip, name='driver-complete'),
]
