from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

def validate_cesmac_email(value):
    if not value:
        return
    if not value.endswith('@cesmac.edu.br'):
        raise ValidationError('Apenas emails @cesmac.edu.br são permitidos.')

class CustomUser(AbstractUser):
    email = models.EmailField(
        unique=False,
        validators=[validate_cesmac_email],
        blank=True,
        null=True
    )
    profile_photo = models.URLField(
        blank=True, 
        help_text="URL para foto do perfil"
    )
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    
    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'