from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import Reservation, Notification
from accounts.models import CustomUser

@receiver(post_save, sender=Reservation)
def create_reservation_notification(sender, instance, created, **kwargs):
    if created:
        # Encontrar todos os admins
        admin_group = Group.objects.get(name='Admin')
        superadmin_group = Group.objects.get(name='SuperAdmin')
        
        admin_users = CustomUser.objects.filter(groups__in=[admin_group, superadmin_group]).distinct()
        
        # Criar notificação para cada admin
        for admin in admin_users:
            Notification.objects.create(
                reservation=instance,
                user=admin,
                status='not_seen',
                last_modified_by=instance.user
            )