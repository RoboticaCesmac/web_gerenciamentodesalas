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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        
        if instance:
            # Set initial values for recurring_days if editing existing instance
            if instance.recurring_days:
                self.initial['recurring_days'] = instance.recurring_days.split(',')
            
            # Map dias para os campos corretos do modelo
            day_map = {
                '0': ('monday_start', 'monday_end'),
                '1': ('tuesday_start', 'tuesday_end'),
                '2': ('wednesday_start', 'wednesday_end'),
                '3': ('thursday_start', 'thursday_end'),
                '4': ('friday_start', 'friday_end'),
                '5': ('saturday_start', 'saturday_end'),
                '6': ('sunday_start', 'sunday_end'),
            }
            
            # Set initial values for day-specific times
            if instance.recurring_times:
                for day, time_data in instance.recurring_times.items():
                    if day in day_map:
                        start_field, end_field = day_map[day]
                        if 'start' in time_data:
                            self.initial[start_field] = time_data['start']
                        if 'end' in time_data:
                            self.initial[end_field] = time_data['end']

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        if instance.is_recurring:
            # Save selected days as comma-separated string
            days = self.cleaned_data.get('recurring_days', [])
            instance.recurring_days = ','.join(days) if days else ''
            
            # Map dos dias para os campos do modelo
            day_map = {
                '0': ('monday_start', 'monday_end'),
                '1': ('tuesday_start', 'tuesday_end'),
                '2': ('wednesday_start', 'wednesday_end'),
                '3': ('thursday_start', 'thursday_end'),
                '4': ('friday_start', 'friday_end'),
                '5': ('saturday_start', 'saturday_end'),
                '6': ('sunday_start', 'sunday_end'),
            }
            
            # Save time values for each day
            times = {}
            for day in days:
                if day in day_map:
                    start_field, end_field = day_map[day]
                    start_time = self.cleaned_data.get(start_field)
                    end_time = self.cleaned_data.get(end_field)
                    
                    # Salvar nos campos específicos do modelo
                    setattr(instance, start_field, start_time)
                    setattr(instance, end_field, end_time)
                    
                    # Salvar também no JSONField recurring_times
                    if start_time and end_time:
                        times[day] = {
                            'start': start_time.strftime('%H:%M'),
                            'end': end_time.strftime('%H:%M')
                        }
            
            instance.recurring_times = times

        if commit:
            instance.save()
        return instance

    class Meta:
        model = Reservation
        fields = [
            'space', 'user', 'description', 'is_recurring',
            'date', 'start_time', 'end_time',
            'recurring_days', 'recurring_start_date', 'recurring_end_date',
            'monday_start', 'monday_end',
            'tuesday_start', 'tuesday_end',
            'wednesday_start', 'wednesday_end',
            'thursday_start', 'thursday_end',
            'friday_start', 'friday_end',
            'saturday_start', 'saturday_end',
            'sunday_start', 'sunday_end',
        ]
        widgets = {
            'start_time': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'end_time': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'date': AdminDateWidget(),
            'recurring_start_date': AdminDateWidget(),
            'recurring_end_date': AdminDateWidget(),
            'monday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'monday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'tuesday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'tuesday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'wednesday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'wednesday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'thursday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'thursday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'friday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'friday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'saturday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'saturday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'sunday_start': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'sunday_end': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
        }