from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'publicaciones', views.AdminPublicacionViewSet, basename='admin-publicaciones')
router.register(r'contenido-municipio', views.ContenidoMunicipioViewSet, basename='contenido-municipio')
router.register(r'users', views.UserViewSet, basename='admin-users')
router.register(r'menu-items', views.MenuItemViewSet, basename='admin-menu-items')
router.register(r'homepage-components', views.HomePageComponentViewSet, basename='admin-homepage-components')
router.register(r'audit-logs', views.AuditLogViewSet, basename='admin-audit-logs')
router.register(r'sugerencias', views.SugerenciaAdminViewSet, basename='admin-sugerencias')

urlpatterns = [
    path('prestadores/', views.AdminPrestadorListView.as_view(), name='admin-prestadores-list'),
    path('prestadores/<int:pk>/approve/', views.AdminApprovePrestadorView.as_view(), name='admin-prestador-approve'),
    path('site-config/', views.SiteConfigurationView.as_view(), name='admin-site-config'),
    path('statistics/', views.StatisticsView.as_view(), name='admin-statistics'),
    path('', include(router.urls)),
]