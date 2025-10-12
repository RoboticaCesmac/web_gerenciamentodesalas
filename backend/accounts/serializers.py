from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'profile_photo')

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Verificar se é email do CESMAC
            if not email.endswith('@cesmac.edu.br'):
                raise serializers.ValidationError('Apenas emails @cesmac.edu.br são permitidos.')
            
            # Primeiro tenta encontrar o usuário pelo email
            try:
                user = CustomUser.objects.get(email=email.lower())
                # Então autentica usando o username do usuário encontrado
                authenticated_user = authenticate(username=user.username, password=password)
                
                if authenticated_user:
                    if authenticated_user.is_active:
                        data['user'] = authenticated_user
                    else:
                        raise serializers.ValidationError('Conta desativada.')
                else:
                    raise serializers.ValidationError('Credenciais inválidas.')
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('Email não encontrado.')
        else:
            raise serializers.ValidationError('Email e senha são obrigatórios.')

        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'password', 'first_name', 'last_name')
    
    def validate_email(self, value):
        if not value.endswith('@cesmac.edu.br'):
            raise serializers.ValidationError('Apenas emails @cesmac.edu.br são permitidos.')
        return value.lower()
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user