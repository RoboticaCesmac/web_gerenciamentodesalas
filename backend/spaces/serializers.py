from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Building, Space, Reservation, FloorPlan, SpaceType
import pytz

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ['id', 'name', 'address']

class SpaceSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    floor_name = serializers.CharField()

    class Meta:
        model = Space
        fields = ['id', 'name', 'capacity', 'building', 'building_name', 'floor_name', 'is_active']

class FloorPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = FloorPlan
        fields = ['id', 'plan_image', 'building']

class SpaceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceType
        fields = ['id', 'type', 'description']  # Updated to match model fields

        
class ReservationSerializer(serializers.ModelSerializer):
    space_name = serializers.CharField(source='space.name', read_only=True)
    building_name = serializers.CharField(source='space.building.name', read_only=True)
    floor_name = serializers.CharField(source='space.floor_name', read_only=True)  # Adicionado
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    capacity = serializers.IntegerField(source='space.capacity', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 
            'space', 
            'space_name',
            'building',
            'building_name',
            'floor_name',  # Adicionado
            'start_datetime',
            'end_datetime',
            'status', 
            'title', 
            'description',
            'phone',
            'user_name',
            'user_email',
            'capacity'
        ]
        read_only_fields = ['user', 'building', 'status']

    def validate(self, data):
        # Converter horários para o timezone de Brasília
        brazil_tz = pytz.timezone('America/Sao_Paulo')
        
        start = data['start_datetime']
        end = data['end_datetime']

        # Garantir que as datas têm timezone
        if timezone.is_naive(start):
            start = timezone.make_aware(start, brazil_tz)
        if timezone.is_naive(end):
            end = timezone.make_aware(end, brazil_tz)

        # Converter para timezone de Brasília
        start = start.astimezone(brazil_tz)
        end = end.astimezone(brazil_tz)

        data['start_datetime'] = start
        data['end_datetime'] = end

        # Resto das validações
        if not data.get('title'):
            raise serializers.ValidationError({'title': 'O título é obrigatório.'})
        
        if len(data.get('title', '')) < 3:
            raise serializers.ValidationError({'title': 'O título deve ter pelo menos 3 caracteres.'})

        if end <= start:
            raise serializers.ValidationError({'end_datetime': 'O horário final deve ser depois do horário inicial.'})

        now = timezone.now().astimezone(brazil_tz)
        if start < now:
            raise serializers.ValidationError({'start_datetime': 'Não é possível fazer reservas no passado.'})

        duration = end - start
        if duration.total_seconds() < 1800:  # 30 minutes
            raise serializers.ValidationError({'duration': 'A reserva deve ter pelo menos 30 minutos de duração.'})
        if duration.total_seconds() > 28800:  # 8 hours
            raise serializers.ValidationError({'duration': 'A reserva não pode exceder 8 horas de duração.'})

        return data

    def create(self, validated_data):
        # Get space and set building automatically
        space = validated_data['space']
        validated_data['building'] = space.building
        validated_data['status'] = 'pending'  # Set default status
        
        # Create reservation
        reservation = Reservation.objects.create(**validated_data)
        return reservation