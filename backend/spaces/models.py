from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Building(models.Model):
    name = models.CharField(max_length=100, unique=True)
    address = models.TextField(null=True, blank=True)  # Making it optional
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Floor(models.Model):
    name = models.CharField(max_length=50)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors')

    def __str__(self):
        return f"{self.building.name} - {self.name}"

    class Meta:
        ordering = ['building', 'name']

class FloorPlan(models.Model):
    building = models.ForeignKey('Building', on_delete=models.CASCADE)
    floor_name = models.CharField(max_length=50)
    plan_image = models.ImageField(
        upload_to='floor_plans/',
        null=True,
        blank=True,
        help_text="Upload da imagem da planta"
    )
    plan_image_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="URL externa da imagem (opcional)"
    )

    def get_image(self):
        if self.plan_image:
            return self.plan_image.url
        return self.plan_image_url

    def __str__(self):
        return f"{self.building.name} - {self.floor_name}"

class SpaceType(models.Model):
    type = models.CharField(
        max_length=90,
        default='Sala Padrão'  # Adding a default value
    )
    description = models.CharField(
        max_length=500,
        default='Descrição padrão'  # Adding a default value for description as well
    )

    class Meta:
        ordering = ['type']

    def __str__(self):
        return self.type

class Space(models.Model):
    name = models.CharField(max_length=100)
    building = models.ForeignKey(Building, on_delete=models.CASCADE)
    space_type = models.ForeignKey(SpaceType, on_delete=models.SET_NULL, null=True)
    floor_name = models.CharField(max_length=50)  # Manteremos este campo
    capacity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    location_x = models.FloatField(null=True, blank=True)
    location_y = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['building__name', 'name']
        unique_together = ['building', 'name']

    def save(self, *args, **kwargs):
        # Antes de salvar, buscar o floor_name do FloorPlan correspondente
        if not self.floor_name and self.building:
            try:
                floor_plan = FloorPlan.objects.filter(
                    building=self.building
                ).first()
                if floor_plan:
                    self.floor_name = floor_plan.floor_name
            except FloorPlan.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.building.name} - {self.name} ({self.space_type.type if self.space_type else 'Sem tipo'})"  # Changed from space_type.name to space_type.type

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('approved', 'Aprovado'),
        ('rejected', 'Rejeitado'),
        ('canceled', 'Cancelado'),
    ]

    building = models.ForeignKey(Building, on_delete=models.CASCADE)
    space = models.ForeignKey(Space, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, verbose_name='Curso')
    description = models.CharField(max_length=1400, verbose_name='Observação', blank=True)
    phone = models.CharField(max_length=20, verbose_name='Telefone', null=True, blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['space', 'start_datetime', 'end_datetime']),
            models.Index(fields=['user', 'start_datetime']),
        ]

    def clean(self):
        # Validate dates
        if self.start_datetime and self.end_datetime:
            if self.end_datetime <= self.start_datetime:
                raise ValidationError('O horário final deve ser depois do horário inicial.')
            
            if self.start_datetime < timezone.now():
                raise ValidationError('Não é possível fazer reservas no passado.')

        # Validate space exists and is active
        if self.space and not self.space.is_active:
            raise ValidationError('Esta sala não está disponível para reservas.')

        # Make sure building matches space's building
        if self.space:
            self.building = self.space.building

        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.space} ({self.start_datetime} to {self.end_datetime})"

    @property
    def duration(self):
        return self.end_datetime - self.start_datetime

class Notification(models.Model):
    STATUS_CHOICES = [
        ('not_seen', 'Não Visto'),
        ('open', 'Em Aberto'),
        ('closed', 'Fechado'),
    ]

    reservation = models.ForeignKey(
        Reservation, 
        on_delete=models.CASCADE,
        null=True,  # Temporariamente permitir null
        blank=True
    )
    user = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.CASCADE,
        null=True,  # Temporariamente permitir null
        blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_seen')
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified_by = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='modified_notifications'
    )