from django.urls import path

from . import views

urlpatterns = [
    path('quotes/', views.quote_view, name='quote'),
    path('packages/', views.packages_view, name='packages'),
    path('packages/<slug:slug>/', views.package_detail_view, name='package-detail'),
    path('packages/<slug:slug>/departures/', views.departures_view, name='departures'),
    path('addons/', views.addons_view, name='addons'),
]
