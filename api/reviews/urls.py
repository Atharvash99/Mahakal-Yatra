from django.urls import path

from . import views

urlpatterns = [
    path('reviews/', views.list_reviews, name='reviews'),
    path('reviews/submit/', views.submit_review, name='review-submit'),
]
