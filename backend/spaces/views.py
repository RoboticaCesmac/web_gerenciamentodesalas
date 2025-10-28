from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from .models import FloorPlan

@staff_member_required
def get_floor_plan(request):
    building_id = request.GET.get('building_id')
    floor_name = request.GET.get('floor_name')
    
    print(f"Looking up floor plan for building: {building_id}, floor: {floor_name}")  # Debug log
    
    try:
        floor = FloorPlan.objects.get(building_id=building_id, floor_name=floor_name)
        if floor.plan_image:
            return JsonResponse({
                'success': True,
                'image_url': floor.plan_image.url,
                'floor_name': floor.floor_name
            })
        return JsonResponse({
            'success': False,
            'error': 'Este andar não possui planta cadastrada'
        })
    except FloorPlan.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Planta não encontrada'
        })
    except Exception as e:
        print(f"Error getting floor plan: {str(e)}")  # Debug log
        return JsonResponse({
            'success': False,
            'error': 'Erro ao carregar a planta'
        })
