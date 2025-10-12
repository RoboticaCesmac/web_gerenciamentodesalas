from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'buildings', views.BuildingViewSet)
router.register(r'space-types', views.SpaceTypeViewSet)
router.register(r'spaces', views.SpaceViewSet)
router.register(r'reservations', views.ReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),
    path('floor-plans/<int:plan_id>/', views.get_floor_plan, name='get_floor_plan'),
    path('buildings/<int:building_id>/floors/', views.get_building_floors),
    path('floors/<int:floor_id>/spaces/', views.get_floor_spaces),
    path('profile/', views.get_user_profile, name='user-profile'),  # Nova rota
]
