from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from .models import CustomUser
from spaces.admin_site import admin_site
from django.core.exceptions import ValidationError

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_groups')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    
    def get_groups(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])
    get_groups.short_description = 'Grupos'

    def save_model(self, request, obj, form, change):
        if not change:  # Se estiver criando um novo usuário
            # Verifica se o admin tem permissão para atribuir os grupos selecionados
            if not request.user.is_superuser:
                admin_groups = request.user.groups.all()
                for group in form.cleaned_data.get('groups', []):
                    if group not in admin_groups:
                        raise ValidationError(
                            f'Você não tem permissão para atribuir o grupo {group.name}'
                        )
        super().save_model(request, obj, form, change)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'email', 'profile_photo')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'groups')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'groups'),
        }),
    )

admin_site.register(CustomUser, CustomUserAdmin)