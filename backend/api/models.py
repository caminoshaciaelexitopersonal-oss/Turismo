import os
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from .fields import EncryptedTextField


def prestador_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/prestadores/<username>/<filename>
    return f'prestadores/{instance.usuario.username}/{filename}'


def galeria_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/prestadores/<username>/galeria/<filename>
    return f'prestadores/{instance.prestador.usuario.username}/galeria/{filename}'


def documentos_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/prestadores/<username>/documentos/<filename>
    return f'prestadores/{instance.prestador.usuario.username}/documentos/{filename}'


def atractivo_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/atractivos/<slug_atractivo>/<filename>
    return f'atractivos/{instance.atractivo.slug}/{filename}'


def homepage_component_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/homepage_components/<uuid>_<filename>
    return f'homepage_components/{uuid.uuid4()}_{filename}'


def artesano_directory_path(instance, filename):
    # El archivo se subirá a MEDIA_ROOT/artesanos/<username>/<filename>
    return f'artesanos/{instance.usuario.username}/{filename}'


def galeria_artesano_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/artesanos/<username>/galeria/<filename>
    return f'artesanos/{instance.artesano.usuario.username}/galeria/{filename}'


class CustomUser(AbstractUser):
    """
    Modelo de Usuario personalizado que extiende el de Django.
    Añade un campo 'rol' para diferenciar los tipos de usuario.
    """
    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Administrador General")
        FUNCIONARIO_DIRECTIVO = "FUNCIONARIO_DIRECTIVO", _("Funcionario Directivo")
        FUNCIONARIO_PROFESIONAL = "FUNCIONARIO_PROFESIONAL", _("Funcionario Profesional")
        PRESTADOR = "PRESTADOR", _("Prestador de Servicio")
        ARTESANO = "ARTESANO", _("Artesano")
        TURISTA = "TURISTA", _("Turista")

    base_role = Role.TURISTA

    role = models.CharField(_("Rol"), max_length=50, choices=Role.choices)

    # Campos para almacenar claves de LLM de forma segura
    openai_api_key = EncryptedTextField(blank=True, null=True, verbose_name="OpenAI API Key")
    google_api_key = EncryptedTextField(blank=True, null=True, verbose_name="Google API Key")

    def save(self, *args, **kwargs):
        if not self.pk:
            if self.is_superuser:
                self.role = self.Role.ADMIN
            elif not self.role:
                self.role = self.base_role
        super().save(*args, **kwargs)


class CategoriaPrestador(models.Model):
    """
    Categorías para los prestadores de servicios (Hotel, Restaurante, Artesano, etc.)
    """
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="Versión del nombre amigable para URLs")

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Categoría de Prestador"
        verbose_name_plural = "Categorías de Prestadores"


class PrestadorServicio(models.Model):
    """
    Modelo central para cada prestador de servicio turístico.
    """
    usuario = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="perfil_prestador")
    categoria = models.ForeignKey(CategoriaPrestador, on_delete=models.SET_NULL, null=True, related_name="prestadores")
    nombre_negocio = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email_contacto = models.EmailField(max_length=254, blank=True, null=True)
    red_social_facebook = models.URLField(blank=True, null=True)
    red_social_instagram = models.URLField(blank=True, null=True)
    red_social_tiktok = models.URLField(blank=True, null=True)
    red_social_whatsapp = models.CharField(max_length=20, blank=True, null=True, help_text="Número de WhatsApp con código de país")
    ubicacion_mapa = models.CharField(max_length=255, blank=True, null=True, help_text="Coordenadas (lat,lng) o dirección")
    promociones_ofertas = models.TextField(blank=True, null=True, help_text="Detalles de promociones, menús, paquetes, etc.")

    # Campo de moderación
    aprobado = models.BooleanField(default=False, help_text="El administrador debe aprobar este perfil para que sea visible.")

    # Reporte de ocupación para hoteles
    reporte_ocupacion_nacional = models.PositiveIntegerField(default=0, help_text="Exclusivo para hoteles")
    reporte_ocupacion_internacional = models.PositiveIntegerField(default=0, help_text="Exclusivo para hoteles")

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre_negocio

    class Meta:
        verbose_name = "Prestador de Servicio"
        verbose_name_plural = "Prestadores de Servicios"


class RubroArtesano(models.Model):
    """
    Rubros para los artesanos (Tejidos, Cerámica, Madera, etc.)
    """
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="Versión del nombre amigable para URLs")

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Rubro de Artesano"
        verbose_name_plural = "Rubros de Artesanos"


class Artesano(models.Model):
    """
    Modelo para cada artesano del municipio.
    """
    usuario = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="perfil_artesano"
    )
    rubro = models.ForeignKey(
        RubroArtesano,
        on_delete=models.SET_NULL,
        null=True,
        related_name="artesanos"
    )
    nombre_taller = models.CharField(
        max_length=200,
        help_text="Nombre del taller o marca personal del artesano."
    )
    nombre_artesano = models.CharField(
        max_length=200,
        help_text="Nombre completo del artesano."
    )
    descripcion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email_contacto = models.EmailField(max_length=254, blank=True, null=True)
    foto_principal = models.ImageField(
        upload_to=artesano_directory_path,
        blank=True,
        null=True,
        help_text="Una foto representativa del artesano o sus productos."
    )
    red_social_facebook = models.URLField(blank=True, null=True)
    red_social_instagram = models.URLField(blank=True, null=True)
    red_social_tiktok = models.URLField(blank=True, null=True)
    red_social_whatsapp = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Número de WhatsApp con código de país"
    )
    ubicacion_taller = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Dirección o punto de referencia del taller o punto de venta."
    )

    # Campo de moderación
    aprobado = models.BooleanField(
        default=False,
        help_text="El administrador debe aprobar este perfil para que sea visible."
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre_taller

    class Meta:
        verbose_name = "Artesano"
        verbose_name_plural = "Artesanos"


class ImagenArtesano(models.Model):
    artesano = models.ForeignKey(
        Artesano,
        on_delete=models.CASCADE,
        related_name="galeria_imagenes"
    )
    imagen = models.ImageField(upload_to=galeria_artesano_directory_path)
    alt_text = models.CharField(
        max_length=255,
        blank=True,
        help_text="Texto alternativo para accesibilidad"
    )

    def __str__(self):
        return f"Imagen de {self.artesano.nombre_taller}"


class ImagenGaleria(models.Model):
    prestador = models.ForeignKey(PrestadorServicio, on_delete=models.CASCADE, related_name="galeria_imagenes")
    imagen = models.ImageField(upload_to=galeria_directory_path)
    alt_text = models.CharField(max_length=255, blank=True, help_text="Texto alternativo para accesibilidad")

    def __str__(self):
        return f"Imagen de {self.prestador.nombre_negocio}"


class DocumentoLegalizacion(models.Model):
    prestador = models.ForeignKey(PrestadorServicio, on_delete=models.CASCADE, related_name="documentos_legalizacion")
    documento = models.FileField(upload_to=documentos_directory_path)
    nombre_documento = models.CharField(max_length=100)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre_documento} de {self.prestador.nombre_negocio}"


class Publicacion(models.Model):
    """
    Modelo para Eventos, Noticias, Blog y Capacitaciones.
    """
    class Tipo(models.TextChoices):
        EVENTO = "EVENTO", _("Evento")
        NOTICIA = "NOTICIA", _("Noticia")
        BLOG = "BLOG", _("Blog")
        CAPACITACION = "CAPACITACION", _("Capacitación")

    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    titulo = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    contenido = models.TextField()
    imagen_principal = models.ImageField(upload_to='publicaciones/', blank=True, null=True)
    autor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name="publicaciones")

    # Campos específicos para eventos
    class SubCategoria(models.TextChoices):
        CULTURAL = "CULTURAL", _("Cultural")
        DEPORTIVO = "DEPORTIVO", _("Deportivo")
        RELIGIOSO = "RELIGIOSO", _("Religioso")
        CIVICO = "CIVICO", _("Cívico")
        OTRO = "OTRO", _("Otro")

    subcategoria_evento = models.CharField(
        _("Subcategoría de Evento"),
        max_length=50,
        choices=SubCategoria.choices,
        blank=True,
        null=True,
        help_text="Clasificación específica solo para eventos."
    )
    fecha_evento_inicio = models.DateTimeField(blank=True, null=True)
    fecha_evento_fin = models.DateTimeField(blank=True, null=True)

    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    es_publicado = models.BooleanField(default=False, help_text="Marcar para que el contenido sea visible en el sitio web público.")

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.titulo}"

    class Meta:
        verbose_name = "Publicación"
        verbose_name_plural = "Publicaciones"
        ordering = ['-fecha_publicacion']


class Video(models.Model):
    """
    Modelo para la sección de videos.
    """
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    url_youtube = models.URLField()
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    es_publicado = models.BooleanField(default=False, help_text="Marcar para que el video sea visible en el sitio web público.")

    def __str__(self):
        return self.titulo


class ConsejoConsultivo(models.Model):
    """
    Modelo para la información del Consejo Consultivo de Turismo.
    Permite al administrador publicar actas, noticias o información relevante.
    """
    titulo = models.CharField(max_length=255)
    contenido = models.TextField()
    fecha_publicacion = models.DateField()
    documento_adjunto = models.FileField(
        upload_to='consejo_consultivo/',
        blank=True,
        null=True,
        help_text="Documento opcional (PDF, Word, etc.)"
    )
    es_publicado = models.BooleanField(default=False, help_text="Marcar para que el contenido sea visible en el sitio web público.")

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name = "Publicación del Consejo Consultivo"
        verbose_name_plural = "Publicaciones del Consejo Consultivo"
        ordering = ['-fecha_publicacion']


class AtractivoTuristico(models.Model):
    """
    Modelo para los atractivos turísticos de Puerto Gaitán.
    """
    class CategoriaColor(models.TextChoices):
        AMARILLO = "AMARILLO", _("Cultural/Histórico")
        ROJO = "ROJO", _("Urbano/Parque")
        BLANCO = "BLANCO", _("Natural")

    nombre = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, help_text="Versión del nombre amigable para URLs")
    descripcion = models.TextField()
    como_llegar = models.TextField(help_text="Instrucciones sobre cómo llegar al atractivo.")
    ubicacion_mapa = models.CharField(max_length=255, blank=True, null=True, help_text="Coordenadas (lat,lng) para Google Maps")
    categoria_color = models.CharField(
        _("Categoría de Color"),
        max_length=10,
        choices=CategoriaColor.choices
    )
    autor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role__in': [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]},
        help_text="Funcionario o Administrador que creó el registro."
    )
    es_publicado = models.BooleanField(
        _("Publicado"),
        default=False,
        help_text="Marcar para que el atractivo sea visible en el sitio web público."
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Atractivo Turístico"
        verbose_name_plural = "Atractivos Turísticos"
        ordering = ['nombre']


class ImagenAtractivo(models.Model):
    """
    Modelo para las imágenes de la galería de un atractivo turístico.
    """
    atractivo = models.ForeignKey(AtractivoTuristico, on_delete=models.CASCADE, related_name="imagenes")
    imagen = models.ImageField(upload_to=atractivo_directory_path)
    alt_text = models.CharField(max_length=255, blank=True, help_text="Texto alternativo para accesibilidad y SEO")

    def __str__(self):
        return f"Imagen de {self.atractivo.nombre}"


class ElementoGuardado(models.Model):
    """
    Modelo para que un Turista pueda guardar sus elementos favoritos (Mi Viaje).
    Utiliza una Clave Externa Genérica para poder apuntar a cualquier otro modelo.
    """
    usuario = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='elementos_guardados',
        limit_choices_to={'role': CustomUser.Role.TURISTA}
    )
    # Campos para la Clave Externa Genérica
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    fecha_guardado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.usuario.username} guardó {self.content_object}'

    class Meta:
        # Un usuario no puede guardar el mismo objeto dos veces.
        unique_together = ('usuario', 'content_type', 'object_id')
        ordering = ['-fecha_guardado']


def pagina_institucional_banner_path(instance, filename):
    # El archivo se subirá a MEDIA_ROOT/paginas_institucionales/<slug>/<filename>
    return f'paginas_institucionales/{instance.slug}/{filename}'


class PaginaInstitucional(models.Model):
    """
    Modelo para gestionar el contenido de páginas institucionales específicas,
    como 'Secretaría de Turismo', 'Dirección de Turismo', etc.
    """
    nombre = models.CharField(_("Nombre de la Página"), max_length=150, unique=True)
    slug = models.SlugField(_("Slug"), max_length=150, unique=True, help_text="Identificador único para la URL. Ej: secretaria-turismo")

    # Contenido principal de la página
    titulo_banner = models.CharField(_("Título del Banner"), max_length=200, help_text="Título principal que se superpone en el banner.")
    subtitulo_banner = models.CharField(_("Subtítulo del Banner"), max_length=300, blank=True, null=True)
    banner = models.ImageField(_("Imagen de Banner"), upload_to=pagina_institucional_banner_path, help_text="Imagen principal que se mostrará en la parte superior de la página.")

    # Secciones de contenido flexible
    contenido_principal = models.TextField(_("Contenido Principal (Objetivos y Funciones)"), blank=True, help_text="Acepta formato Markdown.")
    programas_proyectos = models.TextField(_("Programas y Proyectos"), blank=True, help_text="Para la Secretaría. Acepta formato Markdown.")
    estrategias_apoyo = models.TextField(_("Estrategias de Apoyo"), blank=True, help_text="Para la Secretaría. Acepta formato Markdown.")

    # Nuevos campos para la Dirección de Turismo
    politicas_locales = models.TextField(_("Políticas Locales de Turismo"), blank=True, help_text="Para la Dirección. Acepta formato Markdown.")
    convenios_asociaciones = models.TextField(_("Convenios y Asociaciones"), blank=True, help_text="Para la Dirección. Acepta formato Markdown.")
    informes_resultados = models.TextField(_("Informes de Resultados"), blank=True, help_text="Para la Dirección. Acepta formato Markdown.")

    # Metadatos
    actualizado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role__in': [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]},
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Página Institucional"
        verbose_name_plural = "Páginas Institucionales"
        ordering = ['nombre']


class ContenidoMunicipio(models.Model):
    """
    Modelo para gestionar los bloques de contenido de la página
    "Datos Generales del Municipio".
    """
    class Seccion(models.TextChoices):
        INTRODUCCION = "INTRODUCCION", _("Introducción General")
        UBICACION_CLIMA = "UBICACION_CLIMA", _("Ubicación y Clima")
        ALOJAMIENTO = "ALOJAMIENTO", _("Alojamiento y Hotelería")
        COMO_LLEGAR = "COMO_LLEGAR", _("¿Cómo Llegar?")
        CONTACTOS = "CONTACTOS", _("Contactos de Interés")
        FINANZAS = "FINANZAS", _("Entidades Financieras")
        SECRETARIA_TURISMO = "SECRETARIA_TURISMO", _("Secretaría de Turismo y Desarrollo Económico")
        # Nuevas secciones para el Directorio
        DIRECTORIO_FUNCIONARIOS = "DIRECTORIO_FUNCIONARIOS", _("Directorio - Funcionarios y Dependencias")
        DIRECTORIO_ENLACES = "DIRECTORIO_ENLACES", _("Directorio - Enlaces de Interés")
        OTRA = "OTRA", _("Otra Sección")

    seccion = models.CharField(
        _("Sección Temática"),
        max_length=50,
        choices=Seccion.choices,
        help_text="Agrupa el contenido bajo una categoría temática."
    )
    titulo = models.CharField(
        _("Título del Bloque"),
        max_length=255,
        help_text="El título principal que se mostrará para este bloque de contenido."
    )
    contenido = models.TextField(
        _("Contenido del Bloque"),
        help_text="El contenido principal. Se recomienda usar formato Markdown para el texto."
    )
    orden = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Define el orden de aparición de los bloques en la página (0 primero, 1 después, etc.)."
    )
    actualizado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role__in': [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]},
        help_text="Último usuario que modificó este contenido."
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    es_publicado = models.BooleanField(default=False, help_text="Marcar para que el contenido sea visible en el sitio web público.")

    def __str__(self):
        return f"{self.get_seccion_display()} - {self.titulo}"

    class Meta:
        verbose_name = "Contenido del Municipio"
        verbose_name_plural = "Contenidos del Municipio"
        ordering = ['orden', 'titulo']


class AgentTask(models.Model):
    """
    Modelo para rastrear las tareas asíncronas ejecutadas por el sistema de agentes.
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pendiente")
        RUNNING = "RUNNING", _("En Ejecución")
        COMPLETED = "COMPLETED", _("Completada")
        FAILED = "FAILED", _("Fallida")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='agent_tasks'
    )
    command = models.TextField(
        _("Comando del Usuario"),
        help_text="El comando en lenguaje natural que inició la tarea."
    )
    status = models.CharField(
        _("Estado de la Tarea"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    report = models.TextField(
        _("Informe Final"),
        blank=True,
        null=True,
        help_text="El informe final generado por el agente al completar la tarea."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tarea {self.id} ({self.get_status_display()}) para {self.user.username if self.user else 'Anónimo'}"

    class Meta:
        verbose_name = "Tarea de Agente"
        verbose_name_plural = "Tareas de Agentes"
        ordering = ['-created_at']
 # --- Modelos de Auditoría ---

class AuditLog(models.Model):
    """
    Modelo para registrar eventos importantes del sistema (auditoría).
    Registra quién hizo qué, cuándo y a qué objeto afectó.
    """
    class Action(models.TextChoices):
        USER_CREATE = "USER_CREATE", _("Usuario Creado")
        USER_UPDATE = "USER_UPDATE", _("Usuario Actualizado")
        USER_DELETE = "USER_DELETE", _("Usuario Eliminado")
        MENU_CREATE = "MENU_CREATE", _("Elemento de Menú Creado")
        MENU_UPDATE = "MENU_UPDATE", _("Elemento de Menú Actualizado")
        MENU_DELETE = "MENU_DELETE", _("Elemento de Menú Eliminado")
        SITE_CONFIG_UPDATE = "SITE_CONFIG_UPDATE", _("Configuración del Sitio Actualizada")
        COMPONENT_CREATE = "COMPONENT_CREATE", _("Componente de Inicio Creado")
        COMPONENT_UPDATE = "COMPONENT_UPDATE", _("Componente de Inicio Actualizado")
        COMPONENT_DELETE = "COMPONENT_DELETE", _("Componente de Inicio Eliminado")
        COMPONENT_REORDER = "COMPONENT_REORDER", _("Componentes de Inicio Reordenados")
        CONTENIDO_CREATE = "CONTENIDO_CREATE", _("Contenido de Municipio Creado")
        CONTENIDO_UPDATE = "CONTENIDO_UPDATE", _("Contenido de Municipio Actualizado")
        CONTENIDO_DELETE = "CONTENIDO_DELETE", _("Contenido de Municipio Eliminado")

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_("Usuario")
    )
    action = models.CharField(
        _("Acción"),
        max_length=50,
        choices=Action.choices,
        db_index=True
    )
    details = models.TextField(
        _("Detalles"),
        blank=True,
        null=True,
        help_text="Descripción detallada de la acción o los datos cambiados (ej. en formato JSON)."
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    timestamp = models.DateTimeField(_("Fecha y Hora"), auto_now_add=True, db_index=True)

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user} realizó {self.get_action_display()}"

    class Meta:
        verbose_name = "Registro de Auditoría"
        verbose_name_plural = "Registros de Auditoría"
        ordering = ['-timestamp']


# --- Modelos de Componentes de la Interfaz ---

class HomePageComponent(models.Model):
    """
    Modelo para gestionar componentes dinámicos de la página de inicio,
    como banners, sliders o tarjetas de llamado a la acción.
    """
    class ComponentType(models.TextChoices):
        BANNER = "BANNER", _("Banner Principal")
        SLIDER = "SLIDER", _("Slider Secundario")
        CARD = "CARD", _("Tarjeta de Información")

    component_type = models.CharField(
        _("Tipo de Componente"),
        max_length=20,
        choices=ComponentType.choices,
        default=ComponentType.BANNER
    )
    title = models.CharField(_("Título"), max_length=200)
    subtitle = models.CharField(_("Subtítulo"), max_length=300, blank=True, null=True)
    image = models.ImageField(
        _("Imagen"),
        upload_to=homepage_component_directory_path,
        help_text="Imagen principal para el componente."
    )
    link_url = models.URLField(
        _("URL de Destino"),
        blank=True,
        null=True,
        help_text="El enlace al que dirigirá el componente al hacer clic."
    )
    order = models.PositiveIntegerField(
        _("Orden"),
        default=0,
        db_index=True,
        help_text="Orden de visualización (0 primero, 1 después...)."
    )
    is_active = models.BooleanField(
        _("Activo"),
        default=True,
        db_index=True,
        help_text="Marcar para que el componente sea visible en la página de inicio."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.get_component_type_display()}] {self.title}"

    class Meta:
        verbose_name = "Componente de Página de Inicio"
        verbose_name_plural = "Componentes de Página de Inicio"
        ordering = ['order']


# --- Modelos de Configuración del Sitio ---

class SiteConfiguration(models.Model):
    """
    Modelo Singleton para almacenar la configuración global del sitio,
    como la información del pie de página y las redes sociales.
    Solo debe existir una instancia de este modelo.
    """
    # Información de Contacto del Footer
    direccion = models.CharField(_("Dirección"), max_length=255, blank=True)
    horario_atencion = models.CharField(_("Horario de Atención"), max_length=255, blank=True)
    telefono_conmutador = models.CharField(_("Teléfono Conmutador"), max_length=50, blank=True)
    telefono_movil = models.CharField(_("Teléfono Móvil"), max_length=50, blank=True)
    linea_gratuita = models.CharField(_("Línea de Atención Gratuita"), max_length=50, blank=True)
    linea_anticorrupcion = models.CharField(_("Línea Anticorrupción"), max_length=50, blank=True)
    correo_institucional = models.EmailField(_("Correo Institucional"), blank=True)
    correo_notificaciones = models.EmailField(_("Correo de Notificaciones Judiciales"), blank=True)

    # Redes Sociales
    social_facebook = models.URLField(_("Facebook URL"), blank=True)
    social_twitter = models.URLField(_("Twitter URL"), blank=True)
    social_youtube = models.URLField(_("YouTube URL"), blank=True)
    social_instagram = models.URLField(_("Instagram URL"), blank=True)

    # --- Control de Visibilidad de Secciones ---
    seccion_publicaciones_activa = models.BooleanField(
        _("Sección de Publicaciones (Eventos/Noticias) Activa"),
        default=True,
        help_text="Marcar para mostrar la sección de publicaciones en el sitio web."
    )
    seccion_atractivos_activa = models.BooleanField(
        _("Sección de Atractivos Turísticos Activa"),
        default=True,
        help_text="Marcar para mostrar la sección de atractivos turísticos."
    )
    seccion_prestadores_activa = models.BooleanField(
        _("Sección de Prestadores de Servicios Activa"),
        default=True,
        help_text="Marcar para mostrar el directorio de prestadores de servicios."
    )

    # --- Claves de API Globales ---
    google_maps_api_key = EncryptedTextField(
        _("Google Maps API Key"),
        blank=True,
        null=True,
        help_text="Clave de API de Google Maps para todo el sitio."
    )

    def __str__(self):
        return "Configuración General del Sitio"

    def save(self, *args, **kwargs):
        self.pk = 1  # asegurar singleton
        super(SiteConfiguration, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "Configuración del Sitio"
        verbose_name_plural = "Configuración del Sitio"


# --- Modelos de Menú ---

class MenuItem(models.Model):
    """
    Modelo para gestionar los elementos del menú de navegación principal.
    Soporta jerarquía simple (un nivel de anidación).
    """
    nombre = models.CharField(_("Nombre del Enlace"), max_length=100)
    url = models.CharField(
        _("URL o Ruta"),
        max_length=255,
        help_text="Ruta interna (ej: /quienes-somos) o URL completa (ej: https://...)."
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name=_("Menú Padre"),
        help_text="Dejar en blanco si es un elemento del menú principal."
    )
    orden = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Orden de aparición (0 primero, 1 después, etc.)."
    )

    def __str__(self):
        if self.parent:
            return f"{self.parent.nombre} -> {self.nombre}"
        return self.nombre

    class Meta:
        verbose_name = "Elemento de Menú"
        verbose_name_plural = "Elementos de Menú"
        ordering = ['orden']


def hecho_historico_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/historia/<uuid>_<filename>
    return f'historia/{uuid.uuid4()}_{filename}'


class HechoHistorico(models.Model):
    """
    Representa un único evento o hito en la línea de tiempo
    de la historia del municipio.
    """
    ano = models.IntegerField(_("Año del Acontecimiento"))
    titulo = models.CharField(_("Título del Hecho"), max_length=200)
    descripcion = models.TextField(_("Descripción"))
    imagen = models.ImageField(
        _("Imagen Ilustrativa"),
        upload_to=hecho_historico_directory_path,
        blank=True,
        null=True,
        help_text="Imagen opcional para ilustrar el hecho histórico."
    )
    es_publicado = models.BooleanField(
        _("Publicado"),
        default=False,
        help_text="Marcar para que sea visible en la línea de tiempo pública."
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ano}: {self.titulo}"

    class Meta:
        verbose_name = "Hecho Histórico"
        verbose_name_plural = "Hechos Históricos"
        ordering = ['ano']


# --- Modelos de Calificaciones y Reseñas ---

from django.core.validators import MinValueValidator, MaxValueValidator

class Resena(models.Model):
    """
    Modelo para gestionar las reseñas y calificaciones que los usuarios
    pueden dejar sobre Prestadores de Servicios o Artesanos.
    """
    # El usuario que escribe la reseña.
    usuario = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='resenas_hechas'
    )
    # Calificación en estrellas.
    calificacion = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de 1 a 5 estrellas."
    )
    # Comentario de la reseña.
    comentario = models.TextField()
    # Fecha de creación.
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    # Campo de moderación para que un admin la apruebe.
    aprobada = models.BooleanField(
        default=False,
        help_text="Las reseñas deben ser aprobadas por un administrador para ser visibles."
    )

    # Clave Externa Genérica para enlazar a Prestador o Artesano.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"Reseña de {self.usuario.username} sobre {self.content_object} ({self.calificacion} estrellas)"

    class Meta:
        verbose_name = "Reseña y Calificación"
        verbose_name_plural = "Reseñas y Calificaciones"
        ordering = ['-fecha_creacion']
        # Un usuario solo puede dejar una reseña por objeto.
        unique_together = ('usuario', 'content_type', 'object_id')


# --- Modelo para el Buzón de Sugerencias ---

class Sugerencia(models.Model):
    """
    Modelo para el buzón de sugerencias, quejas y felicitaciones.
    Puede ser anónimo o de un usuario registrado.
    Puede ser general o dirigido a un prestador/artesano específico.
    """
    class TipoMensaje(models.TextChoices):
        SUGERENCIA = 'SUGERENCIA', _('Sugerencia')
        QUEJA = 'QUEJA', _('Queja')
        FELICITACION = 'FELICITACION', _('Felicitación')

    class Estado(models.TextChoices):
        RECIBIDO = 'RECIBIDO', _('Recibido')
        EN_REVISION = 'EN_REVISION', _('En Revisión')
        ATENDIDO = 'ATENDIDO', _('Atendido')

    # Información del remitente (si el usuario no está autenticado)
    nombre_remitente = models.CharField(max_length=150, blank=True, help_text="Nombre (si el usuario no está autenticado).")
    email_remitente = models.EmailField(blank=True, help_text="Email de contacto (si el usuario no está autenticado).")

    # Usuario autenticado (opcional)
    usuario = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sugerencias_hechas'
    )

    tipo_mensaje = models.CharField(max_length=20, choices=TipoMensaje.choices, default=TipoMensaje.SUGERENCIA)
    mensaje = models.TextField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.RECIBIDO)
    fecha_envio = models.DateTimeField(auto_now_add=True)

    # Para mostrar públicamente en el home
    es_publico = models.BooleanField(default=False, help_text="Marcar si esta sugerencia/felicitación puede ser mostrada públicamente.")

    # Clave Externa Genérica para enlazar a Prestador o Artesano (opcional)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        remitente = self.usuario.username if self.usuario else self.nombre_remitente or "Anónimo"
        return f"[{self.get_tipo_mensaje_display()}] de {remitente} - {self.fecha_envio.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Sugerencia o Felicitación"
        verbose_name_plural = "Sugerencias y Felicitaciones"
        ordering = ['-fecha_envio']


# --- Modelos de Caracterización ---

def caracterizacion_empresa_eventos_logo_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/caracterizaciones/eventos/<prestador_id>/<filename>
    prestador_id = instance.prestador.id if instance.prestador else 'sin_prestador'
    return f'caracterizaciones/eventos/{prestador_id}/{filename}'


class CaracterizacionEmpresaEventos(models.Model):
    """
    Modelo para la caracterización de empresas operadoras de eventos, ferias y convenciones.
    """
    prestador = models.OneToOneField(
        PrestadorServicio,
        on_delete=models.CASCADE,
        related_name="caracterizacion_eventos"
    )

    # 1. DATOS GENERALES
    nombre_representante_legal = models.CharField(_("Nombre del Representante Legal"), max_length=255, blank=True)
    nit = models.CharField(_("NIT"), max_length=50, blank=True)
    municipio = models.CharField(_("Municipio"), max_length=100, blank=True)
    direccion_oficina = models.CharField(_("Dirección de la Oficina"), max_length=255, blank=True)
    nombre_administrador = models.CharField(_("Nombre del Administrador"), max_length=255, blank=True)
    celular_contacto = models.CharField(_("Celular de Contacto"), max_length=20, blank=True)
    pagina_web = models.URLField(_("Página Web"), blank=True, null=True)
    tiene_rnt = models.BooleanField(_("¿Cuenta con RNT?"), default=False)
    numero_rnt = models.CharField(_("Número RNT"), max_length=50, blank=True)
    logo = models.ImageField(_("Logo de la empresa"), upload_to=caracterizacion_empresa_eventos_logo_path, blank=True, null=True)

    # 1.14 Conteo de empleados
    empleados_hombres_menor_25 = models.PositiveIntegerField(default=0)
    empleados_hombres_25_40 = models.PositiveIntegerField(default=0)
    empleados_hombres_mayor_40 = models.PositiveIntegerField(default=0)
    empleados_mujeres_menor_25 = models.PositiveIntegerField(default=0)
    empleados_mujeres_25_40 = models.PositiveIntegerField(default=0)
    empleados_mujeres_mayor_40 = models.PositiveIntegerField(default=0)
    empleados_lgtbi = models.PositiveIntegerField(default=0)

    # 1.15 Forma de Contratación (usando JSON para flexibilidad)
    contratacion_empleados = models.JSONField(_("Forma de Contratación"), default=dict, blank=True, help_text="JSON con tipos de contrato y conteo por género. Ej: {'permanentes': {'hombres': 1, 'mujeres': 2}}")

    # 1.16 Grupo de Atención Especial
    grupos_especiales_empleados = models.JSONField(_("Grupo de Atención Especial"), default=dict, blank=True, help_text="JSON con conteo de empleados en grupos de atención especial. Ej: {'discapacidad_motora': 1}")

    # 2. ESPECIFICACIONES
    class TiempoFuncionamiento(models.TextChoices):
        MENOS_1_ANO = 'MENOS_1_ANO', _("Menos de 1 Año")
        ENTRE_1_Y_3 = 'ENTRE_1_Y_3', _("Entre 1 y 3 años")
        ENTRE_3_Y_5 = 'ENTRE_3_Y_5', _("Entre 3 y 5 años")
        MAS_DE_5 = 'MAS_DE_5', _("Más de 5 años")
    tiempo_funcionamiento = models.CharField(max_length=20, choices=TiempoFuncionamiento.choices, blank=True)

    servicios_ofrecidos = models.JSONField(_("Servicios Ofrecidos"), default=dict, blank=True, help_text="JSON con los servicios. Ej: {'ferias': true, 'otro': 'Servicio X'}")

    class FormaPrestacion(models.TextChoices):
        DIRECTA = 'DIRECTA', _("Directa (Sin intermediarios)")
        OTRA_EMPRESA = 'OTRA_EMPRESA', _("A través de otro tipo de empresas")
        AGENCIA = 'AGENCIA', _("A través de una agencia de viajes o Tour Operador")
        OTRO = 'OTRO', _("Otro")
    forma_prestacion_servicios = models.CharField(max_length=20, choices=FormaPrestacion.choices, blank=True)
    forma_prestacion_servicios_otro = models.CharField(max_length=255, blank=True)

    pertenece_gremio = models.BooleanField(_("¿Pertenece a algún gremio?"), default=False)
    nombre_gremio = models.CharField(_("Nombre del Gremio"), max_length=255, blank=True)
    rutas_servicios = models.TextField(_("Rutas donde presta servicios"), blank=True, help_text="Municipios o rutas específicas.")

    # 3. FORMACION Y EXPERIENCIA
    nivel_academico_empleados = models.JSONField(_("Nivel Académico de Empleados"), default=dict, blank=True, help_text="JSON con niveles y conteo por género.")
    capacitaciones_recibidas = models.JSONField(_("Capacitaciones Recibidas"), default=list, blank=True, help_text="Lista de capacitaciones. Ej: [{'nombre': '...', 'entidad': '...', 'horas': 40}]")
    tiene_certificacion_norma = models.BooleanField(_("¿Tiene certificación/norma?"), default=False)
    nombre_certificacion_norma = models.CharField(_("Nombre de la Certificación/Norma"), max_length=255, blank=True)
    ha_participado_ferias = models.BooleanField(_("¿Ha participado en ferias?"), default=False)
    nombre_ferias = models.CharField(_("Nombre de las Ferias"), max_length=255, blank=True)

    # 4. NECESIDADES
    necesidades_fortalecimiento = models.TextField(_("Necesidades de Fortalecimiento"), blank=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Caracterización de Eventos para {self.prestador.nombre_negocio}"

    class Meta:
        verbose_name = "Caracterización de Empresa de Eventos"
        verbose_name_plural = "Caracterizaciones de Empresas de Eventos"
        ordering = ['-fecha_actualizacion']


class CaracterizacionAgroturismo(models.Model):
    """
    Modelo para la caracterización de operadores de agroturismo.
    Combina los tres formularios de agroturismo en un solo modelo.
    """
    prestador = models.OneToOneField(
        PrestadorServicio,
        on_delete=models.CASCADE,
        related_name="caracterizacion_agroturismo"
    )

    # --- GENERALIDADES (Formulario 1) ---
    razon_social = models.CharField(max_length=255, blank=True)
    camara_comercio_nit = models.CharField(max_length=50, blank=True)
    rnt_numero = models.CharField(max_length=50, blank=True)
    ruta_turistica = models.CharField(max_length=100, blank=True)
    pagina_web = models.URLField(blank=True, null=True)
    email_contacto = models.EmailField(blank=True, null=True)
    telefono_fax = models.CharField(max_length=50, blank=True)
    tiene_normas_sectoriales = models.BooleanField(default=False)
    certificacion_recibida = models.CharField(max_length=255, blank=True)
    sello_ambiental_colombiano = models.BooleanField(default=False)
    otras_certificaciones = models.TextField(blank=True)
    pertenece_gremio_turismo = models.BooleanField(default=False)
    nombre_gremio = models.CharField(max_length=255, blank=True)

    # --- SERVICIOS Y CARACTERÍSTICAS (Formulario 1) ---
    servicios_ofrecidos = models.JSONField(default=dict, help_text="Ej: {'hospedaje': true, 'restaurante': false}")
    caracteristicas_agroturismo = models.JSONField(default=dict, help_text="Ej: {'agricola': true, 'pecuaria': false}")
    especialidad_agricola = models.JSONField(default=dict, help_text="Ej: {'arroz': true, 'cacao': false}")
    especialidad_pecuaria = models.JSONField(default=dict, help_text="Ej: {'bovino': true, 'equinos': false}")
    especialidad_avicola = models.JSONField(default=dict, help_text="Ej: {'gallinas_campo': true, 'patos': false}")
    especialidad_agroindustrial = models.JSONField(default=dict, help_text="Ej: {'lacteos': true, 'vinos': false}")

    # --- ACTIVIDADES POTENCIALES (Formulario 2) ---
    actividades_agricolas = models.JSONField(default=dict, help_text="Detalle de actividades agrícolas")
    actividades_avicolas = models.JSONField(default=dict, help_text="Detalle de actividades avícolas")
    actividades_agroindustriales = models.JSONField(default=dict, help_text="Detalle de actividades agroindustriales")
    actividades_pecuarias = models.JSONField(default=dict, help_text="Detalle de actividades pecuarias")
    actividades_piscicultura = models.JSONField(default=dict, help_text="Detalle de actividades de piscicultura")

    # --- OTRAS ACTIVIDADES (Formulario 2) ---
    actividades_ecoturismo = models.JSONField(default=dict, help_text="Detalle de actividades de ecoturismo")
    actividades_turismo_aventura = models.JSONField(default=dict, help_text="Detalle de actividades de turismo de aventura")
    otras_actividades_turismo = models.JSONField(default=dict, help_text="Otras actividades de turismo")

    # --- POTENCIALIZACIÓN Y FORMACIÓN (Formulario 3) ---
    caracteristicas_a_potencializar = models.JSONField(default=dict, help_text="Características a potencializar")
    otras_actividades_a_potencializar = models.TextField(blank=True)
    formacion_asesoria_deseada = models.JSONField(default=dict, help_text="Temas de formación y asesoría deseados")

    # --- ASPECTOS DE SEGURIDAD Y CULTURA (Formulario 3) ---
    protocolos_seguridad = models.BooleanField(default=False)
    protocolos_bioseguridad = models.BooleanField(default=False)
    cumple_lineamientos_escnna = models.BooleanField(default=False)
    tiene_polizas = models.BooleanField(default=False)
    nombre_polizas = models.CharField(max_length=255, blank=True)
    espacios_salvaguarda_cultura = models.BooleanField(default=False)
    realiza_actividades_culturales = models.BooleanField(default=False)
    descripcion_actividades_culturales = models.TextField(blank=True)
    realiza_actividades_llaneridad = models.BooleanField(default=False)
    descripcion_actividades_llaneridad = models.TextField(blank=True)

    # --- PROMOCIÓN Y DATOS DEL ENCUESTADO (Formulario 3) ---
    medios_promocion = models.JSONField(default=dict, help_text="Medios de promoción utilizados")
    datos_encuestado = models.JSONField(default=dict, help_text="Datos de la persona que diligencia el formulario")

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Caracterización de Agroturismo para {self.prestador.nombre_negocio}"

    class Meta:
        verbose_name = "Caracterización de Agroturismo"
        verbose_name_plural = "Caracterizaciones de Agroturismo"
        ordering = ['-fecha_actualizacion']


def guia_turistico_foto_path(instance, filename):
    prestador_id = instance.prestador.id if instance.prestador else 'sin_prestador'
    return f'caracterizaciones/guias/{prestador_id}/{filename}'


class CaracterizacionGuiaTuristico(models.Model):
    """
    Modelo para la caracterización de Guías Turísticos.
    """
    prestador = models.OneToOneField(
        PrestadorServicio,
        on_delete=models.CASCADE,
        related_name="caracterizacion_guia"
    )

    # 1. IDENTIFICACIÓN GENERAL
    nombres_apellidos = models.CharField(max_length=255, blank=True)
    documento_identidad = models.CharField(max_length=50, blank=True)
    direccion_ubicacion = models.CharField(max_length=255, blank=True)
    municipio = models.CharField(max_length=100, blank=True)
    vereda_localidad = models.CharField(max_length=100, blank=True)
    telefono_fijo = models.CharField(max_length=20, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    pagina_web = models.URLField(blank=True)
    foto = models.ImageField(upload_to=guia_turistico_foto_path, blank=True, null=True)

    class TipoGuia(models.TextChoices):
        PROFESIONAL = 'PROFESIONAL', 'Guía de Turismo Profesional'
        ACOMPANANTE = 'ACOMPANANTE', 'Guía de Turismo Acompañante'
    tipo_guia = models.CharField(max_length=20, choices=TipoGuia.choices, blank=True)

    tiene_rnt = models.BooleanField(default=False)

    class Sexo(models.TextChoices):
        MASCULINO = 'MASCULINO', 'Masculino'
        FEMENINO = 'FEMENINO', 'Femenino'
    sexo = models.CharField(max_length=10, choices=Sexo.choices, blank=True)

    pertenece_lgtbi = models.BooleanField(default=False)
    discapacidad = models.CharField(max_length=255, blank=True, help_text="Tipo de discapacidad, si aplica")
    grupo_atencion_especial = models.CharField(max_length=255, blank=True, help_text="Grupo de atención especial, si aplica")

    # 2. ESPECIALIDAD DEL GUIA
    especialidades = models.JSONField(default=dict, help_text="Ej: {'agroturismo': true, 'aviturismo': false}")

    class FormaServicio(models.TextChoices):
        DIRECTA = 'DIRECTA', 'Directa (sin intermediarios)'
        EMPRESA = 'EMPRESA', 'Trabajo directamente para una empresa'
        INDIRECTA = 'INDIRECTA', 'Indirecta (a través de agencia)'
        OTRO = 'OTRO', 'Otro'
    forma_prestacion_servicio = models.CharField(max_length=20, choices=FormaServicio.choices, blank=True)
    forma_prestacion_servicio_otro = models.CharField(max_length=255, blank=True)

    pertenece_gremio = models.BooleanField(default=False)
    nombre_gremio = models.CharField(max_length=255, blank=True)
    presta_servicios_empresa = models.BooleanField(default=False)
    nombre_empresa_servicio = models.CharField(max_length=255, blank=True)
    rutas_servicio = models.TextField(blank=True, help_text="Rutas y municipios donde opera")
    atractivos_por_municipio = models.JSONField(default=dict, help_text="Ej: {'Puerto Gaitán': ['Atractivo 1', 'Atractivo 2']}")

    # 3. FORMACION Y EXPERIENCIA
    tecnologia_guianza_sena = models.BooleanField(default=False)
    numero_tarjeta_profesional = models.CharField(max_length=100, blank=True)
    fecha_tarjeta = models.DateField(null=True, blank=True)
    tiene_rnt_guia = models.BooleanField(default=False)
    numero_rnt_guia = models.CharField(max_length=100, blank=True)
    fecha_actualizacion_rnt_guia = models.DateField(null=True, blank=True)
    experiencia_independiente_anos = models.PositiveIntegerField(default=0)
    experiencia_independiente_meses = models.PositiveIntegerField(default=0)
    experiencia_sector_privado_anos = models.PositiveIntegerField(default=0)
    experiencia_sector_privado_meses = models.PositiveIntegerField(default=0)
    idiomas = models.JSONField(default=dict, help_text="Ej: {'ingles': {'habla': 'B', 'lee': 'MB'}}")
    capacitaciones_recibidas = models.JSONField(default=list, help_text="Lista de capacitaciones")
    realiza_evaluacion_servicio = models.BooleanField(default=False)
    cual_evaluacion = models.CharField(max_length=255, blank=True)
    temas_profundizar = models.TextField(blank=True, help_text="Temas en los que le gustaría profundizar")

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Caracterización de Guía: {self.nombres_apellidos or self.prestador.nombre_negocio}"

    class Meta:
        verbose_name = "Caracterización de Guía Turístico"
        verbose_name_plural = "Caracterizaciones de Guías Turísticos"
        ordering = ['-fecha_actualizacion']


def artesano_foto_path(instance, filename):
    artesano_id = instance.artesano.id if instance.artesano else 'sin_artesano'
    return f'caracterizaciones/artesanos/{artesano_id}/{filename}'


class CaracterizacionArtesano(models.Model):
    """
    Modelo para la caracterización de Artesanos.
    """
    artesano = models.OneToOneField(
        Artesano,
        on_delete=models.CASCADE,
        related_name="caracterizacion"
    )

    # 1. IDENTIFICACIÓN GENERAL
    documento_identidad = models.CharField(max_length=50, blank=True)
    direccion_ubicacion = models.CharField(max_length=255, blank=True)
    municipio = models.CharField(max_length=100, blank=True)
    vereda_localidad = models.CharField(max_length=100, blank=True)
    telefono_fijo = models.CharField(max_length=20, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    pagina_web = models.URLField(blank=True)
    tiene_registro_artesano = models.BooleanField(default=False)
    foto = models.ImageField(upload_to=artesano_foto_path, blank=True, null=True)

    class Sexo(models.TextChoices):
        MASCULINO = 'MASCULINO', 'Masculino'
        FEMENINO = 'FEMENINO', 'Femenino'
    sexo = models.CharField(max_length=10, choices=Sexo.choices, blank=True)

    pertenece_lgtbi = models.BooleanField(default=False)
    discapacidad = models.CharField(max_length=255, blank=True, help_text="Tipo de discapacidad, si aplica")
    grupo_atencion_especial = models.CharField(max_length=255, blank=True, help_text="Grupo de atención especial, si aplica")

    # 2. ESPECIALIDAD ARTESANAL
    class TipoArtesania(models.TextChoices):
        INDIGENA = 'INDIGENA', 'Artesanía Indígena'
        CONTEMPORANEA = 'CONTEMPORANEA', 'Artesanía Contemporánea o Neoartesanía'
        TRADICIONAL = 'TRADICIONAL', 'Tradicional popular'
        OTRA = 'OTRA', 'Otra'
    tipo_artesania = models.CharField(max_length=20, choices=TipoArtesania.choices, blank=True)
    tipo_artesania_otra = models.CharField(max_length=255, blank=True)

    class OrigenProduccion(models.TextChoices):
        SUBSISTENCIA = 'SUBSISTENCIA', 'Economía de subsistencia'
        NUCLEO = 'NUCLEO', 'Núcleo Artesanales'
        URBANA = 'URBANA', 'Producción Urbana'
        OTRO = 'OTRO', 'Otro'
    origen_produccion = models.CharField(max_length=20, choices=OrigenProduccion.choices, blank=True)
    origen_produccion_otro = models.CharField(max_length=255, blank=True)

    oficios_artesanales = models.JSONField(default=dict, help_text="Ej: {'madera': true, 'vidrio': false}")
    producto_principal = models.CharField(max_length=255, blank=True)
    materia_prima_principal = models.CharField(max_length=255, blank=True)
    tecnica_utilizada = models.CharField(max_length=255, blank=True)
    descripcion_proceso = models.TextField(blank=True)

    pertenece_gremio = models.BooleanField(default=False)
    nombre_gremio = models.CharField(max_length=255, blank=True)

    class FormaComercializacion(models.TextChoices):
        DIRECTA = 'DIRECTA', 'Directa (Vendo mis productos al cliente final)'
        EMPRESA = 'EMPRESA', 'Trabajo directamente para una empresa'
        INDIRECTA = 'INDIRECTA', 'Indirecta (Vendo a empresas para ser comercializados)'
        OTRO = 'OTRO', 'Otro'
    forma_comercializacion = models.CharField(max_length=20, choices=FormaComercializacion.choices, blank=True)
    forma_comercializacion_otra = models.CharField(max_length=255, blank=True)
    ofrece_productos_empresa = models.BooleanField(default=False)
    nombre_empresa_comercializa = models.CharField(max_length=255, blank=True)

    # 3. FORMACION Y EXPERIENCIA
    certificado_aptitud_sena = models.BooleanField(default=False)
    nombre_certificado_sena = models.CharField(max_length=255, blank=True)
    numero_tarjeta_sena = models.CharField(max_length=100, blank=True)
    fecha_tarjeta_sena = models.DateField(null=True, blank=True)
    tiene_registro_nacional_artesano = models.BooleanField(default=False)
    numero_registro_nacional = models.CharField(max_length=100, blank=True)
    fecha_actualizacion_registro = models.DateField(null=True, blank=True)
    idiomas = models.JSONField(default=dict, help_text="Ej: {'ingles': {'habla': 'B', 'lee': 'MB'}}")
    capacitaciones_recibidas = models.JSONField(default=list, help_text="Lista de capacitaciones")
    temas_profundizar = models.TextField(blank=True)
    elementos_maquinaria_necesaria = models.TextField(blank=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Caracterización de Artesano: {self.artesano.nombre_artesano}"

    class Meta:
        verbose_name = "Caracterización de Artesano"
        verbose_name_plural = "Caracterizaciones de Artesanos"
        ordering = ['-fecha_actualizacion']


class ConsejoLocal(models.Model):
    """
    Modelo para la caracterización de un Consejo Local de Turismo.
    """
    municipio = models.CharField(max_length=255)
    acto_administrativo = models.CharField(max_length=255, blank=True, help_text="Acto Administrativo de constitución del Consejo Local")

    class Frecuencia(models.TextChoices):
        MENSUAL = 'MENSUAL', 'Mensual'
        BIMESTRAL = 'BIMESTRAL', 'Bimestral'
        TRIMESTRAL = 'TRIMESTRAL', 'Trimestral'
        OTRO = 'OTRO', 'Otro'
    frecuencia_reunion = models.CharField(max_length=20, choices=Frecuencia.choices, blank=True)
    frecuencia_reunion_otro = models.CharField(max_length=100, blank=True)

    tiene_matriz_compromisos = models.BooleanField(default=False)
    tiene_plan_accion = models.BooleanField(default=False, help_text="Si es sí, se debería poder adjuntar el plan.")
    plan_accion_adjunto = models.FileField(upload_to='consejos_locales/planes/', blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Consejo Local de Turismo de {self.municipio}"

    class Meta:
        verbose_name = "Consejo Local de Turismo"
        verbose_name_plural = "Consejos Locales de Turismo"
        ordering = ['municipio']


class IntegranteConsejo(models.Model):
    """
    Modelo para un integrante de un Consejo Local de Turismo.
    """
    consejo = models.ForeignKey(ConsejoLocal, on_delete=models.CASCADE, related_name="integrantes")
    nombre_completo = models.CharField(max_length=255)
    celular = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    sector_representa = models.CharField(max_length=255, blank=True)

    class Genero(models.TextChoices):
        FEMENINO = 'FEMENINO', 'Femenino'
        MASCULINO = 'MASCULINO', 'Masculino'
        LGTBI = 'LGTBI', 'LGTBI'
        NO_APLICA = 'NA', 'No Aplica'
    genero = models.CharField(max_length=10, choices=Genero.choices, blank=True)

    grupo_atencion_especial = models.CharField(max_length=100, blank=True, help_text="Ej: Desplazado, Afrodescendiente, Indígena, etc.")
    tipo_discapacidad = models.CharField(max_length=100, blank=True, help_text="Ej: Motora, Auditiva, Visual, etc.")

    def __str__(self):
        return f"{self.nombre_completo} - {self.consejo.municipio}"

    class Meta:
        verbose_name = "Integrante de Consejo Local"
        verbose_name_plural = "Integrantes de Consejos Locales"
        ordering = ['nombre_completo']


class DiagnosticoRutaTuristica(models.Model):
    """
    Modelo para el diagnóstico de una ruta turística.
    """
    nombre_ruta = models.CharField(max_length=255, unique=True)
    descripcion_general = models.TextField(blank=True)

    # Usamos JSONField para estructuras de datos complejas y flexibles.
    actores_cadena_valor = models.JSONField(default=list, help_text="Lista de actores por municipio. Ej: [{'municipio': '...', 'actores': [{'tipo': 'Alojamiento', 'nombre': '...', 'caracterizado': true}]}]")
    entidades_responsables = models.JSONField(default=list, help_text="Lista de entidades y sus responsables. Ej: [{'entidad': '...', 'responsable': '...', 'contacto': '...'}]")
    eventos_turisticos = models.JSONField(default=list, help_text="Lista de eventos/festividades. Ej: [{'evento': '...', 'municipio': '...', 'fecha': '...'}]")
    atractivos_turisticos = models.JSONField(default=list, help_text="Lista de atractivos. Ej: [{'nombre': '...', 'descripcion': '...', 'tipo': '...'}]")

    # Campos de texto para información de accesibilidad y programas.
    vias_acceso = models.TextField(blank=True)
    transporte = models.TextField(blank=True)
    senalizacion = models.TextField(blank=True)
    energia = models.TextField(blank=True)
    comunicaciones = models.TextField(blank=True)
    distancia_desde_villavicencio = models.CharField(max_length=100, blank=True)

    # Actividades desarrolladas por programas
    actividades_situr = models.TextField("Actividades SITUR", blank=True)
    actividades_escnna = models.TextField("Actividades ESCNNA", blank=True)
    actividades_rnt = models.TextField("Actividades RNT", blank=True)
    actividades_formacion = models.TextField("Actividades Formación y Capacitación", blank=True)
    actividades_promocion = models.TextField("Actividades Promoción y Difusión", blank=True)
    actividades_nts = models.TextField("Actividades NTS", blank=True)
    actividades_asociatividad = models.TextField("Actividades Asociatividad", blank=True)
    actividades_cat = models.TextField("Actividades Colegios Amigos del Turismo", blank=True)

    elaborado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagnosticos_elaborados"
    )
    fecha_elaboracion = models.DateField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Diagnóstico de la Ruta: {self.nombre_ruta}"

    class Meta:
        verbose_name = "Diagnóstico de Ruta Turística"
        verbose_name_plural = "Diagnósticos de Rutas Turísticas"
        ordering = ['nombre_ruta']