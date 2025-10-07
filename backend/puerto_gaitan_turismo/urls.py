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
from api.views import (
    TuristaRegisterView,
    ArtesanoRegisterView,
    AdministradorRegisterView,
    FuncionarioDirectivoRegisterView,
    FuncionarioProfesionalRegisterView
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Rutas de autenticación
    path("api/auth/", include("dj_rest_auth.urls")),
    # Registro para Prestadores (el default de dj-rest-auth)
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    # Endpoints de registro específicos para cada rol
    path("api/auth/registration/turista/", TuristaRegisterView.as_view(), name='turista-register'),
    path("api/auth/registration/artesano/", ArtesanoRegisterView.as_view(), name='artesano-register'),
    path("api/auth/registration/administrador/", AdministradorRegisterView.as_view(), name='administrador-register'),
    path("api/auth/registration/funcionario_directivo/", FuncionarioDirectivoRegisterView.as_view(), name='funcionario-directivo-register'),
    path("api/auth/registration/funcionario_profesional/", FuncionarioProfesionalRegisterView.as_view(), name='funcionario-profesional-register'),
    # Rutas de Administración
    path("api/admin/", include("api.admin_urls")),
    # Rutas de la API de la aplicación
    path("api/", include("api.urls")),
]

# Servir archivos multimedia en modo de desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
