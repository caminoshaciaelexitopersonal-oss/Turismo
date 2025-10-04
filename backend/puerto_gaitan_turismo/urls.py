"""
URL configuration for puerto_gaitan_turismo project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
from api.views import PrestadorRegisterView, TuristaRegisterView, ArtesanoRegisterView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Rutas de autenticación
    path("api/auth/", include("dj_rest_auth.urls")),
    path('api/auth/accounts/', include('allauth.urls')),
    # Rutas de registro personalizadas (exentas de CSRF)
    path("api/auth/registration/", csrf_exempt(PrestadorRegisterView.as_view()), name='prestador-register'),
    path("api/auth/registration/turista/", csrf_exempt(TuristaRegisterView.as_view()), name='turista-register'),
    path("api/auth/registration/artesano/", csrf_exempt(ArtesanoRegisterView.as_view()), name='artesano-register'),
    # Rutas de la API de la aplicación
    path("api/", include("api.urls")),
]

# Servir archivos multimedia en modo de desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)