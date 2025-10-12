from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from spaces.models import Reservation, Space, Building, SpaceType, FloorPlan, Notification

def create_default_groups():
    # Limpar grupos existentes
    Group.objects.all().delete()

    # 1. Usuário (permissões básicas)
    usuario_group = Group.objects.create(name='Usuario')
    usuario_permissions = []
    
    # Permissões de visualização e criação de reservas
    for model in [Space, Building, SpaceType, FloorPlan]:
        ct = ContentType.objects.get_for_model(model)
        usuario_permissions.append(
            Permission.objects.get(codename=f'view_{model._meta.model_name}', content_type=ct)
        )
    
    # Adicionar permissões específicas para reservas
    reservation_ct = ContentType.objects.get_for_model(Reservation)
    usuario_permissions.extend([
        Permission.objects.get(codename='add_reservation', content_type=reservation_ct),
        Permission.objects.get(codename='view_reservation', content_type=reservation_ct),
    ])
    
    usuario_group.permissions.set(usuario_permissions)

    # 2. Admin (permissões avançadas)
    admin_group = Group.objects.create(name='Admin')
    admin_permissions = []
    
    # Todas as permissões para os modelos principais
    for model in [Reservation, Space, Building, SpaceType, FloorPlan, Notification]:
        ct = ContentType.objects.get_for_model(model)
        admin_permissions.extend([
            Permission.objects.get(codename=f'add_{model._meta.model_name}', content_type=ct),
            Permission.objects.get(codename=f'change_{model._meta.model_name}', content_type=ct),
            Permission.objects.get(codename=f'delete_{model._meta.model_name}', content_type=ct),
            Permission.objects.get(codename=f'view_{model._meta.model_name}', content_type=ct),
        ])
    
    admin_group.permissions.set(admin_permissions)

    return {
        'Usuario': usuario_group,
        'Admin': admin_group
    }