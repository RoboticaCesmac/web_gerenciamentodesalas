from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import json
from django.conf import settings

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
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('confirmado', 'Confirmado'),
        ('canceled', 'Cancelado'),
        ('completed', 'Concluído')
    ]

    space = models.ForeignKey('Space', on_delete=models.CASCADE, verbose_name='Sala')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='Usuário')
    date = models.DateField('Data', default=timezone.now)
    start_time = models.TimeField('Hora Início', default=timezone.now)
    end_time = models.TimeField('Hora Fim', default=get_default_end_time)
    description = models.TextField('Descrição', blank=True)
    phone = models.CharField('Telefone', max_length=20, blank=True)
    course = models.CharField('Curso', max_length=100, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='confirmado',
        verbose_name='Status'
    )
    is_recurring = models.BooleanField('Reserva Recorrente', default=False)
    recurring_days = models.TextField('Dias da Semana', blank=True, null=True)
    recurring_start_date = models.DateField('Data Início Recorrência', null=True, blank=True)
    recurring_end_date = models.DateField('Data Fim Recorrência', null=True, blank=True)
    recurring_times = models.JSONField('Horários Recorrentes', default=dict, blank=True, null=True)
    
    # Add time fields for each day
    monday_start = models.TimeField('Hora Início Segunda', null=True, blank=True)
    monday_end = models.TimeField('Hora Fim Segunda', null=True, blank=True)
    tuesday_start = models.TimeField('Hora Início Terça', null=True, blank=True)
    tuesday_end = models.TimeField('Hora Fim Terça', null=True, blank=True)
    wednesday_start = models.TimeField('Hora Início Quarta', null=True, blank=True)
    wednesday_end = models.TimeField('Hora Fim Quarta', null=True, blank=True)
    thursday_start = models.TimeField('Hora Início Quinta', null=True, blank=True)
    thursday_end = models.TimeField('Hora Fim Quinta', null=True, blank=True)
    friday_start = models.TimeField('Hora Início Sexta', null=True, blank=True)
    friday_end = models.TimeField('Hora Fim Sexta', null=True, blank=True)
    saturday_start = models.TimeField('Hora Início Sábado', null=True, blank=True)
    saturday_end = models.TimeField('Hora Fim Sábado', null=True, blank=True)
    sunday_start = models.TimeField('Hora Início Domingo', null=True, blank=True)
    sunday_end = models.TimeField('Hora Fim Domingo', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'

    def __str__(self):
        return f"{self.space.name} - {self.date}"

    def save(self, *args, **kwargs):
        # Se é uma reserva recorrente SENDO CRIADA (não tem ID ainda)
        if self.is_recurring and not self.pk and self.recurring_days:
            # Converter dias recorrentes para lista
            days = [d for d in self.recurring_days.split(',') if d]
            times = self.recurring_times or {}
            
            # Garantir que temos entradas de tempo para todos os dias selecionados
            for day in days:
                if day not in times:
                    times[day] = {
                        'start': self.start_time.strftime('%H:%M') if self.start_time else None,
                        'end': self.end_time.strftime('%H:%M') if self.end_time else None
                    }
            
            # Remover tempos para dias não selecionados
            self.recurring_times = {k: v for k, v in times.items() if k in days}
        
        # Se é uma reserva recorrente JÁ EXISTENTE, NÃO MODIFICAR dados recorrentes
        # Apenas permitir mudança de status
        elif self.pk and self.is_recurring:
            # Recuperar dados antigos do banco
            try:
                old_instance = Reservation.objects.get(pk=self.pk)
                # Preservar todos os dados recorrentes originais
                self.recurring_days = old_instance.recurring_days
                self.recurring_start_date = old_instance.recurring_start_date
                self.recurring_end_date = old_instance.recurring_end_date
                self.recurring_times = old_instance.recurring_times
                self.monday_start = old_instance.monday_start
                self.monday_end = old_instance.monday_end
                self.tuesday_start = old_instance.tuesday_start
                self.tuesday_end = old_instance.tuesday_end
                self.wednesday_start = old_instance.wednesday_start
                self.wednesday_end = old_instance.wednesday_end
                self.thursday_start = old_instance.thursday_start
                self.thursday_end = old_instance.thursday_end
                self.friday_start = old_instance.friday_start
                self.friday_end = old_instance.friday_end
                self.saturday_start = old_instance.saturday_start
                self.saturday_end = old_instance.saturday_end
                self.sunday_start = old_instance.sunday_start
                self.sunday_end = old_instance.sunday_end
                self.date = old_instance.date
                self.start_time = old_instance.start_time
                self.end_time = old_instance.end_time
            except Reservation.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)

class Notification(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return self.title
