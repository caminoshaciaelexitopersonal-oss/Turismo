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
from itertools import groupby
from operator import attrgetter
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
    RutaTuristica,
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
    HechoHistorico,
    ScoringRule,
    Notificacion,
    Formulario,
    Pregunta,
    OpcionRespuesta,
    RespuestaUsuario,
    PlantillaVerificacion,
    ItemVerificacion,
    Verificacion,
    RespuestaItemVerificacion,
    AsistenciaCapacitacion
)
from .serializers import (
    GaleriaItemSerializer,
    PaginaInstitucionalSerializer,
    ScoringRuleSerializer,
    NotificacionSerializer,
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
    AtractivoTuristicoWriteSerializer,
    RutaTuristicaListSerializer,
    RutaTuristicaDetailSerializer,
    LocationSerializer,
    PrestadorRegisterSerializer,
    TuristaRegisterSerializer,
    ArtesanoRegisterSerializer,
    AdministradorRegisterSerializer,
    FuncionarioDirectivoRegisterSerializer,
    FuncionarioProfesionalRegisterSerializer,
    ElementoGuardadoSerializer,
    ElementoGuardadoCreateSerializer,
    CategoriaPrestadorSerializer,
    PrestadorServicioPublicListSerializer,
    PrestadorServicioPublicDetailSerializer,
    RubroArtesanoSerializer,
    ArtesanoPublicListSerializer,
    ArtesanoPublicDetailSerializer,
    AdminPrestadorListSerializer,
    AdminPrestadorDetailSerializer,
    AdminArtesanoListSerializer,
    AdminArtesanoDetailSerializer,
    UsuarioListSerializer,
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
    FelicitacionPublicaSerializer,
    FormularioListSerializer,
    FormularioDetailSerializer,
    PreguntaSerializer,
    OpcionRespuestaSerializer,
    RespuestaUsuarioSerializer,
    RespuestaUsuarioCreateSerializer,
    PlantillaVerificacionListSerializer,
    PlantillaVerificacionDetailSerializer,
    VerificacionListSerializer,
    VerificacionDetailSerializer,
    IniciarVerificacionSerializer,
    GuardarVerificacionSerializer,
    AIConfigSerializer,
    CapacitacionDetailSerializer,
    RegistrarAsistenciaSerializer
)
from .permissions import (
    IsTurista,
    IsAdminOrFuncionario,
    IsAdmin,
    IsAdminOrFuncionarioForUserManagement,
    IsPrestador,
    IsAdminOrDirectivo,
    CanManageAtractivos
)
from .filters import AuditLogFilter


class FormularioViewSet(viewsets.ModelViewSet):
    queryset = Formulario.objects.all().prefetch_related('preguntas__opciones')
    def get_serializer_class(self):
        if self.action == 'list':
            return FormularioListSerializer
        return FormularioDetailSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdminOrDirectivo]
        return super().get_permissions()
    def get_queryset(self):
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            return self.queryset.filter(es_publico=True)
        return self.queryset

class PrestadorRegisterView(RegisterView):
    serializer_class = PrestadorRegisterSerializer

class TuristaRegisterView(RegisterView):
    serializer_class = TuristaRegisterSerializer

class ArtesanoRegisterView(RegisterView):
    serializer_class = ArtesanoRegisterSerializer


class AdministradorRegisterView(RegisterView):
    serializer_class = AdministradorRegisterSerializer


class FuncionarioDirectivoRegisterView(RegisterView):
    serializer_class = FuncionarioDirectivoRegisterSerializer


class FuncionarioProfesionalRegisterView(RegisterView):
    serializer_class = FuncionarioProfesionalRegisterSerializer


class DocumentoLegalizacionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentoLegalizacionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return DocumentoLegalizacion.objects.filter(prestador=self.request.user.perfil_prestador)

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
        else:
            self.permission_classes = [IsAdminOrFuncionario]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(aprobada=True)
            content_type_str = self.request.query_params.get('content_type')
            object_id_str = self.request.query_params.get('object_id')
            if content_type_str and object_id_str:
                model_map = {'prestadorservicio': PrestadorServicio, 'artesano': Artesano}
                Model = model_map.get(content_type_str.lower())
                if Model:
                    try:
                        content_type = ContentType.objects.get_for_model(Model)
                        queryset = queryset.filter(content_type=content_type, object_id=object_id_str)
                    except ContentType.DoesNotExist:
                        return queryset.none()
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrFuncionario])
    def approve(self, request, pk=None):
        resena = self.get_object()
        resena.aprobada = True
        resena.save(update_fields=['aprobada'])
        return Response({'status': 'Reseña aprobada con éxito.'}, status=status.HTTP_200_OK)

class FelicitacionesPublicasView(generics.ListAPIView):
    queryset = Sugerencia.objects.filter(
        tipo_mensaje=Sugerencia.TipoMensaje.FELICITACION,
        es_publico=True
    ).order_by('-fecha_envio')
    serializer_class = FelicitacionPublicaSerializer
    permission_classes = [AllowAny]
    pagination_class = None

class SugerenciaViewSet(viewsets.mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Sugerencia.objects.all()
    serializer_class = SugerenciaSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(usuario=self.request.user)
        else:
            serializer.save()

class SugerenciaAdminViewSet(viewsets.ModelViewSet):
    queryset = Sugerencia.objects.all().order_by('-fecha_envio')
    serializer_class = SugerenciaAdminSerializer
    permission_classes = [IsAdminOrFuncionario]
    filter_backends = [OrderingFilter, SearchFilter]
    search_fields = ['mensaje', 'nombre_remitente', 'email_remitente', 'usuario__username']
    ordering_fields = ['fecha_envio', 'estado', 'tipo_mensaje']

# Minimal ViewSets to fix startup errors
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

class AtractivoTuristicoViewSet(viewsets.ModelViewSet):
    queryset = AtractivoTuristico.objects.all()
    serializer_class = AtractivoTuristicoListSerializer
    permission_classes = [AllowAny]

class RutaTuristicaViewSet(viewsets.ModelViewSet):
    queryset = RutaTuristica.objects.all()
    serializer_class = RutaTuristicaListSerializer
    permission_classes = [AllowAny]

class HechoHistoricoViewSet(viewsets.ModelViewSet):
    queryset = HechoHistorico.objects.all()
    serializer_class = HechoHistoricoSerializer
    permission_classes = [AllowAny]

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

class ContenidoMunicipioViewSet(viewsets.ModelViewSet):
    queryset = ContenidoMunicipio.objects.all()
    serializer_class = ContenidoMunicipioSerializer
    permission_classes = [AllowAny]

class PaginaInstitucionalViewSet(viewsets.ModelViewSet):
    queryset = PaginaInstitucional.objects.all()
    serializer_class = PaginaInstitucionalSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

class AdminPublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all()
    serializer_class = AdminPublicacionSerializer
    permission_classes = [IsAdminOrFuncionario]

class HomePageComponentViewSet(viewsets.ModelViewSet):
    queryset = HomePageComponent.objects.all()
    serializer_class = HomePageComponentSerializer
    permission_classes = [AllowAny]

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

class ScoringRuleViewSet(viewsets.ModelViewSet):
    queryset = ScoringRule.objects.all()
    serializer_class = ScoringRuleSerializer
    permission_classes = [IsAdmin]

class AdminPrestadorViewSet(viewsets.ModelViewSet):
    queryset = PrestadorServicio.objects.all()
    serializer_class = AdminPrestadorDetailSerializer
    permission_classes = [IsAdminOrFuncionario]

class AdminArtesanoViewSet(viewsets.ModelViewSet):
    queryset = Artesano.objects.all()
    serializer_class = AdminArtesanoDetailSerializer
    permission_classes = [IsAdminOrFuncionario]

class PlantillaVerificacionViewSet(viewsets.ModelViewSet):
    queryset = PlantillaVerificacion.objects.all()
    serializer_class = PlantillaVerificacionListSerializer
    permission_classes = [IsAdminOrFuncionario]

class VerificacionViewSet(viewsets.ModelViewSet):
    queryset = Verificacion.objects.all()
    serializer_class = VerificacionListSerializer
    permission_classes = [IsAuthenticated]

class PreguntaViewSet(viewsets.ModelViewSet):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [IsAdminOrDirectivo]

class OpcionRespuestaViewSet(viewsets.ModelViewSet):
    queryset = OpcionRespuesta.objects.all()
    serializer_class = OpcionRespuestaSerializer
    permission_classes = [IsAdminOrDirectivo]

class SiteConfigurationView(generics.RetrieveUpdateAPIView):
    queryset = SiteConfiguration.objects.all()
    serializer_class = SiteConfigurationSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        return SiteConfiguration.load()

class PrestadorProfileView(generics.RetrieveUpdateAPIView):
    queryset = PrestadorServicio.objects.all()
    serializer_class = PrestadorServicioSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.perfil_prestador

class ArtesanoProfileView(generics.RetrieveUpdateAPIView):
    queryset = Artesano.objects.all()
    serializer_class = ArtesanoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.artesano

class FeedbackProveedorView(generics.ListAPIView):
    queryset = Sugerencia.objects.none()
    serializer_class = FeedbackProveedorSerializer
    permission_classes = [IsAuthenticated]

class UserLLMConfigView(generics.RetrieveUpdateAPIView):
    """
    Vista para que un usuario vea y actualice su propia configuración de LLM.
    """
    serializer_class = UserLLMConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # get_or_create asegura que cada usuario tenga una configuración de LLM,
        # creándola con los valores por defecto si no existe.
        llm_config, created = UserLLMConfig.objects.get_or_create(user=self.request.user)
        return llm_config

class ImagenGaleriaView(generics.ListCreateAPIView):
    queryset = ImagenGaleria.objects.all()
    serializer_class = ImagenGaleriaSerializer
    permission_classes = [IsAuthenticated]

class ImagenArtesanoView(generics.ListCreateAPIView):
    queryset = ImagenArtesano.objects.all()
    serializer_class = ImagenArtesanoSerializer
    permission_classes = [IsAuthenticated]

class DocumentoLegalizacionView(generics.ListCreateAPIView):
    queryset = DocumentoLegalizacion.objects.all()
    serializer_class = DocumentoLegalizacionSerializer
    permission_classes = [IsAuthenticated]

class RespuestaUsuarioViewSet(viewsets.ModelViewSet):
    queryset = RespuestaUsuario.objects.all()
    serializer_class = RespuestaUsuarioSerializer
    permission_classes = [IsAuthenticated]

class PublicacionListView(generics.ListAPIView):
    queryset = Publicacion.objects.all()
    serializer_class = PublicacionListSerializer
    permission_classes = [AllowAny]

class PublicacionDetailView(generics.RetrieveAPIView):
    queryset = Publicacion.objects.all()
    serializer_class = PublicacionDetailSerializer
    permission_classes = [AllowAny]

class ConsejoConsultivoListView(generics.ListAPIView):
    queryset = ConsejoConsultivo.objects.all()
    serializer_class = ConsejoConsultivoSerializer
    permission_classes = [AllowAny]

class VideoListView(generics.ListAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [AllowAny]

class LocationListView(generics.ListAPIView):
    queryset = PrestadorServicio.objects.all() # Placeholder
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]

class GaleriaListView(generics.ListAPIView):
    queryset = ImagenGaleria.objects.all() # Placeholder
    serializer_class = GaleriaItemSerializer
    permission_classes = [AllowAny]

class AgentCommandView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        return Response({"message": "Comando recibido."})

class AgentTaskStatusView(generics.RetrieveAPIView):
    queryset = AgentTask.objects.all()
    serializer_class = AgentTaskSerializer
    permission_classes = [IsAuthenticated]

class AnalyticsDataView(views.APIView):
    permission_classes = [IsAdminOrFuncionario]
    def get(self, request, *args, **kwargs):
        return Response({"message": "Datos de analítica."})

class AdminUsuarioListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UsuarioListSerializer
    permission_classes = [IsAdminOrFuncionario]

class CategoriaPrestadorListView(generics.ListAPIView):
    queryset = CategoriaPrestador.objects.all()
    serializer_class = CategoriaPrestadorSerializer
    permission_classes = [AllowAny]

class PrestadorServicioPublicListView(generics.ListAPIView):
    queryset = PrestadorServicio.objects.all()
    serializer_class = PrestadorServicioPublicListSerializer
    permission_classes = [AllowAny]

class PrestadorServicioPublicDetailView(generics.RetrieveAPIView):
    queryset = PrestadorServicio.objects.all()
    serializer_class = PrestadorServicioPublicDetailSerializer
    permission_classes = [AllowAny]

class RubroArtesanoListView(generics.ListAPIView):
    queryset = RubroArtesano.objects.all()
    serializer_class = RubroArtesanoSerializer
    permission_classes = [AllowAny]

class ArtesanoPublicListView(generics.ListAPIView):
    queryset = Artesano.objects.all()
    serializer_class = ArtesanoPublicListSerializer
    permission_classes = [AllowAny]

class ArtesanoPublicDetailView(generics.RetrieveAPIView):
    queryset = Artesano.objects.all()
    serializer_class = ArtesanoPublicDetailSerializer
    permission_classes = [AllowAny]

class DetailedStatisticsView(views.APIView):
    permission_classes = [IsAdmin]
    def get(self, request, *args, **kwargs):
        return Response({"message": "Datos de estadísticas detalladas."})

class ExportExcelView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(
            {"error": "Esta funcionalidad aún no está implementada."},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

class ImagenArtesanoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ImagenArtesanoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'artesano'):
            return ImagenArtesano.objects.filter(artesano=user.artesano)
        return ImagenArtesano.objects.none()

class ImagenGaleriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ImagenGaleriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'perfil_prestador'):
            return ImagenGaleria.objects.filter(prestador=user.perfil_prestador)
        return ImagenGaleria.objects.none()