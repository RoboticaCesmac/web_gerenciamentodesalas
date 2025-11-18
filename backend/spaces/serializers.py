from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Building, FloorPlan, Space, Reservation

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ['id', 'name', 'address']

class FloorPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = FloorPlan
        fields = ['id', 'name', 'building', 'plan_image']

class SpaceSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    floor_name = serializers.CharField(source='floor_name.name', read_only=True)

    class Meta:
        model = Space
        fields = ['id', 'name', 'building', 'building_name', 'floor_name', 'capacity']

class ReservationSerializer(serializers.ModelSerializer):
    space_name = serializers.CharField(source='space.name', read_only=True)
    building_name = serializers.CharField(source='space.building.name', read_only=True)
    floor_name = serializers.SerializerMethodField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    capacity = serializers.IntegerField(source='space.capacity', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'space', 'space_name', 'building_name', 'floor_name',
            'date', 'start_time', 'end_time', 'description', 'status',
            'user_email', 'user', 'capacity', 'is_recurring',
            'recurring_days', 'recurring_start_date', 'recurring_end_date',
            'recurring_times', 'phone', 'course',
            'monday_start', 'monday_end',
            'tuesday_start', 'tuesday_end',
            'wednesday_start', 'wednesday_end',
            'thursday_start', 'thursday_end',
            'friday_start', 'friday_end',
            'saturday_start', 'saturday_end',
            'sunday_start', 'sunday_end'
        ]
        read_only_fields = ['user', 'id']

    def get_floor_name(self, obj):
        return getattr(obj.space.floor_name, 'name', 'N/A') if obj.space.floor_name else 'N/A'

    def validate(self, data):
        # Se é uma atualização parcial (PATCH), não validar campos obrigatórios
        # Apenas validar se o objeto está sendo criado (POST) ou atualizado completamente (PUT)
        if self.instance is not None:
            # Atualização (PUT ou PATCH) - não forçar validação de todos os campos
            return data
        
        # Validação para criação (POST)
        # Se is_recurring, validar campos recorrentes
        if data.get('is_recurring'):
            if not data.get('recurring_days'):
                raise serializers.ValidationError("recurring_days é obrigatório para reservas recorrentes")
            if not data.get('recurring_start_date'):
                raise serializers.ValidationError("recurring_start_date é obrigatório")
            if not data.get('recurring_end_date'):
                raise serializers.ValidationError("recurring_end_date é obrigatório")
        else:
            # Se não for recorrente, validar data e horários
            if not data.get('date'):
                raise serializers.ValidationError("date é obrigatório para reservas únicas")
            if not data.get('start_time'):
                raise serializers.ValidationError("start_time é obrigatório")
            if not data.get('end_time'):
                raise serializers.ValidationError("end_time é obrigatório")
        
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Garante formato de tempo
        if instance.start_time:
            data['start_time'] = instance.start_time.strftime('%H:%M:%S')
        else:
            data['start_time'] = None
            
        if instance.end_time:
            data['end_time'] = instance.end_time.strftime('%H:%M:%S')
        else:
            data['end_time'] = None
            
        if instance.date:
            data['date'] = instance.date.isoformat()
        else:
            data['date'] = None
            
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'first_name', 'last_name']