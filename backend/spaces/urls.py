from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from . import views

# Criar router para ViewSets
router = DefaultRouter()
router.register(r'reservations', views.ReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),  # Inclui as rotas do router
    path('auth/login/', obtain_auth_token, name='auth_login'),
    path('buildings/', views.BuildingList.as_view(), name='building-list'),
    path('buildings/<int:pk>/floors/', views.FloorList.as_view(), name='floor-list'),
    path('spaces/', views.SpaceList.as_view(), name='space-list'),
    path('spaces/<int:pk>/availability/', views.SpaceAvailability.as_view(), name='space-availability'),
    path('users/profile/', views.UserProfile.as_view(), name='user-profile'),
]