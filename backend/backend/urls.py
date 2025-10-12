from django.contrib import admin
from django.urls import path, include
from spaces.admin_site import admin_site
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin_site.urls),  # This will now handle both spaces and accounts
    path('api/auth/', include('accounts.urls')),
    path('api/', include('spaces.urls')),
    path('', RedirectView.as_view(url='/admin/', permanent=True)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)