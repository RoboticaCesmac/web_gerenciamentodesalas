from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group

class SpacesAdminSite(AdminSite):
    site_header = 'CESMAC - Gerenciamento de Salas'
    site_title = 'CESMAC Admin'
    index_title = 'Administração'

admin_site = SpacesAdminSite(name='spaces_admin')

# Register built-in models
admin_site.register(Group)  # Add this if you need group management