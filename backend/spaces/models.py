from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

def get_default_end_time():
    return (timezone.now() + timedelta(hours=1)).time()

class Building(models.Model):
    name = models.CharField('Nome do Campus', max_length=100)
    address = models.TextField('Endereço', blank=True)

    class Meta:
        verbose_name = 'Campus'
        verbose_name_plural = 'Campus'
        ordering = ['name']

    def __str__(self):
        return self.name

class SpaceType(models.Model):
    name = models.CharField('Nome', max_length=100)
    description = models.TextField('Descrição', blank=True)

    class Meta:
        verbose_name = 'Tipo de Espaço'
        verbose_name_plural = 'Tipos de Espaço'

    def __str__(self):
        return self.name

class FloorPlan(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, verbose_name='Campus')
    name = models.CharField('Nome', max_length=100)
    plan_image = models.ImageField('Planta', upload_to='floor_plans/')

    class Meta:
        verbose_name = 'Planta'
        verbose_name_plural = 'Plantas'

    def __str__(self):
        return f"{self.building.name} - {self.name}"

class Space(models.Model):
    name = models.CharField('Nome', max_length=100)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, verbose_name='Campus')
    space_type = models.ForeignKey(SpaceType, on_delete=models.CASCADE, verbose_name='Tipo')
    floor_name = models.ForeignKey(FloorPlan, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Andar')
    capacity = models.IntegerField('Capacidade')
    is_active = models.BooleanField('Ativo', default=True)
    location_x = models.FloatField(null=True, blank=True)
    location_y = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name = 'Sala'
        verbose_name_plural = 'Salas'

    def __str__(self):
        return f"{self.name} - {self.building.name}"

class Reservation(models.Model):
    space = models.ForeignKey(Space, on_delete=models.CASCADE, verbose_name='Sala')
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, verbose_name='Usuário')
    date = models.DateField('Data', default=timezone.now)
    start_time = models.TimeField('Hora Início', default=timezone.now)
    end_time = models.TimeField('Hora Fim', default=get_default_end_time)
    description = models.TextField('Descrição', blank=True)
    is_recurring = models.BooleanField('Reserva Recorrente', default=False)
    recurring_days = models.TextField('Dias da Semana', blank=True, null=True)
    recurring_start_date = models.DateField('Data Início Recorrência', null=True, blank=True)
    recurring_end_date = models.DateField('Data Fim Recorrência', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'

    def __str__(self):
        return f"{self.space.name} - {self.date}"

class Notification(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return self.title
