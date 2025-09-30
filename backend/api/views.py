from rest_framework import generics, views, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from dj_rest_auth.registration.views import RegisterView
import asyncio
import threading
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
import json
from datetime import datetime, timedelta
from django.db.models.functions import TruncDay
from django.db.models import Count
from .models import (
    CustomUser,
    PrestadorServicio,
    ImagenGaleria,
    ImagenArtesano,
    DocumentoLegalizacion,
    Publicacion,
    ConsejoConsultivo,
    AtractivoTuristico,
    ElementoGuardado,
    CategoriaPrestador,
    Video,
    ContenidoMunicipio,
    AgentTask,
    SiteConfiguration,
    MenuItem,
    HomePageComponent,
    AuditLog,
    PaginaInstitucional,
    ImagenAtractivo,
    Artesano,
    RubroArtesano,
    Resena,
    Sugerencia,
)
from .serializers import (
    GaleriaItemSerializer,
    PaginaInstitucionalSerializer,
    PrestadorServicioSerializer,
    PrestadorServicioUpdateSerializer,
    ArtesanoSerializer,
    ArtesanoUpdateSerializer,
    ImagenGaleriaSerializer,
    ImagenArtesanoSerializer,
    DocumentoLegalizacionSerializer,
    PublicacionListSerializer,
    PublicacionDetailSerializer,
    VideoSerializer,
    ConsejoConsultivoSerializer,
    AtractivoTuristicoListSerializer,
    AtractivoTuristicoDetailSerializer,
    LocationSerializer,
    TuristaRegisterSerializer,
    ArtesanoRegisterSerializer,
    ElementoGuardadoSerializer,
    ElementoGuardadoCreateSerializer,
    CategoriaPrestadorSerializer,
    PrestadorServicioPublicListSerializer,
    PrestadorServicioPublicDetailSerializer,
    RubroArtesanoSerializer,
    ArtesanoPublicListSerializer,
    ArtesanoPublicDetailSerializer,
    AdminPrestadorServicioSerializer,
    AdminArtesanoSerializer,
    ContenidoMunicipioSerializer,
    AgentCommandSerializer,
    AgentTaskSerializer,
    LLMKeysSerializer,
    SiteConfigurationSerializer,
    MenuItemSerializer,
    AdminUserSerializer,
    HomePageComponentSerializer,
    AuditLogSerializer,
    AdminPublicacionSerializer,
    HechoHistoricoSerializer,
    ResenaSerializer,
    ResenaCreateSerializer,
    SugerenciaSerializer,
    SugerenciaAdminSerializer,
    FeedbackProveedorSerializer,
    FelicitacionPublicaSerializer
)
from .models import HechoHistorico

from .permissions import (
    IsTurista,
    IsAdminOrFuncionario,
    IsAdmin,
    IsAdminOrFuncionarioForUserManagement,
    CaracterizacionPermission,
    ArtesanoCaracterizacionPermission,
)
from .models import (
    CaracterizacionEmpresaEventos, CaracterizacionAgroturismo, CaracterizacionGuiaTuristico, CaracterizacionArtesano,
    ConsejoLocal, DiagnosticoRutaTuristica
)
from .serializers import (
    CaracterizacionEmpresaEventosSerializer, CaracterizacionAgroturismoSerializer, CaracterizacionGuiaTuristicoSerializer,
    CaracterizacionArtesanoSerializer, ConsejoLocalSerializer, DiagnosticoRutaTuristicaSerializer
)
from .permissions import IsAdminOrDirectivo
from .filters import AuditLogFilter


class CaracterizacionEmpresaEventosViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de la Caracterización de Empresas de Eventos.
    Los permisos son manejados por la clase CaracterizacionPermission.
    """
    queryset = CaracterizacionEmpresaEventos.objects.all()
    serializer_class = CaracterizacionEmpresaEventosSerializer
    permission_classes = [CaracterizacionPermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """
        Filtra el queryset para que los usuarios no-staff solo vean su propia caracterización.
        """
        user = self.request.user
        if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            # Admins y funcionarios pueden ver todas. Pueden filtrar por prestador.
            prestador_id = self.request.query_params.get('prestador_id')
            if prestador_id:
                return self.queryset.filter(prestador_id=prestador_id)
            return self.queryset.all()

        # Un prestador solo puede ver la suya.
        if hasattr(user, 'perfil_prestador'):
            return self.queryset.filter(prestador=user.perfil_prestador)

        return self.queryset.none()

    def perform_create(self, serializer):
        # Asegura que un prestador solo pueda crear una caracterización para sí mismo.
        if self.request.user.role == CustomUser.Role.PRESTADOR:
            serializer.save(prestador=self.request.user.perfil_prestador)
        else:
            # Admins deben especificar el prestador en el request.
            serializer.save()


class CaracterizacionAgroturismoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de la Caracterización de Agroturismo.
    Los permisos son manejados por la clase CaracterizacionPermission.
    """
    queryset = CaracterizacionAgroturismo.objects.all()
    serializer_class = CaracterizacionAgroturismoSerializer
    permission_classes = [CaracterizacionPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            prestador_id = self.request.query_params.get('prestador_id')
            if prestador_id:
                return self.queryset.filter(prestador_id=prestador_id)
            return self.queryset.all()

        if hasattr(user, 'perfil_prestador'):
            return self.queryset.filter(prestador=user.perfil_prestador)

        return self.queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role == CustomUser.Role.PRESTADOR:
            serializer.save(prestador=self.request.user.perfil_prestador)
        else:
            serializer.save()


class CaracterizacionGuiaTuristicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de la Caracterización de Guías Turísticos.
    """
    queryset = CaracterizacionGuiaTuristico.objects.all()
    serializer_class = CaracterizacionGuiaTuristicoSerializer
    permission_classes = [CaracterizacionPermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            prestador_id = self.request.query_params.get('prestador_id')
            if prestador_id:
                return self.queryset.filter(prestador_id=prestador_id)
            return self.queryset.all()

        if hasattr(user, 'perfil_prestador'):
            return self.queryset.filter(prestador=user.perfil_prestador)

        return self.queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role == CustomUser.Role.PRESTADOR:
            serializer.save(prestador=self.request.user.perfil_prestador)
        else:
            serializer.save()


class CaracterizacionArtesanoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de la Caracterización de Artesanos.
    """
    queryset = CaracterizacionArtesano.objects.all()
    serializer_class = CaracterizacionArtesanoSerializer
    permission_classes = [ArtesanoCaracterizacionPermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            artesano_id = self.request.query_params.get('artesano_id')
            if artesano_id:
                return self.queryset.filter(artesano_id=artesano_id)
            return self.queryset.all()

        if hasattr(user, 'perfil_artesano'):
            return self.queryset.filter(artesano=user.perfil_artesano)

        return self.queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role == CustomUser.Role.ARTESANO:
            serializer.save(artesano=self.request.user.perfil_artesano)
        else:
            serializer.save()


class ConsejoLocalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Consejos Locales de Turismo.
    Solo accesible por Admins/Funcionarios.
    """
    queryset = ConsejoLocal.objects.all().prefetch_related('integrantes')
    serializer_class = ConsejoLocalSerializer
    permission_classes = [IsAdminOrFuncionario]
    parser_classes = [MultiPartParser, FormParser]


class DiagnosticoRutaTuristicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Diagnósticos de Rutas Turísticas.
    Solo accesible por Admins/Funcionarios.
    """
    queryset = DiagnosticoRutaTuristica.objects.all()
    serializer_class = DiagnosticoRutaTuristicaSerializer
    permission_classes = [IsAdminOrFuncionario]

    def perform_create(self, serializer):
        serializer.save(elaborado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(elaborado_por=self.request.user)


def log_audit_action(user, instance, action, details=None):
    """
    Función de utilidad para crear un registro de auditoría.
    """
    AuditLog.objects.create(
        user=user,
        content_object=instance,
        action=action,
        details=json.dumps(details) if details else None
    )

class PrestadorProfileView(generics.RetrieveUpdateAPIView):
    queryset = PrestadorServicio.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PrestadorServicioUpdateSerializer
        return PrestadorServicioSerializer

    def get_object(self):
        try:
            return self.request.user.perfil_prestador
        except PrestadorServicio.DoesNotExist:
            from django.http import Http404
            raise Http404("El perfil de prestador no fue encontrado para este usuario.")


class ArtesanoProfileView(generics.RetrieveUpdateAPIView):
    queryset = Artesano.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Para soportar la subida de fotos

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ArtesanoUpdateSerializer
        return ArtesanoSerializer

    def get_object(self):
        try:
            return self.request.user.perfil_artesano
        except Artesano.DoesNotExist:
            from django.http import Http404
            raise Http404("El perfil de artesano no fue encontrado para este usuario.")


class FeedbackProveedorView(generics.ListAPIView):
    """
    Vista para que un proveedor (prestador o artesano) vea el feedback
    (quejas/sugerencias) dirigido específicamente a su perfil.
    """
    serializer_class = FeedbackProveedorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        content_object = None

        # Determinar si el usuario es un prestador o un artesano
        if hasattr(user, 'perfil_prestador'):
            content_object = user.perfil_prestador
        elif hasattr(user, 'perfil_artesano'):
            content_object = user.perfil_artesano

        if content_object:
            content_type = ContentType.objects.get_for_model(content_object)
            # Filtrar por quejas o sugerencias dirigidas a este objeto
            return Sugerencia.objects.filter(
                content_type=content_type,
                object_id=content_object.pk,
                tipo_mensaje__in=[Sugerencia.TipoMensaje.QUEJA, Sugerencia.TipoMensaje.SUGERENCIA]
            ).order_by('-fecha_envio')

        return Sugerencia.objects.none()


class ImagenGaleriaView(generics.ListCreateAPIView):
    serializer_class = ImagenGaleriaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ImagenGaleria.objects.filter(prestador=self.request.user.perfil_prestador)

    def perform_create(self, serializer):
        serializer.save(prestador=self.request.user.perfil_prestador)
class ImagenGaleriaDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ImagenGaleriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ImagenGaleria.objects.filter(prestador=self.request.user.perfil_prestador)


class ImagenArtesanoView(generics.ListCreateAPIView):
    serializer_class = ImagenArtesanoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        try:
            return ImagenArtesano.objects.filter(artesano=self.request.user.perfil_artesano)
        except Artesano.DoesNotExist:
            return ImagenArtesano.objects.none()

    def perform_create(self, serializer):
        try:
            serializer.save(artesano=self.request.user.perfil_artesano)
        except Artesano.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("El usuario actual no tiene un perfil de artesano.")


class ImagenArtesanoDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ImagenArtesanoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            return ImagenArtesano.objects.filter(artesano=self.request.user.perfil_artesano)
        except Artesano.DoesNotExist:
            return ImagenArtesano.objects.none()


class DocumentoLegalizacionView(generics.ListCreateAPIView):
    serializer_class = DocumentoLegalizacionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return DocumentoLegalizacion.objects.filter(prestador=self.request.user.perfil_prestador)

    def perform_create(self, serializer):
        serializer.save(prestador=self.request.user.perfil_prestador)


class DocumentoLegalizacionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentoLegalizacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DocumentoLegalizacion.objects.filter(prestador=self.request.user.perfil_prestador)


class TuristaRegisterView(RegisterView):
    serializer_class = TuristaRegisterSerializer


class ArtesanoRegisterView(RegisterView):
    serializer_class = ArtesanoRegisterSerializer


class ElementoGuardadoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTurista]

    def get_queryset(self):
        return ElementoGuardado.objects.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ElementoGuardadoCreateSerializer
        return ElementoGuardadoSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class ResenaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las Reseñas y Calificaciones.
    - list: Devuelve las reseñas aprobadas para un objeto específico (prestador o artesano).
            Requiere `content_type` y `object_id` como query params.
    - create: Permite a un usuario autenticado crear una reseña.
    """
    queryset = Resena.objects.all().order_by('-fecha_creacion')

    def get_serializer_class(self):
        if self.action == 'create':
            return ResenaCreateSerializer
        return ResenaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        elif self.action == 'create':
            self.permission_classes = [IsAuthenticated]
        else: # update, partial_update, destroy, approve
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()

        # Para la vista pública, solo mostrar reseñas aprobadas.
        if self.action == 'list':
            queryset = queryset.filter(aprobada=True)

            content_type_str = self.request.query_params.get('content_type')
            object_id_str = self.request.query_params.get('object_id')

            if content_type_str and object_id_str:
                model_map = {
                    'prestadorservicio': PrestadorServicio,
                    'artesano': Artesano,
                }
                Model = model_map.get(content_type_str.lower())
                if Model:
                    try:
                        content_type = ContentType.objects.get_for_model(Model)
                        queryset = queryset.filter(content_type=content_type, object_id=object_id_str)
                    except ContentType.DoesNotExist:
                        return queryset.none()

        return queryset

    def perform_create(self, serializer):
        # La validación y creación/actualización se maneja en el serializador
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrFuncionario])
    def approve(self, request, pk=None):
        """
        Acción para que un administrador apruebe una reseña.
        """
        resena = self.get_object()
        resena.aprobada = True
        resena.save(update_fields=['aprobada'])
        return Response({'status': 'Reseña aprobada con éxito.'}, status=status.HTTP_200_OK)


class FelicitacionesPublicasView(generics.ListAPIView):
    """
    Vista pública para devolver una lista de felicitaciones marcadas como públicas.
    Utilizada por el componente de testimonios en la página de inicio.
    """
    queryset = Sugerencia.objects.filter(
        tipo_mensaje=Sugerencia.TipoMensaje.FELICITACION,
        es_publico=True
    ).order_by('-fecha_envio')
    serializer_class = FelicitacionPublicaSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Devolvemos todas, sin paginación


class SugerenciaViewSet(viewsets.mixins.CreateModelMixin,
                        viewsets.GenericViewSet):
    """
    ViewSet PÚBLICO para el Buzón de Sugerencias.
    Solo permite la creación (POST) de nuevas sugerencias.
    """
    queryset = Sugerencia.objects.all()
    serializer_class = SugerenciaSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Si el usuario está autenticado, lo asociamos a la sugerencia.
        if self.request.user.is_authenticated:
            serializer.save(usuario=self.request.user)
        else:
            serializer.save()


class SugerenciaAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet PRIVADO para la gestión de Sugerencias por parte de administradores.
    """
    queryset = Sugerencia.objects.all().order_by('-fecha_envio')
    serializer_class = SugerenciaAdminSerializer
    permission_classes = [IsAdminOrFuncionario]
    filter_backends = [OrderingFilter, SearchFilter]
    search_fields = ['mensaje', 'nombre_remitente', 'email_remitente', 'usuario__username']
    ordering_fields = ['fecha_envio', 'estado', 'tipo_mensaje']


# --- Vistas Públicas ---

class PublicacionListView(generics.ListAPIView):
    serializer_class = PublicacionListSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['titulo', 'contenido']
    ordering_fields = ['fecha_publicacion', 'titulo', 'fecha_evento_inicio']

    def get_queryset(self):
        config = SiteConfiguration.load()
        if not config.seccion_publicaciones_activa:
            return Publicacion.objects.none()

        queryset = Publicacion.objects.filter(es_publicado=True)

        # Lógica para "Eventos Destacados"
        if self.request.query_params.get('destacados'):
            limit = int(self.request.query_params.get('limit', 5))
            return queryset.filter(
                tipo='EVENTO',
                fecha_evento_inicio__gte=timezone.now()
            ).order_by('fecha_evento_inicio')[:limit]

        # Lógica para el calendario de la Agenda Cultural
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(
                tipo='EVENTO',
                fecha_evento_inicio__lte=end_date,
                fecha_evento_fin__gte=start_date
            )

        # Lógica de filtrado por tipo existente
        tipos = self.request.query_params.get('tipo', None)
        if tipos:
            lista_tipos = [tipo.strip().upper() for tipo in tipos.split(',')]
            queryset = queryset.filter(tipo__in=lista_tipos)

        return queryset


class GaleriaListView(generics.ListAPIView):
    """
    Vista para unificar y devolver todos los elementos multimedia (imágenes y videos)
    para la página de la galería.
    """
    serializer_class = GaleriaItemSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Devolvemos todos los elementos sin paginar

    def get_queryset(self):
        # Obtener todas las imágenes de atractivos publicados
        imagenes = ImagenAtractivo.objects.filter(atractivo__es_publicado=True).select_related('atractivo')
        # Obtener todos los videos
        videos = Video.objects.all()

        # Transformar los datos a un formato unificado
        unified_list = []

        # Procesar imágenes
        for img in imagenes:
            unified_list.append({
                'id': f'imagen_{img.id}',
                'tipo': 'imagen',
                'url': self.request.build_absolute_uri(img.imagen.url),
                'thumbnail_url': self.request.build_absolute_uri(img.imagen.url), # Se puede optimizar con thumbnails
                'titulo': img.atractivo.nombre,
                'descripcion': img.alt_text or f"Imagen de {img.atractivo.nombre}"
            })

        # Procesar videos
        for vid in videos:
            # Extraer ID de YouTube para la miniatura
            video_id = vid.url_youtube.split('v=')[-1].split('&')[0]
            thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

            unified_list.append({
                'id': f'video_{vid.id}',
                'tipo': 'video',
                'url': vid.url_youtube,
                'thumbnail_url': thumbnail,
                'titulo': vid.titulo,
                'descripcion': vid.descripcion
            })

        # Desordenar la lista para un efecto más dinámico
        import random
        random.shuffle(unified_list)

        return unified_list


class PublicacionDetailView(generics.RetrieveAPIView):
    serializer_class = PublicacionDetailSerializer
    permission_classes = [AllowAny]
    queryset = Publicacion.objects.filter(es_publicado=True)
    lookup_field = 'slug'


class ConsejoConsultivoListView(generics.ListAPIView):
    queryset = ConsejoConsultivo.objects.filter(es_publicado=True).order_by('-fecha_publicacion')
    serializer_class = ConsejoConsultivoSerializer
    permission_classes = [AllowAny]


class VideoListView(generics.ListAPIView):
    queryset = Video.objects.all().order_by('-fecha_publicacion')
    serializer_class = VideoSerializer
    permission_classes = [AllowAny]


class CategoriaPrestadorListView(generics.ListAPIView):
    queryset = CategoriaPrestador.objects.all().order_by('nombre')
    serializer_class = CategoriaPrestadorSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Desactiva la paginación para esta vista


class RubroArtesanoListView(generics.ListAPIView):
    queryset = RubroArtesano.objects.all().order_by('nombre')
    serializer_class = RubroArtesanoSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class PrestadorServicioPublicListView(generics.ListAPIView):
    serializer_class = PrestadorServicioPublicListSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre_negocio', 'descripcion']
    ordering_fields = ['nombre_negocio']

    def get_queryset(self):
        config = SiteConfiguration.load()
        if not config.seccion_prestadores_activa:
            return PrestadorServicio.objects.none()

        queryset = PrestadorServicio.objects.filter(aprobado=True)
        categoria_slug = self.request.query_params.get('categoria', None)
        if categoria_slug:
            queryset = queryset.filter(categoria__slug=categoria_slug)
        return queryset


class PrestadorServicioPublicDetailView(generics.RetrieveAPIView):
    queryset = PrestadorServicio.objects.filter(aprobado=True)
    serializer_class = PrestadorServicioPublicDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'


class ArtesanoPublicListView(generics.ListAPIView):
    serializer_class = ArtesanoPublicListSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre_taller', 'nombre_artesano', 'descripcion']
    ordering_fields = ['nombre_taller']

    def get_queryset(self):
        queryset = Artesano.objects.filter(aprobado=True)
        rubro_slug = self.request.query_params.get('rubro', None)
        if rubro_slug:
            queryset = queryset.filter(rubro__slug=rubro_slug)
        return queryset


class ArtesanoPublicDetailView(generics.RetrieveAPIView):
    queryset = Artesano.objects.filter(aprobado=True)
    serializer_class = ArtesanoPublicDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'


class AtractivoTuristicoListView(generics.ListAPIView):
    serializer_class = AtractivoTuristicoListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        config = SiteConfiguration.load()
        if not config.seccion_atractivos_activa:
            return AtractivoTuristico.objects.none()

        queryset = AtractivoTuristico.objects.filter(es_publicado=True)
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria_color__iexact=categoria)
        return queryset


class AtractivoTuristicoDetailView(generics.RetrieveAPIView):
    queryset = AtractivoTuristico.objects.filter(es_publicado=True)
    serializer_class = AtractivoTuristicoDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class LocationListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        locations = []
        prestadores = PrestadorServicio.objects.filter(aprobado=True, ubicacion_mapa__isnull=False).exclude(ubicacion_mapa__exact='')
        for p in prestadores:
            try:
                lat, lng = map(float, p.ubicacion_mapa.split(','))
                locations.append({'id': f'prestador_{p.id}', 'nombre': p.nombre_negocio, 'lat': lat, 'lng': lng, 'tipo': p.categoria.slug if p.categoria else 'prestador', 'url_detalle': None})
            except (ValueError, AttributeError):
                continue
        atractivos = AtractivoTuristico.objects.filter(es_publicado=True, ubicacion_mapa__isnull=False).exclude(ubicacion_mapa__exact='')
        for a in atractivos:
            try:
                lat, lng = map(float, a.ubicacion_mapa.split(','))
                locations.append({'id': f'atractivo_{a.id}', 'nombre': a.nombre, 'lat': lat, 'lng': lng, 'tipo': f'atractivo_{a.categoria_color.lower()}', 'url_detalle': f'/atractivos/{a.slug}'})
            except (ValueError, AttributeError):
                continue
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)


# --- Vistas de Administración ---

class AdminArtesanoListView(generics.ListAPIView):
    queryset = Artesano.objects.all().order_by('-fecha_creacion')
    serializer_class = AdminArtesanoSerializer
    permission_classes = [IsAdminOrFuncionario]
    filter_backends = [OrderingFilter]
    ordering_fields = ['fecha_creacion', 'nombre_taller']

    def get_queryset(self):
        queryset = super().get_queryset()
        aprobado_param = self.request.query_params.get('aprobado')
        if aprobado_param is not None:
            aprobado = aprobado_param.lower() == 'true'
            queryset = queryset.filter(aprobado=aprobado)
        return queryset


class AdminPrestadorListView(generics.ListAPIView):
    queryset = PrestadorServicio.objects.all().order_by('-fecha_creacion')
    serializer_class = AdminPrestadorServicioSerializer
    permission_classes = [IsAdminOrFuncionario]
    filter_backends = [OrderingFilter]
    ordering_fields = ['fecha_creacion', 'nombre_negocio']

    def get_queryset(self):
        queryset = super().get_queryset()
        aprobado_param = self.request.query_params.get('aprobado')
        if aprobado_param is not None:
            aprobado = aprobado_param.lower() == 'true'
            queryset = queryset.filter(aprobado=aprobado)
        return queryset


class AdminApprovePrestadorView(views.APIView):
    permission_classes = [IsAdminOrFuncionario]

    def patch(self, request, pk, *args, **kwargs):
        try:
            prestador = PrestadorServicio.objects.get(pk=pk)
        except PrestadorServicio.DoesNotExist:
            return Response({'error': 'Prestador no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        prestador.aprobado = True
        prestador.save(update_fields=['aprobado'])
        return Response({'status': 'Prestador aprobado con éxito.'}, status=status.HTTP_200_OK)


class AdminApproveArtesanoView(views.APIView):
    permission_classes = [IsAdminOrFuncionario]

    def patch(self, request, pk, *args, **kwargs):
        try:
            artesano = Artesano.objects.get(pk=pk)
        except Artesano.DoesNotExist:
            return Response({'error': 'Artesano no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        artesano.aprobado = True
        artesano.save(update_fields=['aprobado'])
        return Response({'status': 'Artesano aprobado con éxito.'}, status=status.HTTP_200_OK)


class AdminPublicacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Publicaciones en el panel de administración.
    - Profesionales: Pueden crear/editar, pero queda pendiente de aprobación.
    - Directivos/Admins: Pueden crear/editar y aprobar directamente.
    """
    queryset = Publicacion.objects.all().order_by('-fecha_publicacion')
    serializer_class = AdminPublicacionSerializer
    permission_classes = [IsAdminOrFuncionario]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        user = self.request.user
        # Profesionales solo pueden crear como no publicado
        if user.role == CustomUser.Role.FUNCIONARIO_PROFESIONAL:
            serializer.save(autor=user, es_publicado=False)
        else:
            # Admins y Directivos respetan el valor de 'es_publicado' del request o lo publican por defecto
            serializer.save(autor=user)

    def perform_update(self, serializer):
        user = self.request.user
        # Profesionales no pueden auto-aprobar sus ediciones
        if user.role == CustomUser.Role.FUNCIONARIO_PROFESIONAL:
            # Forzamos a que la publicación quede como no publicada al ser editada por un profesional
            serializer.save(es_publicado=False)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrDirectivo])
    def approve(self, request, pk=None):
        """
        Acción para que un Directivo o Admin apruebe una publicación.
        """
        publicacion = self.get_object()
        publicacion.es_publicado = True
        publicacion.save(update_fields=['es_publicado'])
        return Response({'status': 'Publicación aprobada con éxito.'}, status=status.HTTP_200_OK)


class ContenidoMunicipioViewSet(viewsets.ModelViewSet):
    queryset = ContenidoMunicipio.objects.all().order_by('orden')
    serializer_class = ContenidoMunicipioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save(actualizado_por=self.request.user)
        log_audit_action(self.request.user, instance, AuditLog.Action.CONTENIDO_CREATE, details={'titulo': instance.titulo})

    def perform_update(self, serializer):
        instance = serializer.save(actualizado_por=self.request.user)
        log_audit_action(self.request.user, instance, AuditLog.Action.CONTENIDO_UPDATE, details={'titulo': instance.titulo})

    def perform_destroy(self, instance):
        details = {'titulo': instance.titulo}
        log_audit_action(self.request.user, instance, AuditLog.Action.CONTENIDO_DELETE, details)
        instance.delete()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context


class HomePageComponentViewSet(viewsets.ModelViewSet):
    serializer_class = HomePageComponentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # Para usuarios no autenticados (público), solo mostrar componentes activos.
        # Para administradores, mostrar todos para que puedan gestionarlos.
        if self.action == 'list' and not self.request.user.is_authenticated:
            return HomePageComponent.objects.filter(is_active=True).order_by('order')
        # Para cualquier otra acción o si el usuario está autenticado (admin/funcionario), mostrar todos.
        return HomePageComponent.objects.all().order_by('order')

    def get_permissions(self):
        # Acciones de lectura son permitidas para cualquiera.
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        # Acciones de escritura requieren permisos de admin/funcionario.
        else:
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_action(self.request.user, instance, AuditLog.Action.COMPONENT_CREATE, details={'title': instance.title})

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(self.request.user, instance, AuditLog.Action.COMPONENT_UPDATE, details={'title': instance.title})

    def perform_destroy(self, instance):
        details = {'title': instance.title}
        log_audit_action(self.request.user, instance, AuditLog.Action.COMPONENT_DELETE, details)
        instance.delete()

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrFuncionario])
    def reorder(self, request, *args, **kwargs):
        """
        Acción personalizada para reordenar los componentes.
        Espera una lista de IDs en el cuerpo de la petición: `{"ordered_ids": [3, 1, 2]}`
        """
        ordered_ids = request.data.get('ordered_ids', [])
        if not isinstance(ordered_ids, list):
            return Response({"error": "Se esperaba una lista de IDs."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Actualizar el orden de cada componente basado en la lista recibida.
                for index, component_id in enumerate(ordered_ids):
                    HomePageComponent.objects.filter(pk=component_id).update(order=index)

            # Registrar un único evento de auditoría para la acción de reordenar.
            # Se usa el primer componente como objeto de referencia para el log.
            first_component = HomePageComponent.objects.filter(pk__in=ordered_ids).first()
            if first_component:
                log_audit_action(
                    request.user,
                    first_component,
                    AuditLog.Action.COMPONENT_REORDER,
                    details={"info": f"Se reordenaron {len(ordered_ids)} componentes."}
                )

            return Response({"status": "Componentes reordenados con éxito."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error al reordenar: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaginaInstitucionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las Páginas Institucionales.
    Permite el acceso público de lectura por slug.
    La creación y modificación está restringida a administradores/funcionarios.
    """
    queryset = PaginaInstitucional.objects.all()
    serializer_class = PaginaInstitucionalSerializer
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = 'slug'

    def get_permissions(self):
        # Lectura pública (lista y detalle)
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        # Escritura restringida
        else:
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Asigna el usuario actual al crear y registra en auditoría
        instance = serializer.save(actualizado_por=self.request.user)
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.CONTENIDO_CREATE, # Reutilizamos una acción existente
            details={'nombre_pagina': instance.nombre}
        )

    def perform_update(self, serializer):
        # Asigna el usuario actual al actualizar y registra en auditoría
        instance = serializer.save(actualizado_por=self.request.user)
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.CONTENIDO_UPDATE, # Reutilizamos una acción existente
            details={'nombre_pagina': instance.nombre}
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user').prefetch_related('content_object')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = AuditLogFilter
    ordering_fields = ['timestamp']
    search_fields = ['user__username', 'details', 'action']


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para que los administradores y funcionarios gestionen los usuarios del sistema.
    - ADMIN: Puede gestionar todos los usuarios.
    - FUNCIONARIO: Puede gestionar PRESTADOR, TURISTA y a sí mismo.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminOrFuncionarioForUserManagement]

    def get_queryset(self):
        """
        Filtra el queryset de usuarios según el rol del solicitante.
        """
        user = self.request.user
        if user.role == CustomUser.Role.ADMIN:
            return CustomUser.objects.all().order_by('username')
        if user.role in [CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            return CustomUser.objects.filter(
                models.Q(role=CustomUser.Role.PRESTADOR) |
                models.Q(role=CustomUser.Role.ARTESANO) |
                models.Q(role=CustomUser.Role.TURISTA) |
                models.Q(pk=user.pk)
            ).order_by('username').distinct()
        return CustomUser.objects.none()

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.USER_CREATE,
            details={'username': instance.username, 'role': instance.role}
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.USER_UPDATE,
            details={'username': instance.username, 'role': instance.role}
        )

    def perform_destroy(self, instance):
        details = {'username': instance.username, 'role': instance.role}
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.USER_DELETE,
            details
        )
        instance.delete()


# --- Vistas de Configuración del Sitio ---

class SiteConfigurationView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteConfigurationSerializer

    def get_object(self):
        return SiteConfiguration.load()

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdmin]
        return super().get_permissions()

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.SITE_CONFIG_UPDATE,
            details={'updated_fields': list(serializer.validated_data.keys())}
        )


class MenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los elementos del menú de navegación.
    - La lista (GET) es pública y devuelve solo los elementos principales (raíz).
    - La creación, actualización y eliminación requieren permisos de administrador.
    - Incluye una acción 'reorder' para actualizar la estructura anidada.
    """
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        if self.action == 'list':
            return MenuItem.objects.filter(parent__isnull=True).order_by('orden')
        return MenuItem.objects.all().order_by('orden')

    def get_permissions(self):
        # Permitir acceso público para 'list' y 'retrieve'
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        # Requerir permisos de administrador para todas las demás acciones
        else:
            self.permission_classes = [IsAdmin]
        return super().get_permissions()

    @action(detail=False, methods=['post'], url_path='reorder')
    @transaction.atomic
    def reorder(self, request, *args, **kwargs):
        """
        Acción personalizada para reordenar y reanidar los elementos del menú.
        Espera una lista de elementos de menú anidados en el cuerpo de la petición.
        Ej: [{"id": 1, "children": [{"id": 2, "children": []}]}, {"id": 3, "children": []}]
        """
        structured_menu = request.data

        def update_items_recursive(items, parent=None):
            for index, item_data in enumerate(items):
                item_id = item_data.get('id')
                if not item_id:
                    continue # O manejar error si es necesario

                try:
                    menu_item = MenuItem.objects.get(id=item_id)
                    menu_item.orden = index
                    menu_item.parent = parent
                    menu_item.save(update_fields=['orden', 'parent'])

                    if 'children' in item_data and item_data['children']:
                        update_items_recursive(item_data['children'], parent=menu_item)
                except MenuItem.DoesNotExist:
                    # Podríamos loggear un error aquí si un ID no se encuentra
                    continue

        try:
            update_items_recursive(structured_menu)
            # Log de auditoría para la acción de reordenar
            log_audit_action(
                request.user,
                None,  # No hay un objeto específico, es una acción global
                AuditLog.Action.MENU_UPDATE,
                details={"info": "Estructura del menú reordenada."}
            )
            return Response({"status": "Menú reordenado con éxito."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Error al reordenar el menú: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.MENU_CREATE,
            details={'name': instance.nombre, 'url': instance.url}
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.MENU_UPDATE,
            details={'name': instance.nombre, 'url': instance.url}
        )

    def perform_destroy(self, instance):
        details = {'name': instance.nombre, 'url': instance.url}
        log_audit_action(
            self.request.user,
            instance,
            AuditLog.Action.MENU_DELETE,
            details
        )
        instance.delete()


class HechoHistoricoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los Hechos Históricos de la línea de tiempo.
    """
    serializer_class = HechoHistoricoSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # El público solo ve los hechos publicados.
        if self.action in ['list', 'retrieve']:
            return HechoHistorico.objects.filter(es_publicado=True).order_by('ano')
        # Los administradores ven todos para poder gestionarlos.
        return HechoHistorico.objects.all().order_by('ano')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()


# --- Vistas para el Sistema de Agentes ---

def run_agent_in_background(task_id):
    from agents.corps.turismo_coronel import get_turismo_coronel_graph
    try:
        task = AgentTask.objects.get(id=task_id)
        task.status = AgentTask.Status.RUNNING
        task.save()
        coronel_agent = get_turismo_coronel_graph()
        config = {"configurable": {"thread_id": f"task_{task_id}"}}
        result = asyncio.run(coronel_agent.ainvoke({
            "general_order": task.command,
            "app_context": {"user_role": task.user.role if task.user else "TURISTA"}
        }, config=config))
        task.report = result.get("final_report", "La misión concluyó sin un informe detallado.")
        task.status = AgentTask.Status.COMPLETED
        task.save()
    except Exception as e:
        if 'task' in locals():
            task.report = f"Error crítico durante la ejecución de la misión: {str(e)}"
            task.status = AgentTask.Status.FAILED
            task.save()
        print(f"Error en el hilo del agente para la tarea {task_id}: {e}")


class AgentCommandView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AgentCommandSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        command = serializer.validated_data['orden']
        task = AgentTask.objects.create(user=request.user, command=command, status=AgentTask.Status.PENDING)
        thread = threading.Thread(target=run_agent_in_background, args=(task.id,))
        thread.start()
        return Response({"message": "Comando recibido. El agente ha sido desplegado.", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class AgentTaskStatusView(generics.RetrieveAPIView):
    queryset = AgentTask.objects.all()
    serializer_class = AgentTaskSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return AgentTask.objects.filter(user=self.request.user)


class LLMKeysView(generics.RetrieveUpdateAPIView):
    serializer_class = LLMKeysSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class StatisticsView(views.APIView):
    """
    Vista mejorada para obtener estadísticas generales y detalladas del sistema.
    Requiere permisos de administrador o funcionario.
    Acepta parámetros `start_date` y `end_date` (formato YYYY-MM-DD).
    """
    permission_classes = [IsAdminOrFuncionario]

    def get(self, request, *args, **kwargs):
        # 1. Procesar rango de fechas
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        try:
            if 'start_date' in request.query_params:
                start_date = datetime.strptime(request.query_params['start_date'], '%Y-%m-%d').date()
            if 'end_date' in request.query_params:
                end_date = datetime.strptime(request.query_params['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Usar YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # Asegurar que end_date es inclusivo para las consultas de fecha
        end_date_inclusive = end_date + timedelta(days=1)

        # 2. Filtrar Querysets base por rango de fechas
        users_in_range = CustomUser.objects.filter(date_joined__range=(start_date, end_date_inclusive))
        publicaciones_in_range = Publicacion.objects.filter(fecha_publicacion__range=(start_date, end_date_inclusive))

        # 3. Estadísticas de Resumen (Totales)
        user_counts = CustomUser.objects.values('role').annotate(count=Count('id'))
        user_stats = {item['role']: item['count'] for item in user_counts}

        prestadores_aprobados = PrestadorServicio.objects.filter(aprobado=True).count()
        prestadores_pendientes = PrestadorServicio.objects.filter(aprobado=False).count()

        artesanos_aprobados = Artesano.objects.filter(aprobado=True).count()
        artesanos_pendientes = Artesano.objects.filter(aprobado=False).count()

        publicaciones_por_tipo = Publicacion.objects.values('tipo').annotate(count=Count('id'))
        publicaciones_stats = {item['tipo']: item['count'] for item in publicaciones_por_tipo}

        # 4. Estadísticas de Series Temporales (para gráficos)
        nuevos_usuarios_por_dia = (
            users_in_range
            .annotate(day=TruncDay('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        nuevas_publicaciones_por_dia = (
            publicaciones_in_range
            .annotate(day=TruncDay('fecha_publicacion'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # Formatear para el frontend
        time_series_data = {
            'users': [{'date': item['day'].strftime('%Y-%m-%d'), 'count': item['count']} for item in nuevos_usuarios_por_dia],
            'publications': [{'date': item['day'].strftime('%Y-%m-%d'), 'count': item['count']} for item in nuevas_publicaciones_por_dia],
        }

        # 5. Ensamblar la respuesta
        data = {
            "summary": {
                "usuarios": {
                    "total": CustomUser.objects.count(),
                    "por_rol": user_stats
                },
                "prestadores": {
                    "total": prestadores_aprobados + prestadores_pendientes,
                    "aprobados": prestadores_aprobados,
                    "pendientes": prestadores_pendientes,
                },
                "artesanos": {
                    "total": artesanos_aprobados + artesanos_pendientes,
                    "aprobados": artesanos_aprobados,
                    "pendientes": artesanos_pendientes,
                },
                "contenido": {
                    "publicaciones_total": Publicacion.objects.count(),
                    "publicaciones_por_tipo": publicaciones_stats,
                    "atractivos_total": AtractivoTuristico.objects.count(),
                },
                "sistema": {
                    "logs_auditoria": AuditLog.objects.count(),
                }
            },
            "time_series": time_series_data,
            "query_range": {
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
            }
        }
        return Response(data, status=status.HTTP_200_OK)