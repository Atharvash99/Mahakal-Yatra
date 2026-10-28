from django.urls import path

from . import views

urlpatterns = [
    path('quotes/', views.quote_view, name='quote'),
    path('packages/<slug:slug>/departures/', views.departures_view, name='departures'),
]
