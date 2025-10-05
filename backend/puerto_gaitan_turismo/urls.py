"""
URL configuration for puerto_gaitan_turismo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# La importación de 'TuristaRegisterView' se mueve dentro de los patrones de URL
# para romper un ciclo de importación que ocurre durante el arranque del servidor.

urlpatterns = [
    path("admin/", admin.site.urls),
    # Rutas de autenticación
    path("api/auth/", include("dj_rest_auth.urls")),
    # Registro para Prestadores (el default)
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    # Registro para Turistas (endpoint específico)
    path(
        "api/auth/registration/turista/",
        # Importación perezosa (lazy import) de la vista
        lambda request, *args, **kwargs: __import__('api.views', fromlist=['TuristaRegisterView']).TuristaRegisterView.as_view()(request, *args, **kwargs),
        name='turista-register'
    ),
    # Registro para Artesanos (endpoint específico)
    path(
        "api/auth/registration/artesano/",
        lambda request, *args, **kwargs: __import__('api.views', fromlist=['ArtesanoRegisterView']).ArtesanoRegisterView.as_view()(request, *args, **kwargs),
        name='artesano-register'
    ),
    # Rutas de Administración
    path("api/admin/", include("api.admin_urls")),
    # Rutas de la API de la aplicación
    path("api/", include("api.urls")),
]

# Servir archivos multimedia en modo de desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
