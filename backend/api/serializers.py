from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from .models import (
    CustomUser, PrestadorServicio, ImagenGaleria, ImagenArtesano, DocumentoLegalizacion, Publicacion,
    ConsejoConsultivo, AtractivoTuristico, ImagenAtractivo, ElementoGuardado, ContentType,
    CategoriaPrestador, Video, ContenidoMunicipio, AgentTask, SiteConfiguration, MenuItem,
    HomePageComponent, AuditLog, PaginaInstitucional, HechoHistorico, Artesano, RubroArtesano,
    Resena, Sugerencia, CaracterizacionEmpresaEventos, CaracterizacionAgroturismo, CaracterizacionGuiaTuristico,
    CaracterizacionArtesano, ConsejoLocal, IntegranteConsejo, DiagnosticoRutaTuristica
)


class DiagnosticoRutaTuristicaSerializer(serializers.ModelSerializer):
    elaborado_por_username = serializers.CharField(source='elaborado_por.username', read_only=True)

    class Meta:
        model = DiagnosticoRutaTuristica
        fields = '__all__'
        read_only_fields = ('elaborado_por',)


class IntegranteConsejoSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegranteConsejo
        fields = ['id', 'nombre_completo', 'celular', 'correo', 'sector_representa', 'genero', 'grupo_atencion_especial', 'tipo_discapacidad']


class ConsejoLocalSerializer(serializers.ModelSerializer):
    integrantes = IntegranteConsejoSerializer(many=True)

    class Meta:
        model = ConsejoLocal
        fields = ['id', 'municipio', 'acto_administrativo', 'frecuencia_reunion', 'frecuencia_reunion_otro', 'tiene_matriz_compromisos', 'tiene_plan_accion', 'plan_accion_adjunto', 'integrantes']

    def create(self, validated_data):
        integrantes_data = validated_data.pop('integrantes')
        consejo = ConsejoLocal.objects.create(**validated_data)
        for integrante_data in integrantes_data:
            IntegranteConsejo.objects.create(consejo=consejo, **integrante_data)
        return consejo

    def update(self, instance, validated_data):
        integrantes_data = validated_data.pop('integrantes', None)
        instance = super().update(instance, validated_data)

        if integrantes_data is not None:
            instance.integrantes.all().delete()
            for integrante_data in integrantes_data:
                IntegranteConsejo.objects.create(consejo=instance, **integrante_data)

        return instance


class CaracterizacionArtesanoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de caracterización de artesanos.
    """
    class Meta:
        model = CaracterizacionArtesano
        fields = '__all__'


class CaracterizacionGuiaTuristicoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de caracterización de guías turísticos.
    """
    class Meta:
        model = CaracterizacionGuiaTuristico
        fields = '__all__'


class CaracterizacionEmpresaEventosSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de caracterización de empresas de eventos.
    """
    class Meta:
        model = CaracterizacionEmpresaEventos
        fields = '__all__'


class CaracterizacionAgroturismoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de caracterización de agroturismo.
    """
    class Meta:
        model = CaracterizacionAgroturismo
        fields = '__all__'


class HechoHistoricoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo HechoHistorico.
    """
    imagen_url = serializers.ImageField(source='imagen', read_only=True)

    class Meta:
        model = HechoHistorico
        fields = [
            'id', 'ano', 'titulo', 'descripcion', 'imagen',
            'imagen_url', 'es_publicado'
        ]
        extra_kwargs = {
            'imagen': {'write_only': True, 'required': False}
        }


class GaleriaItemSerializer(serializers.Serializer):
    """
    Serializador genérico para unificar diferentes tipos de media (imágenes, videos)
    en una sola respuesta para la galería.
    """
    id = serializers.CharField()
    tipo = serializers.CharField() # 'imagen' o 'video'
    url = serializers.URLField()
    thumbnail_url = serializers.URLField()
    titulo = serializers.CharField()
    descripcion = serializers.CharField(required=False, allow_blank=True)


class PaginaInstitucionalSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo PaginaInstitucional.
    Maneja la carga de imágenes y muestra los datos necesarios.
    """
    banner_url = serializers.ImageField(source='banner', read_only=True)
    actualizado_por_username = serializers.CharField(source='actualizado_por.username', read_only=True)

    class Meta:
        model = PaginaInstitucional
        fields = [
            'id', 'nombre', 'slug', 'titulo_banner', 'subtitulo_banner',
            'banner', 'banner_url', 'contenido_principal', 'programas_proyectos',
            'estrategias_apoyo', 'politicas_locales', 'convenios_asociaciones',
            'informes_resultados', 'actualizado_por_username', 'fecha_actualizacion'
        ]
        # Hacemos que el campo de carga 'banner' sea de solo escritura y no obligatorio en actualizaciones
        extra_kwargs = {
            'banner': {'write_only': True, 'required': False}
        }


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializador para los detalles del usuario.
    Asegura que el campo 'role' se incluya en la respuesta de la API.
    """
    class Meta:
        model = CustomUser
        fields = ('pk', 'username', 'email', 'role')

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializador para que un Administrador gestione usuarios.
    Permite crear, ver, actualizar y eliminar usuarios, incluyendo su rol.
    La contraseña es de solo escritura y no es obligatoria en las actualizaciones.
    """
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'password')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        """
        Crea un nuevo usuario y hashea la contraseña.
        """
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        """
        Actualiza un usuario. Si se proporciona una nueva contraseña, la hashea.
        """
        # Elimina la contraseña del dict si está presente, para manejarla por separado.
        password = validated_data.pop('password', None)

        # Actualiza el resto de los campos.
        instance = super().update(instance, validated_data)

        if password:
            instance.set_password(password)
            instance.save()

        return instance


# --- Serializadores de Sugerencias ---

class SugerenciaSerializer(serializers.ModelSerializer):
    """
    Serializador para la creación pública de sugerencias.
    """
    class Meta:
        model = Sugerencia
        fields = ['nombre_remitente', 'email_remitente', 'tipo_mensaje', 'mensaje']


class SugerenciaAdminSerializer(serializers.ModelSerializer):
    """
    Serializador para la gestión de sugerencias en el panel de administración.
    """
    class Meta:
        model = Sugerencia
        fields = '__all__'


class FeedbackProveedorSerializer(serializers.ModelSerializer):
    """
    Serializador para que un proveedor (prestador o artesano) vea el
    feedback dirigido a él, de forma anónima.
    """
    class Meta:
        model = Sugerencia
        fields = ['id', 'tipo_mensaje', 'mensaje', 'fecha_envio', 'estado']


class FelicitacionPublicaSerializer(serializers.ModelSerializer):
    """
    Serializador para las felicitaciones públicas. Muestra el mensaje y el remitente.
    """
    remitente = serializers.SerializerMethodField()

    class Meta:
        model = Sugerencia
        fields = ['id', 'mensaje', 'remitente']

    def get_remitente(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return obj.nombre_remitente or "Anónimo"


class VideoSerializer(serializers.ModelSerializer):
    """
    Serializador para los videos.
    """
    class Meta:
        model = Video
        fields = ['id', 'titulo', 'descripcion', 'url_youtube', 'fecha_publicacion']


class ConsejoConsultivoSerializer(serializers.ModelSerializer):
    """
    Serializador para las publicaciones del Consejo Consultivo.
    """
    class Meta:
        model = ConsejoConsultivo
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'documento_adjunto']


class LocationSerializer(serializers.Serializer):
    """
    Serializador genérico para representar cualquier punto geolocalizado en el mapa.
    No está atado a un modelo, lo que permite combinar diferentes tipos de ubicaciones.
    """
    id = serializers.CharField()
    nombre = serializers.CharField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    tipo = serializers.CharField()
    url_detalle = serializers.CharField()


class ImagenAtractivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenAtractivo
        fields = ['id', 'imagen', 'alt_text']


class AtractivoTuristicoListSerializer(serializers.ModelSerializer):
    """
    Serializador para la lista pública de atractivos turísticos.
    """
    imagen_principal = serializers.SerializerMethodField()

    class Meta:
        model = AtractivoTuristico
        fields = ['id', 'nombre', 'slug', 'categoria_color', 'imagen_principal']

    def get_imagen_principal(self, obj):
        # Devuelve la URL de la primera imagen de la galería, o None si no hay.
        primera_imagen = obj.imagenes.first()
        if primera_imagen:
            request = self.context.get('request')
            return request.build_absolute_uri(primera_imagen.imagen.url)
        return None


class AtractivoTuristicoDetailSerializer(serializers.ModelSerializer):
    """
    Serializador para el detalle público de un atractivo turístico.
    """
    imagenes = ImagenAtractivoSerializer(many=True, read_only=True)
    categoria_color_display = serializers.CharField(source='get_categoria_color_display', read_only=True)

    class Meta:
        model = AtractivoTuristico
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'como_llegar',
            'ubicacion_mapa', 'categoria_color', 'categoria_color_display', 'imagenes'
        ]


class PublicacionListSerializer(serializers.ModelSerializer):
    """
    Serializador para listar las publicaciones para el público.
    Muestra una versión resumida de la información.
    """
    class Meta:
        model = Publicacion
        fields = ['id', 'tipo', 'subcategoria_evento', 'titulo', 'slug', 'imagen_principal', 'fecha_evento_inicio', 'fecha_evento_fin', 'fecha_publicacion']

class PublicacionDetailSerializer(serializers.ModelSerializer):
    """
    Serializador para ver el detalle completo de una publicación.
    """
    autor_nombre = serializers.CharField(source='autor.get_full_name', read_only=True)
    subcategoria_evento_display = serializers.CharField(source='get_subcategoria_evento_display', read_only=True)

    class Meta:
        model = Publicacion
        fields = [
            'id', 'tipo', 'titulo', 'slug', 'contenido', 'imagen_principal',
            'autor_nombre', 'fecha_evento_inicio', 'fecha_evento_fin', 'fecha_publicacion',
            'subcategoria_evento', 'subcategoria_evento_display'
        ]


class AdminPublicacionSerializer(serializers.ModelSerializer):
    """
    Serializador para la gestión de Publicaciones en el panel de administración.
    Expone todos los campos, incluido 'es_publicado' para la aprobación.
    """
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)

    class Meta:
        model = Publicacion
        fields = [
            'id', 'tipo', 'titulo', 'slug', 'contenido', 'imagen_principal',
            'autor', 'autor_nombre', 'es_publicado',
            'fecha_evento_inicio', 'fecha_evento_fin', 'fecha_publicacion',
            'subcategoria_evento',
        ]
        read_only_fields = ['autor_nombre']


class ImagenGaleriaSerializer(serializers.ModelSerializer):
    """
    Serializador para subir y listar imágenes de la galería de un prestador.
    """
    class Meta:
        model = ImagenGaleria
        fields = ['id', 'imagen', 'alt_text', 'prestador']
        read_only_fields = ['prestador']

class ImagenArtesanoSerializer(serializers.ModelSerializer):
    """
    Serializador para subir y listar imágenes de la galería de un artesano.
    """
    class Meta:
        model = ImagenArtesano
        fields = ['id', 'imagen', 'alt_text', 'artesano']
        read_only_fields = ['artesano']


class DocumentoLegalizacionSerializer(serializers.ModelSerializer):
    """
    Serializador para subir y listar documentos de legalización de un prestador.
    """
    class Meta:
        model = DocumentoLegalizacion
        fields = ['id', 'documento', 'nombre_documento', 'fecha_subida', 'prestador']
        read_only_fields = ['prestador', 'fecha_subida']


class CategoriaPrestadorSerializer(serializers.ModelSerializer):
    """
    Serializador para las categorías de los prestadores de servicios.
    """
    class Meta:
        model = CategoriaPrestador
        fields = ['id', 'nombre', 'slug']


class PrestadorServicioPublicListSerializer(serializers.ModelSerializer):
    """
    Serializador para la vista pública de la lista de prestadores de servicios.
    """
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    imagen_principal = serializers.SerializerMethodField()

    class Meta:
        model = PrestadorServicio
        fields = ['id', 'nombre_negocio', 'categoria_nombre', 'imagen_principal']

    def get_imagen_principal(self, obj):
        primera_imagen = obj.galeria_imagenes.first()
        if primera_imagen:
            request = self.context.get('request')
            return request.build_absolute_uri(primera_imagen.imagen.url)
        return None


class RubroArtesanoSerializer(serializers.ModelSerializer):
    """
    Serializador para los rubros de los artesanos.
    """
    class Meta:
        model = RubroArtesano
        fields = ['id', 'nombre', 'slug']


class ArtesanoPublicListSerializer(serializers.ModelSerializer):
    """
    Serializador para la vista pública de la lista de artesanos.
    """
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)

    class Meta:
        model = Artesano
        fields = ['id', 'nombre_taller', 'nombre_artesano', 'rubro_nombre', 'foto_url']

class ArtesanoPublicDetailSerializer(serializers.ModelSerializer):
    """
    Serializador para el detalle público de un artesano.
    """
    rubro = RubroArtesanoSerializer(read_only=True)
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)
    galeria_imagenes = ImagenArtesanoSerializer(many=True, read_only=True)

    class Meta:
        model = Artesano
        fields = [
            'id', 'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_taller', 'rubro', 'foto_url', 'galeria_imagenes'
        ]


class PrestadorServicioPublicDetailSerializer(serializers.ModelSerializer):
    """
    Serializador para el detalle público de un prestador de servicios.
    """
    categoria = CategoriaPrestadorSerializer(read_only=True)
    galeria_imagenes = ImagenGaleriaSerializer(many=True, read_only=True)

    class Meta:
        model = PrestadorServicio
        # Listamos explícitamente los campos para asegurar que todos los datos públicos se incluyan.
        fields = [
            'id', 'nombre_negocio', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_mapa', 'promociones_ofertas', 'categoria', 'galeria_imagenes'
        ]

class ArtesanoUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para que un artesano actualice su propio perfil.
    """
    class Meta:
        model = Artesano
        fields = [
            'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'foto_principal', 'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_taller'
        ]
        extra_kwargs = {
            'foto_principal': {'required': False}
        }


class ArtesanoSerializer(serializers.ModelSerializer):
    """
    Serializador completo para que un artesano vea su perfil.
    """
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)
    galeria_imagenes = ImagenArtesanoSerializer(many=True, read_only=True)

    class Meta:
        model = Artesano
        fields = [
            'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'foto_principal', 'foto_url', 'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_taller', 'aprobado', 'rubro_nombre', 'galeria_imagenes'
        ]
        read_only_fields = ['aprobado', 'rubro_nombre', 'foto_url', 'galeria_imagenes']


class PrestadorServicioUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para que un prestador actualice su perfil.
    Solo incluye los campos que el usuario puede editar directamente.
    """
    class Meta:
        model = PrestadorServicio
        fields = [
            'nombre_negocio', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_mapa', 'promociones_ofertas',
            'reporte_ocupacion_nacional', 'reporte_ocupacion_internacional',
        ]


class PrestadorServicioSerializer(serializers.ModelSerializer):
    """
    Serializador para que un prestador vea y actualice su perfil.
    """
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    galeria_imagenes = ImagenGaleriaSerializer(many=True, read_only=True)
    documentos_legalizacion = DocumentoLegalizacionSerializer(many=True, read_only=True)

    class Meta:
        model = PrestadorServicio
        fields = [
            'id',
            'nombre_negocio', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_whatsapp',
            'ubicacion_mapa', 'promociones_ofertas',
            'reporte_ocupacion_nacional', 'reporte_ocupacion_internacional',
            'categoria_nombre', 'aprobado',
            'galeria_imagenes', 'documentos_legalizacion'
        ]
        read_only_fields = ['id', 'aprobado', 'categoria_nombre', 'galeria_imagenes', 'documentos_legalizacion']


class TuristaRegisterSerializer(RegisterSerializer):
    """
    Serializador de registro simplificado para usuarios turistas.
    Cuando un usuario se registra, automáticamente se le asigna el rol 'TURISTA'.
    """
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.TURISTA
        user.save()
        return user


class PrestadorRegisterSerializer(RegisterSerializer):
    """
    Serializador de registro para Prestadores de Servicios.
    Cuando un usuario se registra por esta vía, se le asigna el rol 'PRESTADOR'
    y se le crea un perfil de PrestadorServicio vacío.
    """

    def save(self, request):
        # El método save original crea el usuario. Lo llamamos primero.
        user = super().save(request)

        # Asignamos el rol de PRESTADOR
        user.role = CustomUser.Role.PRESTADOR
        user.save()

        # Creamos el perfil de Prestador de Servicio asociado
        # Usamos el username como nombre de negocio temporal
        PrestadorServicio.objects.create(
            usuario=user,
            nombre_negocio=f"Perfil de {user.username}"
        )

        return user


class ArtesanoRegisterSerializer(RegisterSerializer):
    """
    Serializador de registro para Artesanos.
    Crea un usuario con el rol 'ARTESANO' y un perfil de Artesano asociado.
    """
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.ARTESANO
        user.save()
        Artesano.objects.create(
            usuario=user,
            nombre_artesano=user.get_full_name() or user.username,
            nombre_taller=f"Taller de {user.username}"
        )
        return user


class ElementoGuardadoSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar los elementos guardados por un usuario.
    Determina dinámicamente qué serializador usar para el objeto guardado.
    """
    content_object = serializers.SerializerMethodField()
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = ElementoGuardado
        fields = ['id', 'fecha_guardado', 'object_id', 'content_type_name', 'content_object']

    def get_content_object(self, obj):
        if isinstance(obj.content_object, AtractivoTuristico):
            return AtractivoTuristicoListSerializer(obj.content_object, context=self.context).data
        if isinstance(obj.content_object, Publicacion):
            return PublicacionListSerializer(obj.content_object, context=self.context).data
        return None

class ElementoGuardadoCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para que un usuario guarde un nuevo elemento favorito.
    """
    content_type = serializers.CharField()

    class Meta:
        model = ElementoGuardado
        fields = ['content_type', 'object_id']

    def validate(self, data):
        content_type_str = data['content_type'].lower()
        model_map = {
            'atractivoturistico': AtractivoTuristico,
            'publicacion': Publicacion,
        }
        model = model_map.get(content_type_str)

        if not model:
            raise serializers.ValidationError("Tipo de contenido no válido.")

        if not model.objects.filter(pk=data['object_id']).exists():
            raise serializers.ValidationError("El objeto especificado no existe.")

        data['content_type'] = ContentType.objects.get_for_model(model)
        return data

    def create(self, validated_data):
        # get_or_create para manejar la creación de forma idempotente.
        # Si ya existe, simplemente lo devuelve.
        instance, _ = ElementoGuardado.objects.get_or_create(
            usuario=self.context['request'].user,
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id']
        )
        return instance


class AdminArtesanoSerializer(serializers.ModelSerializer):
    """
    Serializador para que el administrador vea la lista de artesanos.
    Incluye todos los campos relevantes para la moderación.
    """
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)

    class Meta:
        model = Artesano
        fields = [
            'id',
            'nombre_taller',
            'nombre_artesano',
            'telefono',
            'email_contacto',
            'aprobado',
            'fecha_creacion',
            'rubro_nombre',
            'usuario_email'
        ]


class AdminPrestadorServicioSerializer(serializers.ModelSerializer):
    """
    Serializador para que el administrador vea la lista de prestadores.
    Incluye todos los campos relevantes para la moderación.
    """
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)

    class Meta:
        model = PrestadorServicio
        fields = [
            'id',
            'nombre_negocio',
            'telefono',
            'email_contacto',
            'aprobado',
            'fecha_creacion',
            'categoria_nombre',
            'usuario_email'
        ]


class ContenidoMunicipioSerializer(serializers.ModelSerializer):
    """
    Serializador para los bloques de contenido del municipio.
    """
    actualizado_por_username = serializers.CharField(source='actualizado_por.username', read_only=True)

    class Meta:
        model = ContenidoMunicipio
        fields = [
            'id',
            'seccion',
            'titulo',
            'contenido',
            'orden',
            'actualizado_por_username',
            'fecha_actualizacion',
        ]

    def create(self, validated_data):
        # Asigna el usuario actual al crear un nuevo bloque
        validated_data['actualizado_por'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Asigna el usuario actual al actualizar un bloque
        validated_data['actualizado_por'] = self.context['request'].user
        return super().update(instance, validated_data)


# --- Serializadores para el Agente ---

class AgentTaskSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo AgentTask.
    Muestra el estado y resultado de una tarea del agente.
    """
    class Meta:
        model = AgentTask
        fields = ['id', 'command', 'status', 'report', 'created_at', 'updated_at']
        read_only_fields = fields


class AgentCommandSerializer(serializers.Serializer):
    """
    Serializador para validar la orden enviada al sistema de agentes.
    """
    orden = serializers.CharField(
        max_length=2000,
        help_text="La orden o instrucción en lenguaje natural para el agente Coronel."
    )

class LLMKeysSerializer(serializers.ModelSerializer):
    """
    Serializador para gestionar las claves de API de LLM de un usuario.
    Permite a los usuarios ver y actualizar sus propias claves.
    """
    class Meta:
        model = CustomUser
        fields = ['openai_api_key', 'google_api_key']
        extra_kwargs = {
            'openai_api_key': {'write_only': False, 'required': False, 'allow_blank': True},
            'google_api_key': {'write_only': False, 'required': False, 'allow_blank': True},
        }

    def to_representation(self, instance):
        """
        Al mostrar los datos, no devolvemos las claves.
        En su lugar, indicamos si la clave ha sido configurada o no.
        """
        ret = super().to_representation(instance)
        ret['openai_api_key'] = "Configurada" if instance.openai_api_key else "No configurada"
        ret['google_api_key'] = "Configurada" if instance.google_api_key else "No configurada"
        return ret
# --- Serializadores de Auditoría ---

class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializador de solo lectura para los registros de auditoría.
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    content_object_str = serializers.CharField(source='content_object.__str__', read_only=True, default='Objeto no disponible')

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'timestamp',
            'user_username',
            'action',
            'action_display',
            'details',
            'content_object_str'
        ]


# --- Serializadores de Componentes de la Interfaz ---

class HomePageComponentSerializer(serializers.ModelSerializer):
    """
    Serializador para los componentes de la página de inicio.
    Permite la gestión completa (CRUD) de los componentes.
    """
    class Meta:
        model = HomePageComponent
        fields = '__all__'


# --- Serializadores de Configuración del Sitio ---

class SiteConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de configuración del sitio.
    Maneja la clave de API de Google Maps de forma segura.
    """
    class Meta:
        model = SiteConfiguration
        # Listamos todos los campos para poder personalizar 'google_maps_api_key'
        fields = [
            'id', 'direccion', 'horario_atencion', 'telefono_conmutador',
            'telefono_movil', 'linea_gratuita', 'linea_anticorrupcion',
            'correo_institucional', 'correo_notificaciones', 'social_facebook',
            'social_twitter', 'social_youtube', 'social_instagram',
            'seccion_publicaciones_activa', 'seccion_atractivos_activa',
            'seccion_prestadores_activa', 'google_maps_api_key'
        ]
        extra_kwargs = {
            'google_maps_api_key': {'write_only': True, 'required': False, 'allow_blank': True}
        }

    def to_representation(self, instance):
        """
        No devolvemos la clave real. En su lugar, indicamos si está configurada.
        """
        ret = super().to_representation(instance)
        ret['google_maps_api_key'] = "Configurada" if instance.google_maps_api_key else "No configurada"
        return ret


class MenuItemSerializer(serializers.ModelSerializer):
    """
    Serializador recursivo para los elementos del menú.
    Incluye los 'children' (hijos) para representar los submenús.
    """
    children = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'nombre', 'url', 'parent', 'orden', 'children']

    def get_children(self, obj):
        # Obtiene todos los hijos del elemento actual y los serializa.
        children = MenuItem.objects.filter(parent=obj).order_by('orden')
        if children.exists():
            return MenuItemSerializer(children, many=True, context=self.context).data
        return []


# --- Serializadores de Reseñas ---

class ResenaSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar los detalles de una reseña.
    """
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Resena
        fields = ['id', 'usuario_nombre', 'calificacion', 'comentario', 'fecha_creacion']


class ResenaCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para la creación de nuevas reseñas.
    Valida que el objeto a reseñar exista.
    """
    content_type = serializers.CharField()

    class Meta:
        model = Resena
        fields = ['calificacion', 'comentario', 'content_type', 'object_id']

    def validate(self, data):
        content_type_str = data['content_type'].lower()

        # Mapeo de nombres de modelos permitidos para reseñar
        model_map = {
            'prestadorservicio': PrestadorServicio,
            'artesano': Artesano,
        }

        Model = model_map.get(content_type_str)
        if not Model:
            raise serializers.ValidationError("Tipo de contenido no válido. Solo se pueden reseñar 'prestadorservicio' o 'artesano'.")

        if not Model.objects.filter(pk=data['object_id']).exists():
            raise serializers.ValidationError(f"El objeto de tipo '{content_type_str}' con id '{data['object_id']}' no existe.")

        data['content_type'] = ContentType.objects.get_for_model(Model)
        return data

    def create(self, validated_data):
        # Asigna el usuario actual al crear la reseña
        validated_data['usuario'] = self.context['request'].user

        # get_or_create para evitar duplicados según la regla 'unique_together'
        instance, created = Resena.objects.get_or_create(
            usuario=validated_data['usuario'],
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            defaults={
                'calificacion': validated_data['calificacion'],
                'comentario': validated_data['comentario']
            }
        )

        # Si la reseña ya existía, la actualizamos en lugar de fallar.
        if not created:
            instance.calificacion = validated_data['calificacion']
            instance.comentario = validated_data['comentario']
            instance.aprobada = False # Re-moderar en caso de edición
            instance.save()

        return instance