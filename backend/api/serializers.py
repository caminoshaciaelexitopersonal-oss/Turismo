from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from .models import (
    CustomUser, PrestadorServicio, ImagenGaleria, ImagenArtesano, DocumentoLegalizacion, Publicacion,
    ConsejoConsultivo, AtractivoTuristico, ImagenAtractivo, RutaTuristica, ImagenRutaTuristica, ElementoGuardado, ContentType,
    CategoriaPrestador, Video, ContenidoMunicipio, AgentTask, SiteConfiguration, MenuItem,
    HomePageComponent, AuditLog, PaginaInstitucional, ImagenPaginaInstitucional, HechoHistorico, Artesano, RubroArtesano,
    Resena, Sugerencia, ScoringRule, Notificacion,
    Formulario, Pregunta, OpcionRespuesta, RespuestaUsuario,
    PlantillaVerificacion,
    ItemVerificacion,
    Verificacion,
    RespuestaItemVerificacion,
    AsistenciaCapacitacion,
    PerfilAdministrador,
    PerfilFuncionarioDirectivo,
    PerfilFuncionarioProfesional,
    UserLLMConfig
)
from django.db import transaction

# --- Serializadores para Formularios Dinámicos ---

class OpcionRespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcionRespuesta
        fields = ['id', 'texto_opcion', 'orden']


class PreguntaSerializer(serializers.ModelSerializer):
    opciones = OpcionRespuestaSerializer(many=True, read_only=True)

    class Meta:
        model = Pregunta
        fields = ['id', 'texto_pregunta', 'tipo_pregunta', 'es_requerida', 'orden', 'ayuda', 'slug', 'opciones']


class FormularioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formulario
        fields = ['id', 'titulo', 'descripcion', 'es_publico']


class FormularioDetailSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Formulario
        fields = ['id', 'titulo', 'descripcion', 'es_publico', 'preguntas']


class RespuestaUsuarioSerializer(serializers.ModelSerializer):
    pregunta_texto = serializers.CharField(source='pregunta.texto_pregunta', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = RespuestaUsuario
        fields = ['id', 'pregunta', 'pregunta_texto', 'usuario_username', 'respuesta', 'fecha_respuesta']


class RespuestaUsuarioCreateSerializer(serializers.Serializer):
    respuestas = serializers.DictField(
        child=serializers.JSONField(),
        help_text="Diccionario con `pregunta_id` como clave y la respuesta como valor."
    )
    formulario_id = serializers.IntegerField()

    def validate(self, data):
        formulario_id = data.get('formulario_id')
        respuestas_data = data.get('respuestas', {})
        try:
            formulario = Formulario.objects.prefetch_related('preguntas').get(id=formulario_id)
        except Formulario.DoesNotExist:
            raise serializers.ValidationError({"formulario_id": "El formulario especificado no existe."})
        preguntas_requeridas = {p.id: p for p in formulario.preguntas.filter(es_requerida=True)}
        for pregunta_id, pregunta in preguntas_requeridas.items():
            respuesta = respuestas_data.get(str(pregunta_id))
            if respuesta is None or (isinstance(respuesta, str) and not respuesta.strip()) or (isinstance(respuesta, list) and not respuesta):
                raise serializers.ValidationError({
                    "respuestas": f"Falta una respuesta para la pregunta requerida: '{pregunta.texto_pregunta}' (ID: {pregunta_id})."
                })
        data['formulario'] = formulario
        return data

    @transaction.atomic
    def save(self, **kwargs):
        formulario = self.validated_data['formulario']
        respuestas_data = self.validated_data['respuestas']
        usuario = self.context['request'].user
        preguntas_del_formulario = {str(p.id): p for p in formulario.preguntas.all()}
        for pregunta_id_str, respuesta_valor in respuestas_data.items():
            if pregunta_id_str in preguntas_del_formulario:
                pregunta = preguntas_del_formulario[pregunta_id_str]
                respuesta_json = respuesta_valor
                RespuestaUsuario.objects.update_or_create(
                    usuario=usuario,
                    pregunta=pregunta,
                    defaults={'respuesta': respuesta_json}
                )
        return {"status": "success", "message": "Respuestas guardadas correctamente."}


class HechoHistoricoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.ImageField(source='imagen', read_only=True)
    class Meta:
        model = HechoHistorico
        fields = ['id', 'ano', 'titulo', 'descripcion', 'imagen', 'imagen_url', 'es_publicado']
        extra_kwargs = {'imagen': {'write_only': True, 'required': False}}


class GaleriaItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    tipo = serializers.CharField()
    url = serializers.URLField()
    thumbnail_url = serializers.URLField()
    titulo = serializers.CharField()
    descripcion = serializers.CharField(required=False, allow_blank=True)


class ImagenPaginaInstitucionalSerializer(serializers.ModelSerializer):
    imagen_url = serializers.ImageField(source='imagen', read_only=True)
    class Meta:
        model = ImagenPaginaInstitucional
        fields = ['id', 'imagen_url', 'alt_text', 'orden']


class PaginaInstitucionalSerializer(serializers.ModelSerializer):
    banner_url = serializers.ImageField(source='banner', read_only=True)
    actualizado_por_username = serializers.CharField(source='actualizado_por.username', read_only=True)
    galeria_imagenes = ImagenPaginaInstitucionalSerializer(many=True, read_only=True, source='galeria_imagenes')

    class Meta:
        model = PaginaInstitucional
        fields = [
            'id', 'nombre', 'slug', 'titulo_banner', 'subtitulo_banner',
            'banner', 'banner_url', 'contenido_principal', 'programas_proyectos',
            'estrategias_apoyo', 'politicas_locales', 'convenios_asociaciones',
            'informes_resultados', 'actualizado_por_username', 'fecha_actualizacion',
            'galeria_imagenes'
        ]
        extra_kwargs = {'banner': {'write_only': True, 'required': False}}


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('pk', 'username', 'email', 'role')

class UsuarioListSerializer(serializers.ModelSerializer):
    nombre_display = serializers.SerializerMethodField()
    rol_display = serializers.CharField(source='get_role_display', read_only=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'nombre_display', 'role', 'rol_display']
    def get_nombre_display(self, obj):
        if hasattr(obj, 'perfil_prestador') and obj.perfil_prestador.nombre_negocio:
            return obj.perfil_prestador.nombre_negocio
        return obj.get_full_name() or obj.username


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'password')
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class SugerenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sugerencia
        fields = ['nombre_remitente', 'email_remitente', 'tipo_mensaje', 'mensaje']


class SugerenciaAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sugerencia
        fields = '__all__'


class FeedbackProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sugerencia
        fields = ['id', 'tipo_mensaje', 'mensaje', 'fecha_envio', 'estado']


class FelicitacionPublicaSerializer(serializers.ModelSerializer):
    remitente = serializers.SerializerMethodField()
    class Meta:
        model = Sugerencia
        fields = ['id', 'mensaje', 'remitente']
    def get_remitente(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return obj.nombre_remitente or "Anónimo"


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'titulo', 'descripcion', 'url_youtube', 'fecha_publicacion']


class ConsejoConsultivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsejoConsultivo
        fields = ['id', 'titulo', 'contenido', 'fecha_publicacion', 'documento_adjunto']


class LocationSerializer(serializers.Serializer):
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
    imagen_principal_url = serializers.ImageField(source='imagen_principal', read_only=True)
    class Meta:
        model = AtractivoTuristico
        fields = ['id', 'nombre', 'slug', 'descripcion', 'categoria_color', 'imagen_principal_url']


class AtractivoTuristicoDetailSerializer(serializers.ModelSerializer):
    imagenes = ImagenAtractivoSerializer(many=True, read_only=True)
    categoria_color_display = serializers.CharField(source='get_categoria_color_display', read_only=True)
    imagen_principal_url = serializers.ImageField(source='imagen_principal', read_only=True)
    autor_username = serializers.CharField(source='autor.username', read_only=True, default=None)
    class Meta:
        model = AtractivoTuristico
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'como_llegar',
            'latitud', 'longitud', 'categoria_color', 'categoria_color_display',
            'imagen_principal_url', 'imagenes', 'horario_funcionamiento', 'tarifas',
            'recomendaciones', 'accesibilidad', 'informacion_contacto', 'autor_username'
        ]

class AtractivoTuristicoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtractivoTuristico
        fields = [
            'nombre', 'slug', 'descripcion', 'como_llegar', 'ubicacion_mapa',
            'categoria_color', 'imagen_principal', 'horario_funcionamiento',
            'tarifas', 'recomendaciones', 'accesibilidad', 'informacion_contacto',
            'es_publicado'
        ]
        extra_kwargs = {
            'imagen_principal': {'required': False},
            'es_publicado': {'required': False},
        }
    def create(self, validated_data):
        validated_data['autor'] = self.context['request'].user
        return super().create(validated_data)


class PublicacionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publicacion
        fields = ['id', 'tipo', 'subcategoria_evento', 'titulo', 'slug', 'imagen_principal', 'fecha_evento_inicio', 'fecha_evento_fin', 'fecha_publicacion']


class PublicacionDetailSerializer(serializers.ModelSerializer):
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
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    class Meta:
        model = Publicacion
        fields = [
            'id', 'tipo', 'titulo', 'slug', 'contenido', 'imagen_principal',
            'autor', 'autor_nombre', 'estado', 'estado_display',
            'fecha_evento_inicio', 'fecha_evento_fin', 'fecha_publicacion',
            'subcategoria_evento',
        ]
        read_only_fields = ['autor_nombre', 'estado_display']


class ImagenGaleriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenGaleria
        fields = ['id', 'imagen', 'alt_text', 'prestador']
        read_only_fields = ['prestador']


class ImagenArtesanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenArtesano
        fields = ['id', 'imagen', 'alt_text', 'artesano']
        read_only_fields = ['artesano']


class DocumentoLegalizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoLegalizacion
        fields = ['id', 'documento', 'nombre_documento', 'fecha_subida', 'prestador']
        read_only_fields = ['prestador', 'fecha_subida']


class CategoriaPrestadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaPrestador
        fields = ['id', 'nombre', 'slug']


class PrestadorServicioPublicListSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.SerializerMethodField()
    imagen_principal = serializers.ImageField(source='foto_principal', read_only=True)

    class Meta:
        model = PrestadorServicio
        fields = [
            'id',
            'nombre_negocio',
            'categoria_nombre',
            'imagen_principal',
            'descripcion',
            'telefono',
            'email_contacto',
            'red_social_facebook',
            'red_social_instagram',
            'red_social_tiktok',
            'red_social_whatsapp',
            'latitud',
            'longitud',
        ]

    def get_categoria_nombre(self, obj):
        return obj.categoria.nombre if obj.categoria else None


class RubroArtesanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubroArtesano
        fields = ['id', 'nombre', 'slug']


class ArtesanoPublicListSerializer(serializers.ModelSerializer):
    rubro_nombre = serializers.SerializerMethodField()
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)
    class Meta:
        model = Artesano
        fields = [
            'id',
            'nombre_taller',
            'nombre_artesano',
            'rubro_nombre',
            'foto_url',
            'descripcion',
            'telefono',
            'email_contacto',
            'red_social_facebook',
            'red_social_instagram',
            'red_social_tiktok',
            'red_social_whatsapp',
            'latitud',
            'longitud',
        ]

    def get_rubro_nombre(self, obj):
        return obj.rubro.nombre if obj.rubro else None


class ArtesanoPublicDetailSerializer(serializers.ModelSerializer):
    rubro = RubroArtesanoSerializer(read_only=True)
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)
    galeria_imagenes = ImagenArtesanoSerializer(many=True, read_only=True)
    class Meta:
        model = Artesano
        fields = [
            'id', 'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'latitud', 'longitud', 'rubro', 'foto_url', 'galeria_imagenes'
        ]


class ImagenRutaTuristicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenRutaTuristica
        fields = ['id', 'imagen', 'alt_text']


class RutaTuristicaListSerializer(serializers.ModelSerializer):
    imagen_principal_url = serializers.ImageField(source='imagen_principal', read_only=True)

    class Meta:
        model = RutaTuristica
        fields = ['id', 'nombre', 'slug', 'descripcion', 'imagen_principal_url']


class RutaTuristicaDetailSerializer(RutaTuristicaListSerializer):
    imagenes = ImagenRutaTuristicaSerializer(many=True, read_only=True)
    atractivos = AtractivoTuristicoListSerializer(many=True, read_only=True)
    prestadores = PrestadorServicioPublicListSerializer(many=True, read_only=True)

    class Meta(RutaTuristicaListSerializer.Meta):
        fields = RutaTuristicaListSerializer.Meta.fields + ['imagenes', 'atractivos', 'prestadores']


class PrestadorServicioPublicDetailSerializer(serializers.ModelSerializer):
    categoria = CategoriaPrestadorSerializer(read_only=True)
    galeria_imagenes = ImagenGaleriaSerializer(many=True, read_only=True)
    class Meta:
        model = PrestadorServicio
        fields = [
            'id', 'nombre_negocio', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'latitud', 'longitud', 'promociones_ofertas', 'categoria', 'galeria_imagenes'
        ]


class ArtesanoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artesano
        fields = [
            'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'foto_principal', 'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_taller'
        ]
        extra_kwargs = {'foto_principal': {'required': False}}


class ArtesanoSerializer(serializers.ModelSerializer):
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    foto_url = serializers.ImageField(source='foto_principal', read_only=True)
    galeria_imagenes = ImagenArtesanoSerializer(many=True, read_only=True)
    class Meta:
        model = Artesano
        fields = [
            'nombre_taller', 'nombre_artesano', 'descripcion', 'telefono', 'email_contacto',
            'foto_principal', 'foto_url', 'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_taller', 'aprobado', 'rubro_nombre', 'galeria_imagenes',
            'puntuacion_capacitacion', 'puntuacion_reseñas', 'puntuacion_formularios', 'puntuacion_total'
        ]
        read_only_fields = [
            'aprobado', 'rubro_nombre', 'foto_url', 'galeria_imagenes',
            'puntuacion_capacitacion', 'puntuacion_reseñas', 'puntuacion_formularios', 'puntuacion_total'
        ]


class PrestadorServicioUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrestadorServicio
        fields = [
            'nombre_negocio', 'descripcion', 'telefono', 'email_contacto',
            'red_social_facebook', 'red_social_instagram', 'red_social_tiktok', 'red_social_whatsapp',
            'ubicacion_mapa', 'promociones_ofertas',
            'reporte_ocupacion_nacional', 'reporte_ocupacion_internacional',
        ]


class PrestadorServicioSerializer(serializers.ModelSerializer):
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
            'galeria_imagenes', 'documentos_legalizacion',
            'puntuacion_verificacion', 'puntuacion_capacitacion',
            'puntuacion_reseñas', 'puntuacion_formularios', 'puntuacion_total'
        ]
        read_only_fields = [
            'id', 'aprobado', 'categoria_nombre', 'galeria_imagenes', 'documentos_legalizacion',
            'puntuacion_verificacion', 'puntuacion_capacitacion',
            'puntuacion_reseñas', 'puntuacion_formularios', 'puntuacion_total'
        ]


class TuristaRegisterSerializer(RegisterSerializer):
    origen = serializers.ChoiceField(choices=CustomUser.Origen.choices, required=False)
    pais_origen = serializers.CharField(max_length=100, required=False, allow_blank=True)

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.TURISTA
        user.origen = self.validated_data.get('origen', None)
        user.pais_origen = self.validated_data.get('pais_origen', None)
        user.save()
        return user


class PrestadorRegisterSerializer(RegisterSerializer):
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.PRESTADOR
        user.save()
        PrestadorServicio.objects.create(
            usuario=user,
            nombre_negocio=f"Perfil de {user.username}"
        )
        return user


class ArtesanoRegisterSerializer(RegisterSerializer):
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


class AdministradorRegisterSerializer(RegisterSerializer):
    cargo = serializers.CharField(max_length=150, required=True)
    dependencia_asignada = serializers.CharField(max_length=150, required=True)
    nivel_acceso = serializers.CharField(max_length=150, required=True)

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.ADMIN
        user.save()
        PerfilAdministrador.objects.create(
            usuario=user,
            cargo=self.validated_data.get('cargo', ''),
            dependencia_asignada=self.validated_data.get('dependencia_asignada', ''),
            nivel_acceso=self.validated_data.get('nivel_acceso', '')
        )
        return user


class FuncionarioDirectivoRegisterSerializer(RegisterSerializer):
    dependencia = serializers.CharField(max_length=150, required=True)
    nivel_direccion = serializers.CharField(max_length=150, required=True)
    area_funcional = serializers.CharField(max_length=150, required=True)

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.FUNCIONARIO_DIRECTIVO
        user.save()
        PerfilFuncionarioDirectivo.objects.create(
            usuario=user,
            dependencia=self.validated_data.get('dependencia', ''),
            nivel_direccion=self.validated_data.get('nivel_direccion', ''),
            area_funcional=self.validated_data.get('area_funcional', '')
        )
        return user


class FuncionarioProfesionalRegisterSerializer(RegisterSerializer):
    dependencia = serializers.CharField(max_length=150, required=True)
    profesion = serializers.CharField(max_length=150, required=True)
    area_asignada = serializers.CharField(max_length=150, required=True)

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.FUNCIONARIO_PROFESIONAL
        user.save()
        PerfilFuncionarioProfesional.objects.create(
            usuario=user,
            dependencia=self.validated_data.get('dependencia', ''),
            profesion=self.validated_data.get('profesion', ''),
            area_asignada=self.validated_data.get('area_asignada', '')
        )
        return user


class AgenciaEventosRegisterSerializer(RegisterSerializer):
    def save(self, request):
        user = super().save(request)
        user.role = CustomUser.Role.AGENCIA_EVENTOS
        user.save()
        categoria_eventos, _ = CategoriaPrestador.objects.get_or_create(
            slug='agencias-de-eventos',
            defaults={'nombre': 'Agencias de Eventos'}
        )
        PrestadorServicio.objects.create(
            usuario=user,
            nombre_negocio=f"Agencia de {user.username}",
            categoria=categoria_eventos
        )
        return user


class ElementoGuardadoSerializer(serializers.ModelSerializer):
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
        instance, _ = ElementoGuardado.objects.get_or_create(
            usuario=self.context['request'].user,
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id']
        )
        return instance


class AdminArtesanoListSerializer(serializers.ModelSerializer):
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    class Meta:
        model = Artesano
        fields = [
            'id', 'nombre_taller', 'nombre_artesano', 'telefono', 'email_contacto',
            'aprobado', 'fecha_creacion', 'rubro_nombre', 'usuario_email'
        ]

class AdminArtesanoDetailSerializer(serializers.ModelSerializer):
    usuario = CustomUserSerializer(read_only=True)
    rubro = RubroArtesanoSerializer(read_only=True)
    galeria_imagenes = ImagenArtesanoSerializer(many=True, read_only=True)
    class Meta:
        model = Artesano
        fields = '__all__'

class AdminPrestadorListSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    class Meta:
        model = PrestadorServicio
        fields = [
            'id', 'nombre_negocio', 'telefono', 'email_contacto',
            'aprobado', 'fecha_creacion', 'categoria_nombre', 'usuario_email'
        ]

class AdminPrestadorDetailSerializer(serializers.ModelSerializer):
    usuario = CustomUserSerializer(read_only=True)
    categoria = CategoriaPrestadorSerializer(read_only=True)
    galeria_imagenes = ImagenGaleriaSerializer(many=True, read_only=True)
    documentos_legalizacion = DocumentoLegalizacionSerializer(many=True, read_only=True)
    class Meta:
        model = PrestadorServicio
        fields = '__all__'


class ContenidoMunicipioSerializer(serializers.ModelSerializer):
    actualizado_por_username = serializers.CharField(source='actualizado_por.username', read_only=True)
    class Meta:
        model = ContenidoMunicipio
        fields = [
            'id', 'seccion', 'titulo', 'contenido', 'orden',
            'actualizado_por_username', 'fecha_actualizacion',
        ]
    def create(self, validated_data):
        validated_data['actualizado_por'] = self.context['request'].user
        return super().create(validated_data)
    def update(self, instance, validated_data):
        validated_data['actualizado_por'] = self.context['request'].user
        return super().update(instance, validated_data)


class AgentTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentTask
        fields = ['id', 'command', 'status', 'report', 'created_at', 'updated_at']
        read_only_fields = fields


class AgentCommandSerializer(serializers.Serializer):
    orden = serializers.CharField(
        max_length=2000,
        help_text="La orden o instrucción en lenguaje natural para el agente Coronel."
    )


class LLMKeysSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['openai_api_key', 'google_api_key']
        extra_kwargs = {
            'openai_api_key': {'write_only': False, 'required': False, 'allow_blank': True},
            'google_api_key': {'write_only': False, 'required': False, 'allow_blank': True},
        }
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['openai_api_key'] = "Configurada" if instance.openai_api_key else "No configurada"
        ret['google_api_key'] = "Configurada" if instance.google_api_key else "No configurada"
        return ret


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    content_object_str = serializers.CharField(source='content_object.__str__', read_only=True, default='Objeto no disponible')
    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'user_username', 'action',
            'action_display', 'details', 'content_object_str'
        ]


class HomePageComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePageComponent
        fields = '__all__'


class SiteConfigurationSerializer(serializers.ModelSerializer):
    logo_url = serializers.FileField(source='logo', read_only=True)

    class Meta:
        model = SiteConfiguration
        fields = [
            'id', 'nombre_entidad_principal', 'nombre_entidad_secundaria',
            'nombre_secretaria', 'nombre_direccion', 'logo', 'logo_url',
            'direccion', 'horario_atencion', 'telefono_conmutador',
            'telefono_movil', 'linea_gratuita', 'linea_anticorrupcion',
            'correo_institucional', 'correo_notificaciones', 'social_facebook',
            'social_twitter', 'social_youtube', 'social_instagram',
            'seccion_publicaciones_activa', 'seccion_atractivos_activa',
            'seccion_prestadores_activa', 'google_maps_api_key'
        ]
        extra_kwargs = {
            'logo': {'write_only': True, 'required': False},
            'google_maps_api_key': {'write_only': True, 'required': False, 'allow_blank': True}
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['google_maps_api_key'] = "Configurada" if instance.google_maps_api_key else "No configurada"
        return ret


class MenuItemSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    class Meta:
        model = MenuItem
        fields = ['id', 'nombre', 'url', 'parent', 'orden', 'children']
    def get_children(self, obj):
        children = MenuItem.objects.filter(parent=obj).order_by('orden')
        if children.exists():
            return MenuItemSerializer(children, many=True, context=self.context).data
        return []


class ResenaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    class Meta:
        model = Resena
        fields = ['id', 'usuario_nombre', 'calificacion', 'comentario', 'fecha_creacion']


class ResenaCreateSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField()
    class Meta:
        model = Resena
        fields = ['calificacion', 'comentario', 'content_type', 'object_id']
    def validate(self, data):
        content_type_str = data['content_type'].lower()
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
        validated_data['usuario'] = self.context['request'].user
        instance, created = Resena.objects.get_or_create(
            usuario=validated_data['usuario'],
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            defaults={
                'calificacion': validated_data['calificacion'],
                'comentario': validated_data['comentario']
            }
        )
        if not created:
            instance.calificacion = validated_data['calificacion']
            instance.comentario = validated_data['comentario']
            instance.aprobada = False
            instance.save()
        return instance


# --------------------- Módulo de Verificación de Cumplimiento ---------------------

class ItemVerificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemVerificacion
        fields = ['id', 'texto_requisito', 'puntaje', 'orden', 'es_obligatorio']


class PlantillaVerificacionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantillaVerificacion
        fields = ['id', 'nombre', 'descripcion', 'categoria_prestador']


class PlantillaVerificacionDetailSerializer(PlantillaVerificacionListSerializer):
    items = ItemVerificacionSerializer(many=True, read_only=True)
    class Meta(PlantillaVerificacionListSerializer.Meta):
        fields = PlantillaVerificacionListSerializer.Meta.fields + ['items']


class RespuestaItemVerificacionReadSerializer(serializers.ModelSerializer):
    texto_requisito = serializers.CharField(source='item_original.texto_requisito', read_only=True)
    puntaje = serializers.IntegerField(source='item_original.puntaje', read_only=True)
    item_original_id = serializers.IntegerField(source='item_original.id', read_only=True)
    class Meta:
        model = RespuestaItemVerificacion
        fields = ['id', 'item_original_id', 'texto_requisito', 'puntaje', 'cumple', 'justificacion']


class RespuestaItemVerificacionWriteSerializer(serializers.ModelSerializer):
    item_original_id = serializers.PrimaryKeyRelatedField(queryset=ItemVerificacion.objects.all(), source='item_original')
    class Meta:
        model = RespuestaItemVerificacion
        fields = ['item_original_id', 'cumple', 'justificacion']


class VerificacionListSerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla_usada.nombre', read_only=True)
    funcionario_nombre = serializers.CharField(source='funcionario_evaluador.username', read_only=True)
    class Meta:
        model = Verificacion
        fields = ['id', 'fecha_visita', 'puntaje_obtenido', 'plantilla_nombre', 'funcionario_nombre']


class VerificacionDetailSerializer(serializers.ModelSerializer):
    respuestas_items = RespuestaItemVerificacionReadSerializer(many=True, read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla_usada.nombre', read_only=True)
    prestador_nombre = serializers.CharField(source='prestador.nombre_negocio', read_only=True)
    funcionario_nombre = serializers.CharField(source='funcionario_evaluador.username', read_only=True)
    class Meta:
        model = Verificacion
        fields = [
            'id', 'fecha_visita', 'puntaje_obtenido', 'observaciones_generales',
            'recomendaciones', 'plantilla_usada', 'plantilla_nombre', 'prestador',
            'prestador_nombre', 'funcionario_evaluador', 'funcionario_nombre',
            'respuestas_items'
        ]


class IniciarVerificacionSerializer(serializers.Serializer):
    plantilla_id = serializers.PrimaryKeyRelatedField(queryset=PlantillaVerificacion.objects.all())
    prestador_id = serializers.PrimaryKeyRelatedField(queryset=PrestadorServicio.objects.all())


class GuardarVerificacionSerializer(serializers.ModelSerializer):
    respuestas_items = RespuestaItemVerificacionWriteSerializer(many=True)
    class Meta:
        model = Verificacion
        fields = [
            'id', 'fecha_visita', 'observaciones_generales', 'recomendaciones', 'respuestas_items'
        ]
        read_only_fields = ['id']
    @transaction.atomic
    def update(self, instance, validated_data):
        respuestas_data = validated_data.pop('respuestas_items')
        instance.fecha_visita = validated_data.get('fecha_visita', instance.fecha_visita)
        instance.observaciones_generales = validated_data.get('observaciones_generales', instance.observaciones_generales)
        instance.recomendaciones = validated_data.get('recomendaciones', instance.recomendaciones)
        puntaje_actual = 0
        instance.respuestas_items.all().delete()
        for respuesta_data in respuestas_data:
            item = respuesta_data['item_original']
            cumple = respuesta_data['cumple']
            RespuestaItemVerificacion.objects.create(
                verificacion=instance,
                item_original=item,
                cumple=cumple,
                justificacion=respuesta_data.get('justificacion', '')
            )
            if cumple:
                puntaje_actual += item.puntaje
        instance.puntaje_obtenido = puntaje_actual
        instance.save()
        prestador = instance.prestador
        puntaje_total_prestador = sum(v.puntaje_obtenido for v in prestador.verificaciones_recibidas.all())
        prestador.puntuacion_total = puntaje_total_prestador
        prestador.save()
        return instance


# --------------------- Módulo de Capacitaciones ---------------------

class AsistenciaCapacitacionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_rol = serializers.CharField(source='usuario.get_role_display', read_only=True)
    class Meta:
        model = AsistenciaCapacitacion
        fields = ['id', 'usuario', 'usuario_nombre', 'usuario_rol', 'fecha_asistencia']


class CapacitacionDetailSerializer(PublicacionDetailSerializer):
    asistentes = AsistenciaCapacitacionSerializer(many=True, read_only=True)
    class Meta(PublicacionDetailSerializer.Meta):
        fields = PublicacionDetailSerializer.Meta.fields + ['puntos_asistencia', 'asistentes']


class RegistrarAsistenciaSerializer(serializers.Serializer):
    asistentes_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de los usuarios (Prestadores o Artesanos) que asistieron."
    )
    def validate_asistentes_ids(self, ids):
        usuarios = CustomUser.objects.filter(
            id__in=ids,
            role__in=[CustomUser.Role.PRESTADOR, CustomUser.Role.ARTESANO]
        )
        if len(usuarios) != len(set(ids)):
            raise serializers.ValidationError("Uno o más IDs de usuario son inválidos o no corresponden a un Prestador/Artesano.")
        return ids
    def save(self, **kwargs):
        capacitacion_id = self.context['view'].kwargs.get('pk')
        try:
            capacitacion = Publicacion.objects.get(pk=capacitacion_id, tipo=Publicacion.Tipo.CAPACITACION)
        except Publicacion.DoesNotExist:
            raise serializers.ValidationError({"capacitacion_id": "La capacitación especificada no existe."})
        asistentes_ids = self.validated_data['asistentes_ids']
        with transaction.atomic():
            usuarios_a_registrar = CustomUser.objects.filter(id__in=asistentes_ids)
            AsistenciaCapacitacion.objects.filter(capacitacion=capacitacion).delete()
            asistencias_a_crear = [
                AsistenciaCapacitacion(capacitacion=capacitacion, usuario=usuario)
                for usuario in usuarios_a_registrar
            ]
            AsistenciaCapacitacion.objects.bulk_create(asistencias_a_crear)
        return {"status": "success", "message": f"Se ha registrado la asistencia para {len(asistentes_ids)} usuarios."}


# --------------------- Módulo de Puntuación ---------------------

class ScoringRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoringRule
        fields = '__all__'


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ['id', 'mensaje', 'leido', 'fecha_creacion', 'url']


# --- Serializador para la Configuración de IA del Usuario ---

class AIConfigSerializer(serializers.ModelSerializer):
    """
    Serializador para que un usuario gestione su configuración personal de IA.
    La clave de API es de solo escritura por seguridad.
    """
    class Meta:
        model = CustomUser
        fields = ['ai_provider', 'api_key']
        extra_kwargs = {
            'api_key': {'write_only': True, 'required': False, 'allow_blank': True, 'style': {'input_type': 'password'}}
        }

    def update(self, instance, validated_data):
        # La lógica de la vista asegura que el usuario solo puede actualizar su propia instancia.
        instance.ai_provider = validated_data.get('ai_provider', instance.ai_provider)

        # Solo actualiza la clave de API si se proporciona una nueva.
        if 'api_key' in validated_data and validated_data['api_key']:
            instance.api_key = validated_data['api_key']

        instance.save(update_fields=['ai_provider', 'api_key'])
        return instance


# --- Serializador para Configuración LLM de Usuario ---

class UserLLMConfigSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    api_key_masked = serializers.SerializerMethodField()

    class Meta:
        model = UserLLMConfig
        fields = ['provider', 'api_key', 'api_key_masked', 'updated_at']
        read_only_fields = ['updated_at', 'api_key_masked']

    def get_api_key_masked(self, obj):
        if obj.api_key:
            return f"{obj.api_key[:5]}...{obj.api_key[-4:]}"
        return "No configurada"

    def update(self, instance, validated_data):
        instance.api_key = validated_data.get('api_key', instance.api_key)
        instance.provider = validated_data.get('provider', instance.provider)
        instance.save()
        return instance