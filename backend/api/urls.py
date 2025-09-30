from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Creamos un router para registrar los ViewSets
router = DefaultRouter()
router.register(r'hechos-historicos', views.HechoHistoricoViewSet, basename='hecho-historico')
router.register(r'mi-viaje', views.ElementoGuardadoViewSet, basename='elemento-guardado')
router.register(r'config/menu-items', views.MenuItemViewSet, basename='menu-item')
router.register(r'contenido-municipio', views.ContenidoMunicipioViewSet, basename='contenido-municipio')
router.register(r'paginas-institucionales', views.PaginaInstitucionalViewSet, basename='pagina-institucional')
router.register(r'admin/users', views.UserViewSet, basename='user-admin')
router.register(r'admin/homepage-components', views.HomePageComponentViewSet, basename='homepage-component')
router.register(r'admin/audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'resenas', views.ResenaViewSet, basename='resena')
router.register(r'sugerencias', views.SugerenciaViewSet, basename='sugerencia')
router.register(r'admin/sugerencias', views.SugerenciaAdminViewSet, basename='sugerencia-admin')
router.register(r'caracterizacion/eventos', views.CaracterizacionEmpresaEventosViewSet, basename='caracterizacion-eventos')
router.register(r'caracterizacion/agroturismo', views.CaracterizacionAgroturismoViewSet, basename='caracterizacion-agroturismo')
router.register(r'caracterizacion/guias', views.CaracterizacionGuiaTuristicoViewSet, basename='caracterizacion-guias')
router.register(r'caracterizacion/artesanos', views.CaracterizacionArtesanoViewSet, basename='caracterizacion-artesanos')
router.register(r'consejos-locales', views.ConsejoLocalViewSet, basename='consejo-local')
router.register(r'diagnostico-rutas', views.DiagnosticoRutaTuristicaViewSet, basename='diagnostico-ruta')

urlpatterns = [
    # --- Configuración del Sitio (Acceso Público/Restringido) ---
    path('config/site/', views.SiteConfigurationView.as_view(), name='site-configuration'),

    # --- Vistas Privadas (Requieren Autenticación) ---
    path('profile/prestador/', views.PrestadorProfileView.as_view(), name='prestador-profile'),
    path('profile/artesano/', views.ArtesanoProfileView.as_view(), name='artesano-profile'),
    path('profile/feedback/', views.FeedbackProveedorView.as_view(), name='proveedor-feedback'),

    # --- Rutas generales para galería ---
    path('galeria/', views.ImagenGaleriaView.as_view(), name='galeria-list-create'),
    path('galeria/<int:pk>/', views.ImagenGaleriaDetailView.as_view(), name='galeria-detail'),

    # --- Rutas específicas para prestador ---
    path('galeria/prestador/', views.ImagenGaleriaView.as_view(), name='prestador-galeria-list-create'),
    path('galeria/prestador/<int:pk>/', views.ImagenGaleriaDetailView.as_view(), name='prestador-galeria-detail'),

    # --- Rutas específicas para artesano ---
    path('galeria/artesano/', views.ImagenArtesanoView.as_view(), name='artesano-galeria-list-create'),
    path('galeria/artesano/<int:pk>/', views.ImagenArtesanoDetailView.as_view(), name='artesano-galeria-detail'),

    # --- Documentos ---
    path('documentos/', views.DocumentoLegalizacionView.as_view(), name='documentos-list-create'),
    path('documentos/<int:pk>/', views.DocumentoLegalizacionDetailView.as_view(), name='documentos-detail'),

    # --- Claves LLM ---
    path('llm-keys/', views.LLMKeysView.as_view(), name='llm-keys'),

    # --- Incluimos las rutas del router ---
    path('', include(router.urls)),

    # --- Vistas Públicas ---
    path('sugerencias/felicitaciones-publicas/', views.FelicitacionesPublicasView.as_view(), name='felicitaciones-publicas-list'),
    path('prestadores/categorias/', views.CategoriaPrestadorListView.as_view(), name='prestador-categorias-list'),
    path('prestadores/', views.PrestadorServicioPublicListView.as_view(), name='prestador-public-list'),
    path('prestadores/<int:pk>/', views.PrestadorServicioPublicDetailView.as_view(), name='prestador-public-detail'),
    path('artesanos/rubros/', views.RubroArtesanoListView.as_view(), name='artesano-rubros-list'),
    path('artesanos/', views.ArtesanoPublicListView.as_view(), name='artesano-public-list'),
    path('artesanos/<int:pk>/', views.ArtesanoPublicDetailView.as_view(), name='artesano-public-detail'),
    path('publicaciones/', views.PublicacionListView.as_view(), name='publicaciones-list'),
    path('publicaciones/<slug:slug>/', views.PublicacionDetailView.as_view(), name='publicaciones-detail'),
    path('consejo-consultivo/', views.ConsejoConsultivoListView.as_view(), name='consejo-consultivo-list'),
    path('videos/', views.VideoListView.as_view(), name='videos-list'),
    path('atractivos/', views.AtractivoTuristicoListView.as_view(), name='atractivos-list'),
    path('atractivos/<slug:slug>/', views.AtractivoTuristicoDetailView.as_view(), name='atractivos-detail'),
    path('locations/', views.LocationListView.as_view(), name='locations-list'),
    path('galeria-media/', views.GaleriaListView.as_view(), name='galeria-media-list'),

    # --- Vistas para el Sistema de Agentes ---
    path('agent/tasks/', views.AgentCommandView.as_view(), name='agent-command'),
    path('agent/tasks/<uuid:id>/', views.AgentTaskStatusView.as_view(), name='agent-task-status'),

    # --- Vistas de Administración (endpoints específicos no cubiertos por el router) ---
    path('admin/prestadores/', views.AdminPrestadorListView.as_view(), name='admin-prestador-list'),
    path('admin/prestadores/<int:pk>/approve/', views.AdminApprovePrestadorView.as_view(), name='admin-prestador-approve'),
    path('admin/artesanos/', views.AdminArtesanoListView.as_view(), name='admin-artesano-list'),
    path('admin/artesanos/<int:pk>/approve/', views.AdminApproveArtesanoView.as_view(), name='admin-artesano-approve'),
]