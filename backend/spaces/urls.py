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
    path('profile/', views.get_user_profile, name='user-profile'),
    
    # URLs específicas para actions personalizadas
    path('spaces/<int:pk>/availability/', views.SpaceViewSet.as_view({'get': 'availability'}), name='space-availability'),
    
    # Adicione estas URLs específicas para reservas
    path('reservations/user/', views.ReservationViewSet.as_view({'get': 'list'}), name='user-reservations'),
    path('reservations/<int:pk>/', views.ReservationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='reservation-detail'),
    path('reservations/', views.ReservationViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='reservation-list'),

    # URL para obter os nomes dos andares para o admin
    path('admin/spaces/get_floor_names/<int:building_id>/', views.get_floor_names_for_admin, name='get_floor_names_for_admin'),
]