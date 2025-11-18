from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from .models import FloorPlan
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model, authenticate
from .models import Building, FloorPlan, Space, Reservation
from .serializers import (
    BuildingSerializer,
    FloorPlanSerializer,
    SpaceSerializer,
    ReservationSerializer,
    UserProfileSerializer
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework import viewsets
from rest_framework.decorators import action

@staff_member_required
def get_floor_plan(request):
    building_id = request.GET.get('building_id')
    floor_name = request.GET.get('floor_name')
    
    print(f"Looking up floor plan for building: {building_id}, floor: {floor_name}")  # Debug log
    
    try:
        floor = FloorPlan.objects.get(building_id=building_id, floor_name=floor_name)
        if floor.plan_image:
            return JsonResponse({
                'success': True,
                'image_url': floor.plan_image.url,
                'floor_name': floor.floor_name
            })
        return JsonResponse({
            'success': False,
            'error': 'Este andar não possui planta cadastrada'
        })
    except FloorPlan.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Planta não encontrada'
        })
    except Exception as e:
        print(f"Error getting floor plan: {str(e)}")  # Debug log
        return JsonResponse({
            'success': False,
            'error': 'Erro ao carregar a planta'
        })

class BuildingList(generics.ListAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAuthenticated]

class FloorList(generics.ListAPIView):
    serializer_class = FloorPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        building_id = self.kwargs['pk']
        return FloorPlan.objects.filter(building_id=building_id)

class SpaceList(generics.ListAPIView):
    serializer_class = SpaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        building = self.request.query_params.get('building')
        floor = self.request.query_params.get('floor')
        queryset = Space.objects.all()
        
        if building:
            queryset = queryset.filter(building_id=building)
        if floor:
            queryset = queryset.filter(floor_name_id=floor)
            
        return queryset

class SpaceAvailability(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        date = request.query_params.get('date')
        if not date:
            return Response(
                {"error": "Date parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if space has any reservations for the given date
        has_reservations = Reservation.objects.filter(
            space_id=pk,
            date=date
        ).exists()

        return Response({"available": not has_reservations})

class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def debug_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Debug login attempt for {username}")
    
    User = get_user_model()
    try:
        user = User.objects.get(username=username)
        print(f"User found: {user.username}")
        print(f"Password valid: {user.check_password(password)}")
        
        # Try authentication
        auth_user = authenticate(request, username=username, password=password)
        print(f"Auth result: {auth_user}")
        
        if auth_user:
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=auth_user)
            return Response({
                'token': token.key,
                'user': {
                    'id': auth_user.id,
                    'username': auth_user.username,
                    'email': auth_user.email,
                    'first_name': auth_user.first_name,
                    'last_name': auth_user.last_name
                }
            })
        
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response({
            'detail': 'Usuário não encontrado'
        }, status=401)
    
    return Response({
        'detail': 'Credenciais inválidas'
    }, status=401)

@api_view(['POST'])
@permission_classes([AllowAny])
def test_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Login attempt - Username: {username}")
    
    if not username or not password:
        return Response({
            'detail': 'Username and password are required'
        }, status=400)
    
    user = authenticate(username=username, password=password)
    print(f"Authentication result: {user}")
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token: {token.key} (Created: {created})")
        
        return Response({
            'token': token.key,
            'user': {
                'username': user.username,
                'email': user.email
            }
        })
    
    return Response({
        'detail': 'Invalid credentials'
    }, status=401)

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.select_related(
            'space',
            'space__building',
            'space__floor_name',
            'user'
        ).filter(user=self.request.user).order_by('-date', '-start_time')

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def all_reservations(self, request):
        """
        Retorna TODAS as reservas de todos os usuários (não apenas do usuário logado).
        Útil para o calendário mostrar a disponibilidade baseado em todas as reservas.
        """
        reservations = Reservation.objects.select_related(
            'space',
            'space__building',
            'space__floor_name',
            'user'
        ).all().order_by('-date', '-start_time')
        
        # Aplicar filtros opcionais
        space_id = request.query_params.get('space')
        if space_id:
            reservations = reservations.filter(space_id=space_id)
        
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        print("Received reservation data:", request.data)  # Debug log
        
        # Garantir que o status seja 'pending'
        data = request.data.copy()
        data['status'] = 'pending'
        
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug log
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='pending')

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Permite atualizações parciais (PATCH).
        Útil para cancelar reservas alterando apenas o status.
        """
        return super().partial_update(request, *args, **kwargs)
