from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('is_staff', 'is_active', 'groups')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'email', 'profile_photo')}),
        ('Permissões', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

    class Media:
        js = ('admin/js/hide_token.js',)
        css = {'all': ('admin/css/hide_token.css',)}


# Customizar o AdminSite para esconder Token
from django.contrib.admin.apps import AdminConfig

class CustomAdminConfig(AdminConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'django.contrib.admin'
    
    def ready(self):
        super().ready()
        from django.contrib import admin
        from rest_framework.authtoken.models import Token
        try:
            admin.site.unregister(Token)
        except:
            pass
