from django import forms
from .models import Space, FloorPlan, Reservation
from django.contrib.admin.widgets import AdminTimeWidget, AdminDateWidget

class SpaceAdminForm(forms.ModelForm):
    class Meta:
        model = Space
        fields = '__all__'

class ReservationAdminForm(forms.ModelForm):
    WEEKDAYS = [
        ('0', 'Segunda-feira'),
        ('1', 'Terça-feira'),
        ('2', 'Quarta-feira'),
        ('3', 'Quinta-feira'),
        ('4', 'Sexta-feira'),
        ('5', 'Sábado'),
        ('6', 'Domingo'),
    ]

    recurring_days = forms.MultipleChoiceField(
        choices=WEEKDAYS,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label='Dias da Semana'
    )

    class Meta:
        model = Reservation
        fields = '__all__'
        widgets = {
            'start_time': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'end_time': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'date': AdminDateWidget(),
            'recurring_start_date': AdminDateWidget(),
            'recurring_end_date': AdminDateWidget(),
        }