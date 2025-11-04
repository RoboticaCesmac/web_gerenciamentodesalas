from django.contrib import admin
from django.utils.html import format_html
from .models import Building, SpaceType, FloorPlan, Space, Reservation, Notification
from .forms import SpaceAdminForm, ReservationAdminForm

@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')
    search_fields = ('name', 'address')
    verbose_name = 'Campus'
    verbose_name_plural = 'Campi'

@admin.register(SpaceType)
class SpaceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')  # Changed from 'type' to 'name'
    search_fields = ('name',)

@admin.register(FloorPlan)
class FloorPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'building', 'preview_image')  # Changed from 'floor_name' to 'name'
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
            <script>
                django.jQuery(document).ready(function($) {{
                    console.log("Document ready...");
                    const floorSelect = $('#id_floor_name');
                    const buildingSelect = $('#id_building');
                    const loading = $('#loading-message');
                    const floorImg = $('#floor-plan-img');
                    const marker = $('#location-marker');
                    
                    // Show marker if coordinates exist
                    const x = $('#id_location_x').val();
                    const y = $('#id_location_y').val();
                    if (x && y) {{
                        marker.css({{
                            left: x + 'px',
                            top: y + 'px',
                            display: 'block'
                        }});
                    }}

                    function loadFloorPlan() {{
                        const selectedBuilding = buildingSelect.val();
                        const selectedFloor = floorSelect.val();
                        const floorText = floorSelect.find('option:selected').text();
                        
                        if (!selectedBuilding || !selectedFloor) return;
                        
                        loading.show();
                        floorImg.hide();
                        marker.hide();

                        $.ajax({{
                            url: '/admin/spaces/get-floor-plan/',
                            method: 'GET',
                            data: {{
                                building_id: selectedBuilding,
                                floor_name: floorText
                            }},
                            success: function(data) {{
                                if (data.success && data.image_url) {{
                                    floorImg.attr('src', data.image_url);
                                    floorImg.on('load', function() {{
                                        loading.hide();
                                        floorImg.show();
                                        marker.show();
                                    }});
                                }} else {{
                                    loading.text(data.error || 'Erro ao carregar a planta');
                                }}
                            }},
                            error: function(xhr, status, error) {{
                                console.error('Error:', error);
                                loading.text('Erro ao carregar a planta');
                            }}
                        }});
                    }}

                    floorSelect.on('change', loadFloorPlan);

                    floorImg.on('click', function(e) {{
                        const rect = e.target.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        marker.css({{
                            left: x + 'px',
                            top: y + 'px',
                            display: 'block'
                        }});
                        
                        $('#id_location_x').val(x);
                        $('#id_location_y').val(y);
                    }});
                }});
            </script>
        ''', image=image_html)
    floor_preview.short_description = 'Localização na Planta'

    class Media:
        css = {
            'all': ['custom_admin.css']
        }
        js = ['admin/js/jquery.init.js']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    form = ReservationAdminForm
    list_display = ('space', 'user', 'get_time_display', 'is_recurring')
    list_filter = ('space', 'user', 'is_recurring')
    search_fields = ('space__name', 'user__username', 'description')

    fieldsets = (
        ('Geral', {
            'fields': ('space', 'user', 'description', 'is_recurring')  # Removed recurring_times
        }),
        ('Reserva Única', {
            'fields': ('date', 'start_time', 'end_time'),
            'classes': ('single-reservation',)
        }),
        ('Reserva Recorrente', {
            'fields': (
                'recurring_days', 'recurring_start_date', 'recurring_end_date',
            ),
            'classes': ('recurring-reservation',)
        }),
    )

    class Media:
        css = {
            'all': ('css/reservation_admin.css',)
        }
        js = (
            'admin/js/jquery.init.js',
            'admin/js/reservation_admin.js',
        )

    def get_time_display(self, obj):
        if obj.is_recurring:
            days = []
            for day_num in (obj.recurring_days or '').split(','):
                if day_num:
                    day_name = dict(self.form.WEEKDAYS).get(day_num, '')
                    days.append(day_name)
            return f"Recorrente: {', '.join(days)}"
        return f"{obj.date.strftime('%d/%m/%Y')} {obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    get_time_display.short_description = 'Horário'
