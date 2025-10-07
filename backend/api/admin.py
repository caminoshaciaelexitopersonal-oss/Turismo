from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, CategoriaPrestador, PrestadorServicio, ImagenGaleria, DocumentoLegalizacion,
    Publicacion, Video, ConsejoConsultivo, AtractivoTuristico, ImagenAtractivo, ScoringRule,
    Artesano, RubroArtesano, ImagenArtesano, Formulario, Pregunta, OpcionRespuesta,
    RespuestaUsuario, PlantillaVerificacion, ItemVerificacion, Verificacion,
    RespuestaItemVerificacion, AsistenciaCapacitacion, SiteConfiguration, MenuItem,
    HomePageComponent, PaginaInstitucional, ImagenPaginaInstitucional, ContenidoMunicipio, HechoHistorico,
    Resena, Sugerencia, AuditLog, RutaTuristica, ImagenRutaTuristica, Notificacion,
    UserLLMConfig
)
from django.utils.html import format_html

# -- CONFIGURACIÓN GENERAL DEL SITIO --

@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'correo_institucional', 'telefono_conmutador')
    fieldsets = (
        ('Información de Contacto', {
            'fields': ('direccion', 'horario_atencion', 'telefono_conmutador', 'telefono_movil', 'linea_gratuita', 'linea_anticorrupcion', 'correo_institucional', 'correo_notificaciones')
        }),
        ('Redes Sociales', {
            'fields': ('social_facebook', 'social_twitter', 'social_youtube', 'social_instagram')
        }),
        ('Activación de Secciones', {
            'fields': ('seccion_publicaciones_activa', 'seccion_atractivos_activa', 'seccion_prestadores_activa')
        }),
        ('Claves de API', {
            'fields': ('google_maps_api_key',)
        }),
        ('Configuración del Agente IA (Router LLM)', {
            'classes': ('collapse',),
            'fields': ('llm_routing_token_threshold',)
        }),
    )

class ImagenRutaTuristicaInline(admin.TabularInline):
    model = ImagenRutaTuristica
    extra = 1
    verbose_name = "Imagen para la galería"
    verbose_name_plural = "Galería de Imágenes"

@admin.register(RutaTuristica)
class RutaTuristicaAdmin(admin.ModelAdmin):
    inlines = [ImagenRutaTuristicaInline]
    list_display = ('nombre', 'es_publicado', 'fecha_actualizacion')
    list_filter = ('es_publicado',)
    search_fields = ('nombre', 'descripcion')
    prepopulated_fields = {'slug': ('nombre',)}
    filter_horizontal = ('atractivos', 'prestadores')
    fieldsets = (
        (None, {
            'fields': ('nombre', 'slug', 'es_publicado')
        }),
        ('Contenido de la Ruta', {
            'fields': ('descripcion', 'imagen_principal')
        }),
        ('Asociaciones', {
            'fields': ('atractivos', 'prestadores')
        }),
    )

    def has_add_permission(self, request):
        return not SiteConfiguration.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'url', 'parent', 'orden')
    list_filter = ('parent',)
    search_fields = ('nombre', 'url')
    ordering = ('orden',)

@admin.register(HomePageComponent)
class HomePageComponentAdmin(admin.ModelAdmin):
    list_display = ('title', 'component_type', 'order', 'is_active')
    list_filter = ('component_type', 'is_active')
    search_fields = ('title', 'subtitle')
    ordering = ('order',)

# -- GESTIÓN DE USUARIOS Y ROLES --

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = UserAdmin.fieldsets + (
        ("Roles y Permisos", {"fields": ("role", "openai_api_key", "google_api_key")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Roles y Permisos", {"fields": ("role",)}),
    )
    list_display = ["username", "email", "first_name", "last_name", "role", "is_staff"]
    list_filter = ["role", "is_staff", "is_superuser", "is_active", "groups"]

@admin.register(UserLLMConfig)
class UserLLMConfigAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'updated_at')
    list_filter = ('provider',)
    search_fields = ('user__username',)
    readonly_fields = ('api_key_masked', 'created_at', 'updated_at')
    fields = ('user', 'provider', 'api_key',)

    def api_key_masked(self, obj):
        if obj.api_key:
            return f"{obj.api_key[:5]}...{obj.api_key[-4:]}"
        return "No configurada"
    api_key_masked.short_description = "Clave API (Enmascarada)"

    def get_fields(self, request, obj=None):
        # Muestra el campo enmascarado solo al editar, no al crear
        if obj:
            return ('user', 'provider', 'api_key', 'api_key_masked')
        return ('user', 'provider', 'api_key')

    def get_readonly_fields(self, request, obj=None):
        # Hace que el campo de usuario sea de solo lectura al editar
        if obj:
            return self.readonly_fields + ('user', 'api_key_masked')
        return self.readonly_fields

# -- DIRECTORIOS: PRESTADORES Y ARTESANOS --

class ImagenGaleriaInline(admin.TabularInline):
    model = ImagenGaleria
    extra = 1
    readonly_fields = ('image_preview',)
    def image_preview(self, obj):
        return format_html('<img src="{}" width="150" />', obj.imagen.url)

class DocumentoLegalizacionInline(admin.TabularInline):
    model = DocumentoLegalizacion
    extra = 1

@admin.register(PrestadorServicio)
class PrestadorServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre_negocio', 'usuario', 'categoria', 'aprobado', 'puntuacion_total', 'fecha_creacion')
    list_filter = ('aprobado', 'categoria')
    search_fields = ('nombre_negocio', 'usuario__username', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion', 'puntuacion_total')
    inlines = [ImagenGaleriaInline, DocumentoLegalizacionInline]
    actions = ['aprobar_prestadores']

    def aprobar_prestadores(self, request, queryset):
        queryset.update(aprobado=True)
    aprobar_prestadores.short_description = "Aprobar perfiles de prestadores seleccionados"

@admin.register(CategoriaPrestador)
class CategoriaPrestadorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug')
    prepopulated_fields = {'slug': ('nombre',)}

class ImagenArtesanoInline(admin.TabularInline):
    model = ImagenArtesano
    extra = 1

@admin.register(Artesano)
class ArtesanoAdmin(admin.ModelAdmin):
    list_display = ('nombre_taller', 'nombre_artesano', 'rubro', 'aprobado', 'puntuacion_total')
    list_filter = ('aprobado', 'rubro')
    search_fields = ('nombre_taller', 'nombre_artesano', 'usuario__username')
    readonly_fields = ('puntuacion_total',)
    inlines = [ImagenArtesanoInline]
    actions = ['aprobar_artesanos']

    def aprobar_artesanos(self, request, queryset):
        queryset.update(aprobado=True)
    aprobar_artesanos.short_description = "Aprobar perfiles de artesanos seleccionados"

@admin.register(RubroArtesano)
class RubroArtesanoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug')
    prepopulated_fields = {'slug': ('nombre',)}

# -- GESTIÓN DE CONTENIDO --

@admin.register(Publicacion)
class PublicacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo', 'estado', 'autor', 'fecha_publicacion')
    list_filter = ('tipo', 'estado', 'autor')
    search_fields = ('titulo', 'contenido')
    prepopulated_fields = {'slug': ('titulo',)}
    date_hierarchy = 'fecha_publicacion'
    readonly_fields = ('fecha_publicacion',)
    actions = ['marcar_como_publicado']

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.autor = request.user
        super().save_model(request, obj, form, change)

    def marcar_como_publicado(self, request, queryset):
        queryset.update(estado=Publicacion.Status.PUBLICADO)
    marcar_como_publicado.short_description = "Marcar seleccionados como Publicados"

class ImagenAtractivoInline(admin.TabularInline):
    model = ImagenAtractivo
    extra = 1

@admin.register(AtractivoTuristico)
class AtractivoTuristicoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria_color', 'es_publicado', 'fecha_actualizacion')
    list_filter = ('categoria_color', 'es_publicado')
    search_fields = ('nombre', 'descripcion')
    prepopulated_fields = {'slug': ('nombre',)}
    inlines = [ImagenAtractivoInline]
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion', 'autor')
    actions = ['publicar_atractivos']

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.autor = request.user
        super().save_model(request, obj, form, change)

    def publicar_atractivos(self, request, queryset):
        queryset.update(es_publicado=True)
    publicar_atractivos.short_description = "Publicar atractivos seleccionados"

class ImagenPaginaInstitucionalInline(admin.TabularInline):
    model = ImagenPaginaInstitucional
    extra = 1
    verbose_name = "Imagen para la galería"
    verbose_name_plural = "Galería de Imágenes para el Slider"
    ordering = ('orden',)


@admin.register(PaginaInstitucional)
class PaginaInstitucionalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug', 'fecha_actualizacion')
    search_fields = ('nombre', 'titulo_banner', 'contenido_principal')
    inlines = [ImagenPaginaInstitucionalInline]

@admin.register(ContenidoMunicipio)
class ContenidoMunicipioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'seccion', 'orden', 'es_publicado', 'fecha_actualizacion')
    list_filter = ('seccion', 'es_publicado')
    search_fields = ('titulo', 'contenido')
    ordering = ('orden',)

@admin.register(HechoHistorico)
class HechoHistoricoAdmin(admin.ModelAdmin):
    list_display = ('ano', 'titulo', 'es_publicado')
    list_filter = ('es_publicado',)
    search_fields = ('titulo', 'descripcion')
    ordering = ('ano',)

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'url_youtube', 'es_publicado', 'fecha_publicacion')
    search_fields = ('titulo', 'descripcion')
    list_filter = ('es_publicado',)

@admin.register(ConsejoConsultivo)
class ConsejoConsultivoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fecha_publicacion', 'es_publicado')
    search_fields = ('titulo', 'contenido')
    list_filter = ('es_publicado',)

# -- MÓDULO DE FORMULARIOS DINÁMICOS --

class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 1

class OpcionRespuestaInline(admin.TabularInline):
    model = OpcionRespuesta
    extra = 1

@admin.register(Formulario)
class FormularioAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        base_fields = ('nombre', 'titulo', 'es_publico')
        if hasattr(Formulario, 'content_object'):
            return base_fields[:2] + ('content_object',) + base_fields[2:]
        elif hasattr(Formulario, 'categoria'):
            return base_fields[:2] + ('categoria',) + base_fields[2:]
        return base_fields

    def get_list_filter(self, request):
        base_filters = ('es_publico',)
        if hasattr(Formulario, 'content_type'):
            return ('content_type',) + base_filters
        elif hasattr(Formulario, 'categoria'):
            return ('categoria',) + base_filters
        return base_filters

    search_fields = ('nombre', 'titulo')
    inlines = [PreguntaInline]

@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('texto_pregunta', 'formulario', 'tipo_pregunta', 'es_requerida', 'orden')
    list_filter = ('formulario', 'tipo_pregunta')
    search_fields = ('texto_pregunta',)
    inlines = [OpcionRespuestaInline]

@admin.register(RespuestaUsuario)
class RespuestaUsuarioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'pregunta', 'fecha_respuesta')
    list_filter = ('pregunta__formulario', 'usuario')
    search_fields = ('usuario__username', 'pregunta__texto_pregunta', 'respuesta')
    date_hierarchy = 'fecha_respuesta'
    readonly_fields = ('usuario', 'pregunta', 'respuesta', 'fecha_respuesta')

# -- MÓDULO DE VERIFICACIÓN Y PUNTUACIÓN --

@admin.register(ScoringRule)
class ScoringRuleAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'puntos_asistencia_capacitacion', 'puntos_por_estrella_reseña', 'puntos_completar_formulario')
    def has_add_permission(self, request):
        return not ScoringRule.objects.exists()
    def has_delete_permission(self, request, obj=None):
        return False

class ItemVerificacionInline(admin.TabularInline):
    model = ItemVerificacion
    extra = 1

@admin.register(PlantillaVerificacion)
class PlantillaVerificacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria_prestador', 'creado_por')
    list_filter = ('categoria_prestador',)
    inlines = [ItemVerificacionInline]

class RespuestaItemVerificacionInline(admin.TabularInline):
    model = RespuestaItemVerificacion
    extra = 0
    readonly_fields = ('item_original', 'cumple', 'justificacion')

@admin.register(Verificacion)
class VerificacionAdmin(admin.ModelAdmin):
    list_display = ('prestador', 'plantilla_usada', 'funcionario_evaluador', 'fecha_visita', 'puntaje_obtenido')
    list_filter = ('plantilla_usada', 'funcionario_evaluador', 'fecha_visita')
    search_fields = ('prestador__nombre_negocio', 'funcionario_evaluador__username')
    inlines = [RespuestaItemVerificacionInline]
    readonly_fields = ('puntaje_obtenido',)

# -- FEEDBACK Y AUDITORÍA --

@admin.register(Resena)
class ResenaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'content_object', 'calificacion', 'aprobada', 'fecha_creacion')
    list_filter = ('aprobada', 'calificacion', 'content_type')
    search_fields = ('usuario__username', 'comentario')
    actions = ['aprobar_resenas']

    def aprobar_resenas(self, request, queryset):
        queryset.update(aprobada=True)
    aprobar_resenas.short_description = "Aprobar reseñas seleccionadas"

@admin.register(Sugerencia)
class SugerenciaAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'tipo_mensaje', 'estado', 'fecha_envio')
    list_filter = ('tipo_mensaje', 'estado', 'es_publico')
    search_fields = ('nombre_remitente', 'email_remitente', 'usuario__username', 'mensaje')

@admin.register(AsistenciaCapacitacion)
class AsistenciaCapacitacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'capacitacion', 'fecha_asistencia')
    list_filter = ('capacitacion',)
    search_fields = ('usuario__username', 'capacitacion__titulo')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'get_action_display', 'content_object')
    list_filter = ('action', 'user')
    readonly_fields = ('timestamp', 'user', 'action', 'details', 'content_type', 'object_id', 'content_object')
    date_hierarchy = 'timestamp'

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'mensaje', 'leido', 'fecha_creacion', 'content_object')
    list_filter = ('leido', 'fecha_creacion')
    search_fields = ('usuario__username', 'mensaje')
    readonly_fields = ('usuario', 'mensaje', 'leido', 'fecha_creacion', 'url', 'content_type', 'object_id', 'content_object')
    date_hierarchy = 'fecha_creacion'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

# Modelos que se gestionan principalmente via inlines pero se registran para acceso directo
admin.site.register(ImagenGaleria)
admin.site.register(DocumentoLegalizacion)
admin.site.register(ImagenArtesano)
admin.site.register(ImagenAtractivo)