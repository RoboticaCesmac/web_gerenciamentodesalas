from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from .models import CustomUser
from spaces.models import Building, Space, SpaceType, FloorPlan, Reservation

@receiver(post_save, sender=CustomUser)
def add_staff_permissions(sender, instance, created, **kwargs):
    if instance.is_staff:
        # Adiciona todas as permissões necessárias para os modelos
        models = [Building, Space, SpaceType, FloorPlan, Reservation]
        
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)
            
            for perm in permissions:
                instance.user_permissions.add(perm)