from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    CategoriaPrestador,
    PrestadorServicio,
    ImagenGaleria,
    DocumentoLegalizacion,
    Publicacion,
    Video,
    ConsejoConsultivo,
    AtractivoTuristico,
    ImagenAtractivo,
)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Personalización del panel de administración para el modelo CustomUser.
    """
    model = CustomUser
    # Añadimos el campo 'role' a los fieldsets para que se pueda editar
    fieldsets = UserAdmin.fieldsets + (
        ("Roles y Permisos", {"fields": ("role",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Roles y Permisos", {"fields": ("role",)}),
    )
    # Mostramos el rol en la lista de usuarios
    list_display = ["username", "email", "first_name", "last_name", "role", "is_staff"]
    list_filter = ["role", "is_staff", "is_superuser", "is_active", "groups"]


class ImagenGaleriaInline(admin.TabularInline):
    """Permite editar imágenes de la galería directamente en el perfil del prestador."""
    model = ImagenGaleria
    extra = 1  # Cuántos campos para subir imágenes mostrar por defecto


class DocumentoLegalizacionInline(admin.TabularInline):
    """Permite editar documentos directamente en el perfil del prestador."""
    model = DocumentoLegalizacion
    extra = 1


@admin.register(PrestadorServicio)
class PrestadorServicioAdmin(admin.ModelAdmin):
    """
    Personalización del panel para PrestadorServicio.
    """
    list_display = ('nombre_negocio', 'usuario', 'categoria', 'aprobado', 'fecha_creacion')
    list_filter = ('aprobado', 'categoria')
    search_fields = ('nombre_negocio', 'usuario__username', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    inlines = [ImagenGaleriaInline, DocumentoLegalizacionInline]
    actions = ['aprobar_prestadores']

    def aprobar_prestadores(self, request, queryset):
        """Acción para aprobar los prestadores seleccionados."""
        queryset.update(aprobado=True)
    aprobar_prestadores.short_description = "Aprobar perfiles de prestadores seleccionados"


@admin.register(CategoriaPrestador)
class CategoriaPrestadorAdmin(admin.ModelAdmin):
    """
    Personalización del panel para CategoriaPrestador.
    """
    list_display = ('nombre', 'slug')
    prepopulated_fields = {'slug': ('nombre',)}


@admin.register(Publicacion)
class PublicacionAdmin(admin.ModelAdmin):
    """
    Personalización del panel para Publicaciones (Eventos, Noticias, Blog, etc.).
    """
    list_display = ('titulo', 'tipo', 'subcategoria_evento', 'es_publicado', 'autor', 'fecha_publicacion')
    list_filter = ('tipo', 'subcategoria_evento', 'es_publicado')
    search_fields = ('titulo', 'contenido')
    prepopulated_fields = {'slug': ('titulo',)}
    date_hierarchy = 'fecha_publicacion'

    fieldsets = (
        ('Información General', {
            'fields': ('titulo', 'slug', 'tipo', 'es_publicado', 'autor')
        }),
        ('Contenido', {
            'fields': ('contenido', 'imagen_principal')
        }),
        ('Fechas (Solo para Eventos/Capacitaciones)', {
            'classes': ('collapse',),
            'fields': ('fecha_evento_inicio', 'fecha_evento_fin', 'subcategoria_evento')
        }),
    )


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    Personalización del panel para Videos.
    """
    list_display = ('titulo', 'url_youtube', 'fecha_publicacion')
    search_fields = ('titulo', 'descripcion')

# Los modelos ImagenGaleria y DocumentoLegalizacion se gestionan a través de los inlines,
# pero también se pueden registrar para tener una gestión individual si es necesario.
admin.site.register(ImagenGaleria)
admin.site.register(DocumentoLegalizacion)

@admin.register(ConsejoConsultivo)
class ConsejoConsultivoAdmin(admin.ModelAdmin):
    """
    Personalización del panel para el Consejo Consultivo.
    """
    list_display = ('titulo', 'fecha_publicacion')
    search_fields = ('titulo', 'contenido')
    date_hierarchy = 'fecha_publicacion'


class ImagenAtractivoInline(admin.TabularInline):
    """Permite editar imágenes de la galería directamente en la página del atractivo."""
    model = ImagenAtractivo
    extra = 1 # Muestra un campo para subir una nueva imagen por defecto.


@admin.register(AtractivoTuristico)
class AtractivoTuristicoAdmin(admin.ModelAdmin):
    """
    Personalización del panel para AtractivoTuristico.
    """
    list_display = ('nombre', 'categoria_color', 'es_publicado', 'fecha_actualizacion')
    list_filter = ('categoria_color', 'es_publicado')
    search_fields = ('nombre', 'descripcion', 'como_llegar')
    prepopulated_fields = {'slug': ('nombre',)}
    inlines = [ImagenAtractivoInline]
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion', 'autor')
    actions = ['publicar_atractivos']

    fieldsets = (
        ('Información Principal', {
            'fields': ('nombre', 'slug', 'categoria_color', 'es_publicado')
        }),
        ('Contenido Detallado', {
            'fields': ('descripcion', 'como_llegar', 'ubicacion_mapa')
        }),
        ('Metadatos', {
            'fields': ('autor', 'fecha_creacion', 'fecha_actualizacion')
        }),
    )

    def publicar_atractivos(self, request, queryset):
        """Acción para marcar los atractivos seleccionados como publicados."""
        queryset.update(es_publicado=True)
    publicar_atractivos.short_description = "Publicar atractivos seleccionados"

    def save_model(self, request, obj, form, change):
        """
        Al guardar el objeto, si es nuevo, se le asigna el usuario
        actual como autor.
        """
        if not obj.pk:
            obj.autor = request.user
        super().save_model(request, obj, form, change)