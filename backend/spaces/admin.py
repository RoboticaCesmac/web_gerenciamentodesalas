from django.contrib import admin
from django.utils.html import format_html
from .models import Building, SpaceType, Space, Reservation, FloorPlan, Notification
from .widgets import ImageMapWidget
from django import forms
from .admin_site import admin_site
from .forms import ReservationAdminForm
from django.http import JsonResponse

# Now register your models
class BuildingAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'created_at', 'updated_at']
    search_fields = ['name', 'address']

class FloorPlanAdmin(admin.ModelAdmin):
    list_display = ['building', 'floor_name', 'image_preview']
    list_filter = ['building']
    search_fields = ['building__name', 'floor_name']
    exclude = ['plan_image_url']

    def image_preview(self, obj):
        if obj.plan_image:
            return format_html('<img src="{}" style="max-width: 300px; max-height: 200px;" />', obj.plan_image.url)
        return "No Image"
    image_preview.short_description = 'Preview'

    class Media:
        css = {
            'all': ('admin/css/floor-plan.css',)
        }
        js = ('admin/js/floor-plan.js',)

    fieldsets = (
        (None, {
            'fields': ('building', 'floor_name')
        }),
        ('Imagem', {
            'fields': ('plan_image',),
            'classes': ('wide',)
        }),
    )

class SpaceTypeAdmin(admin.ModelAdmin):
    list_display = ['type', 'description']
    search_fields = ['type']

class SpaceAdminForm(forms.ModelForm):
    preview_url = forms.CharField(widget=forms.HiddenInput(), required=False)
    floor_name = forms.ChoiceField(
        choices=[],
        required=True,
        label='Floor Name'
    )

    class Meta:
        model = Space
        fields = '__all__'
        widgets = {
            'location_x': forms.HiddenInput(attrs={'class': 'coord-x'}),
            'location_y': forms.HiddenInput(attrs={'class': 'coord-y'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        building_id = None

        # Determinar o building_id da instância ou dos dados do formulário
        if instance and instance.building_id:
            building_id = instance.building_id
        elif self.data.get('building'):
            building_id = self.data.get('building')
        elif kwargs.get('initial', {}).get('building'):
            building_id = kwargs['initial']['building']

        if building_id:
            floor_plans = FloorPlan.objects.filter(building_id=building_id)
            self.fields['floor_name'].choices = [
                (fp.floor_name, fp.floor_name) for fp in floor_plans
            ]
            # Se não houver floor_name selecionado, use o primeiro disponível
            if not self.instance.floor_name and floor_plans.exists():
                self.initial['floor_name'] = floor_plans.first().floor_name

class SpaceAdmin(admin.ModelAdmin):
    form = SpaceAdminForm
    list_display = ['name', 'building', 'space_type', 'floor_name', 'capacity', 'is_active']
    list_filter = ['building', 'space_type', 'is_active']
    search_fields = ['name', 'building__name']
    
    class Media:
        css = {
            'all': ('admin/css/floor-plan.css',)
        }
        js = (
            'admin/js/vendor/jquery/jquery.min.js',  # Adicione jQuery primeiro
            'admin/js/jquery.init.js',               # Inicialização do jQuery
            'admin/js/floor-plan.js',               # Seu script
        )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'floor_name' in form.base_fields:
            form.base_fields['floor_name'].widget = forms.Select(choices=[])
        return form

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}
        if object_id:
            space = self.get_queryset(request).get(pk=object_id)
            try:
                floor_plan = FloorPlan.objects.get(
                    building=space.building,
                    floor_name=space.floor_name
                )
                extra_context['floor_plan_image'] = floor_plan.plan_image.url if floor_plan.plan_image else None
            except FloorPlan.DoesNotExist:
                pass
        return super().changeform_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        if not obj.floor_name and obj.building:
            floor_plan = FloorPlan.objects.filter(building=obj.building).first()
            if floor_plan:
                obj.floor_name = floor_plan.floor_name
        super().save_model(request, obj, form, change)

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                'get_floor_plan/<int:building_id>/<str:floor_name>/',
                self.admin_site.admin_view(self.get_floor_plan),
                name='get-floor-plan',
            ),
        ]
        return custom_urls + urls

    def get_floor_plan(self, request, building_id, floor_name):
        try:
            floor_plan = FloorPlan.objects.get(
                building_id=building_id,
                floor_name=floor_name
            )
            return JsonResponse({
                'image_url': floor_plan.plan_image.url if floor_plan.plan_image else None
            })
        except FloorPlan.DoesNotExist:
            return JsonResponse({'error': 'Floor plan not found'}, status=404)

class ReservationAdmin(admin.ModelAdmin):
    list_display = ('title', 'space', 'start_datetime', 'end_datetime', 'user', 'status')
    list_filter = ('status', 'space', 'start_datetime')
    search_fields = ('title', 'user__username', 'space__name')
    readonly_fields = ('user', 'building')  # Make building readonly since it's set from space
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('title', 'description', 'user', 'phone')
        }),
        ('Local e Horário', {
            'fields': ('space', 'building', 'start_datetime', 'end_datetime')
        }),
        ('Status', {
            'fields': ('status',),
            'classes': ('wide',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:  # If creating new reservation
            obj.user = request.user
        obj.building = obj.space.building  # Always set building from space
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'space', 
            'space__building', 
            'user'
        )

class NotificationAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'user', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['reservation__title', 'user__email']

# Registrar no final do arquivo
admin_site.register(Building, BuildingAdmin)
admin_site.register(FloorPlan, FloorPlanAdmin)
admin_site.register(SpaceType, SpaceTypeAdmin)
admin_site.register(Space, SpaceAdmin)
admin_site.register(Reservation, ReservationAdmin)
admin_site.register(Notification, NotificationAdmin)