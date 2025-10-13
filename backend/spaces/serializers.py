from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Building, SpaceType, Space, Reservation
from django.utils import timezone

User = get_user_model()

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = '__all__'

class SpaceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceType
        fields = '__all__'

class SpaceSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    space_type_name = serializers.CharField(source='space_type.type', read_only=True)  # Changed from space_type.name to space_type.type
    
    class Meta:
        model = Space
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'profile_photo']

class ReservationSerializer(serializers.ModelSerializer):
    space_name = serializers.CharField(source='space.name', read_only=True)
    building_name = serializers.CharField(source='space.building.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    capacity = serializers.IntegerField(source='space.capacity', read_only=True)  # Adicionado este campo
    
    class Meta:
        model = Reservation
        fields = [
            'id', 
            'space', 
            'space_name', 
            'building_name', 
            'start_datetime', 
            'end_datetime', 
            'status', 
            'title', 
            'description',
            'user_name',
            'user_email',
            'capacity'  # Adicionado ao fields
        ]
        read_only_fields = ['user']

    def validate(self, data):
        # Validar que o horário final é depois do inicial
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError('O horário final deve ser depois do horário inicial.')

        # Validar que a reserva é no futuro
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError('Não é possível fazer reservas no passado.')

        # Validar duração mínima e máxima
        duration = data['end_time'] - data['start_time']
        if duration.total_seconds() < 1800:
            raise serializers.ValidationError('A reserva deve ter pelo menos 30 minutos de duração.')
        if duration.total_seconds() > 28800:
            raise serializers.ValidationError('A reserva não pode exceder 8 horas de duração.')

        # Validar sobreposição de horários
        overlapping = Reservation.objects.filter(
            space=data['space'],
            status='approved',
            start_time__lt=data['end_time'],
            end_time__gt=data['start_time']
        )
        
        if self.instance:  # Se estiver atualizando, excluir a própria reserva
            overlapping = overlapping.exclude(pk=self.instance.pk)
            
        if overlapping.exists():
            raise serializers.ValidationError('Já existe uma reserva aprovada para este horário.')

        return data