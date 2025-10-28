from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class CustomUser(AbstractUser):
    email = models.EmailField(
        'E-mail',
        unique=True,
        validators=[
            RegexValidator(
                regex=r'@cesmac\.edu\.br$',
                message='Email deve ser do domínio @cesmac.edu.br'
            )
        ]
    )
    profile_photo = models.CharField('Foto de Perfil', max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
