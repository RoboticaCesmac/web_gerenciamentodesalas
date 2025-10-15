from django.contrib import admin
from django.urls import path, include
from spaces.admin_site import admin_site
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('admin/', admin_site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('spaces.urls')),
    path('', RedirectView.as_view(url='/admin/', permanent=True)),
    path('logout/', LogoutView.as_view(
        next_page='/admin/login/',
        template_name='registration/logged_out.html'
    ), name='admin_logout'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)