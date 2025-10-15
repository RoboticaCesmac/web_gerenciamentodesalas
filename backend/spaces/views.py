from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models  # Add this import
from .models import Building, SpaceType, Space, Reservation, FloorPlan
from .serializers import (
    BuildingSerializer, SpaceTypeSerializer, 
    SpaceSerializer, ReservationSerializer, UserProfileSerializer
)
from rest_framework.authentication import TokenAuthentication
from django.utils.dateparse import parse_datetime
import pytz

User = get_user_model()

class BuildingViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

class SpaceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SpaceType.objects.all()
    serializer_class = SpaceTypeSerializer
    permission_classes = [IsAuthenticated]

class SpaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Space.objects.filter(is_active=True)
    serializer_class = SpaceSerializer
    
    def get_permissions(self):
        if self.action == 'availability':
            return [AllowAny()]  # Permitir acesso não autenticado para verificar disponibilidade
        return [IsAuthenticated()]

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        space = self.get_object()
        start_time = request.query_params.get('start_time')
        end_time = request.query_params.get('end_time')
        
        if not start_time or not end_time:
            return Response({
                'error': 'start_time and end_time parameters are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            brazil_tz = pytz.timezone('America/Sao_Paulo')
            
            # Converter strings para datetime com timezone
            start_time = timezone.datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_time = timezone.datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            # Garantir que as datas têm timezone
            if timezone.is_naive(start_time):
                start_time = timezone.make_aware(start_time, brazil_tz)
            if timezone.is_naive(end_time):
                end_time = timezone.make_aware(end_time, brazil_tz)
            
            # Converter para timezone de Brasília
            start_time = start_time.astimezone(brazil_tz)
            end_time = end_time.astimezone(brazil_tz)

            # Buscar todas as reservas aprovadas ou pendentes para o período
            overlapping_reservations = Reservation.objects.filter(
                space=space,
                status__in=['approved', 'pending'],
                start_datetime__lt=end_time,
                end_datetime__gt=start_time
            ).select_related('user')

            # Formatação das reservas conflitantes
            conflicting_reservations = [{
                'id': res.id,
                'title': res.title,
                'start_datetime': res.start_datetime.astimezone(brazil_tz).isoformat(),
                'end_datetime': res.end_datetime.astimezone(brazil_tz).isoformat(),
                'status': res.status,
                'is_mine': request.user.is_authenticated and res.user == request.user
            } for res in overlapping_reservations]

            return Response({
                'is_available': not overlapping_reservations.exists(),
                'requested_period': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat()
                },
                'conflicting_reservations': conflicting_reservations,
                'is_authenticated': request.user.is_authenticated
            })

        except Exception as e:
            return Response({
                'error': f'Erro ao verificar disponibilidade: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Reservation.objects.all().select_related(
                'space', 
                'space__building', 
                'user'
            )
        return Reservation.objects.filter(user=user).select_related(
            'space', 
            'space__building', 
            'user'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Apenas administradores podem aprovar reservas'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        reservation = self.get_object()
        reservation.status = 'approved'
        reservation.save()
        
        return Response({'status': 'Reserva aprovada'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Apenas administradores podem rejeitar reservas'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        reservation = self.get_object()
        reservation.status = 'rejected'
        reservation.save()
        
        return Response({'status': 'Reserva rejeitada'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        
        if reservation.user != request.user and not request.user.is_staff:
            return Response({'error': 'Você só pode cancelar suas próprias reservas'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        reservation.status = 'cancelled'
        reservation.save()
        
        return Response({'status': 'Reserva cancelada'})

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        """
        Endpoint específico para listar apenas as reservas do usuário atual
        """
        reservations = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_floor_plan(request, plan_id):
    floor_plan = get_object_or_404(FloorPlan, id=plan_id)
    return Response({
        'plan_image': request.build_absolute_uri(floor_plan.plan_image.url) if floor_plan.plan_image else None,
        'plan_image_url': floor_plan.plan_image_url,
        'floor_name': str(floor_plan)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_building_floors(request, building_id):
    floors = FloorPlan.objects.filter(building_id=building_id)
    return Response([{
        'id': floor.id,
        'name': floor.floor_name  # Mudado de str(floor) para floor.floor_name
    } for floor in floors])

@api_view(['GET'])
@permission_classes([AllowAny])
def get_floor_spaces(request, floor_id):
    # Changed to use building_id and floor_name
    floor_plan = get_object_or_404(FloorPlan, id=floor_id)
    spaces = Space.objects.filter(
        building=floor_plan.building,
        floor_name=floor_plan.floor_name
    )
    serializer = SpaceSerializer(spaces, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
def check_space_availability(request, space_id):
    try:
        start_time = parse_datetime(request.GET.get('start_time'))
        end_time = parse_datetime(request.GET.get('end_time'))
        space = Space.objects.get(id=space_id)

        # Check for any overlapping reservations
        overlapping = Reservation.objects.filter(
            space=space,
            start_datetime__lt=end_time,
            end_datetime__gt=start_time,
            status__in=['approved', 'pending']  # Check both approved and pending
        ).exists()

        return Response({
            'is_available': not overlapping,
            'space_id': space_id,
            'start_time': start_time,
            'end_time': end_time
        })
    except Space.DoesNotExist:
        return Response(
            {'error': 'Sala não encontrada'}, 
            status=404
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=400
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_floor_names_for_admin(request, building_id):
    if not request.user.is_staff:
        return Response(status=403)
    
    floor_names = FloorPlan.objects.filter(building_id=building_id)\
        .values_list('floor_name', flat=True)\
        .distinct()
    
    return Response(list(floor_names))