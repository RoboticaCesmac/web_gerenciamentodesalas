from django.contrib import admin
from django.utils.html import format_html
from .models import Building, SpaceType, FloorPlan, Space, Reservation, Notification
from .forms import SpaceAdminForm, ReservationAdminForm

# Customizar o site admin
admin.site.site_header = "Sistema de Gerenciamento"
admin.site.site_title = "Gerenciador WEB"

@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')
    search_fields = ('name', 'address')
    verbose_name = 'Campus'
    verbose_name_plural = 'Campi'

@admin.register(SpaceType)
class SpaceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(FloorPlan)
class FloorPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'building', 'preview_image')
    list_filter = ('building',)
    search_fields = ('name',)

    def preview_image(self, obj):
        if obj.plan_image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;"/>',
                obj.plan_image.url
            )
        return "Sem imagem"
    preview_image.short_description = 'Planta'

@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    form = SpaceAdminForm
    list_display = ('name', 'building', 'space_type', 'floor_name', 'capacity', 'is_active')
    list_filter = ('building', 'space_type', 'is_active')
    search_fields = ('name',)
    readonly_fields = ('floor_preview',)

    def floor_preview(self, obj):
        image_html = ''
        if obj and obj.floor_name and obj.floor_name.plan_image:
            image_html = format_html(
                '<img id="floor-plan-img" src="{}" style="max-width: 400px; max-height: 225px; object-fit: contain;">',
                obj.floor_name.plan_image.url
            )
        
        return format_html('''
            <div class="floor-preview-container">
                <div id="map-container" style="position: relative; width: 400px; height: 225px;">
                    {image}
                    <div id="location-marker" 
                         style="position: absolute; width: 10px; height: 10px; 
                                background-color: #007bff; border-radius: 50%; 
                                transform: translate(-50%, -50%); cursor: pointer; 
                                display: none;"></div>
                </div>
                <p id="loading-message">Selecione um andar para ver a planta</p>
                <p class="help">Clique na imagem para definir a localização da sala</p>
            </div>
        ''', image=image_html)
    floor_preview.short_description = 'Localização na Planta'

class CustomReservationAdminForm(ReservationAdminForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Mudando labels
        self.fields['monday_start'].label = 'Horário Segunda'
        self.fields['monday_end'].label = ''
        self.fields['tuesday_start'].label = 'Horário Terça'
        self.fields['tuesday_end'].label = ''
        self.fields['wednesday_start'].label = 'Horário Quarta'
        self.fields['wednesday_end'].label = ''
        self.fields['thursday_start'].label = 'Horário Quinta'
        self.fields['thursday_end'].label = ''
        self.fields['friday_start'].label = 'Horário Sexta'
        self.fields['friday_end'].label = ''
        self.fields['saturday_start'].label = 'Horário Sábado'
        self.fields['saturday_end'].label = ''
        self.fields['sunday_start'].label = 'Horário Domingo'
        self.fields['sunday_end'].label = ''

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    form = CustomReservationAdminForm
    list_display = ('space', 'user', 'get_time_display', 'is_recurring', 'status')
    list_filter = ('space', 'user', 'is_recurring', 'status')
    search_fields = ('space__name', 'user__username', 'description')

    fieldsets = (
        ('Geral', {
            'fields': ('space', 'user', 'description', 'status', 'is_recurring')
        }),
        ('Reserva Única', {
            'fields': ('date', 'start_time', 'end_time'),
            'classes': ('single-reservation',)
        }),
        ('Reserva Recorrente', {
            'fields': (
                'recurring_days', 'recurring_start_date', 'recurring_end_date',
                'monday_start', 'monday_end',
                'tuesday_start', 'tuesday_end',
                'wednesday_start', 'wednesday_end',
                'thursday_start', 'thursday_end',
                'friday_start', 'friday_end',
                'saturday_start', 'saturday_end',
                'sunday_start', 'sunday_end',
                'recurring_times_display'
            ),
            'classes': ('recurring-reservation', 'collapse'),
        }),
    )

    readonly_fields = ('recurring_times_display',)

    class Media:
        css = {
            'all': ('admin/css/reservation_admin.css',)
        }
        js = (
            'admin/js/reservation_admin.js',
        )

    def recurring_times_display(self, obj):
        """Exibe os horários recorrentes em formato de tabela"""
        if not obj.recurring_times or not obj.is_recurring:
            return format_html('<p style="color: #999;">Nenhum horário definido</p>')
        
        days_map = {
            'seg': 'Segunda-feira',
            'ter': 'Terça-feira',
            'qua': 'Quarta-feira',
            'qui': 'Quinta-feira',
            'sex': 'Sexta-feira',
            'sab': 'Sábado',
            'dom': 'Domingo'
        }
        
        html = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">'
        html += '<thead><tr style="background-color: #f0f0f0;"><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dia</th><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Horário</th></tr></thead>'
        html += '<tbody>'
        
        for day_key, day_name in days_map.items():
            if day_key in obj.recurring_times:
                time_data = obj.recurring_times[day_key]
                start = time_data.get('start', 'N/A')
                end = time_data.get('end', 'N/A')
                html += f'<tr><td style="border: 1px solid #ddd; padding: 8px;">{day_name}</td><td style="border: 1px solid #ddd; padding: 8px;">{start} - {end}</td></tr>'
        
        html += '</tbody></table>'
        return format_html(html)
    recurring_times_display.short_description = 'Horários Recorrentes'

    def get_time_display(self, obj):
        if obj.is_recurring:
            days = []
            for day_num in (obj.recurring_days or '').split(','):
                if day_num:
                    day_name = dict(self.form.WEEKDAYS).get(day_num, '')
                    days.append(day_name)
            return f"Recorrente: {', '.join(days)}"
        if obj.date and obj.start_time and obj.end_time:
            return f"{obj.date.strftime('%d/%m/%Y')} {obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
        return "N/A"
    get_time_display.short_description = 'Horário'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'read')
    list_filter = ('read', 'created_at')
    search_fields = ('title', 'message')
