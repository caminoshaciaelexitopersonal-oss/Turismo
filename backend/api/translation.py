from modeltranslation.translator import register, TranslationOptions
from .models import (
    Publicacion,
    AtractivoTuristico,
    PaginaInstitucional,
    ContenidoMunicipio,
    HechoHistorico,
    CategoriaPrestador,
    RubroArtesano,
    PrestadorServicio,
    Artesano,
    Video,
    ConsejoConsultivo
)

@register(Publicacion)
class PublicacionTranslationOptions(TranslationOptions):
    fields = ('titulo', 'contenido')

@register(AtractivoTuristico)
class AtractivoTuristicoTranslationOptions(TranslationOptions):
    fields = ('nombre', 'descripcion', 'como_llegar', 'horario_funcionamiento', 'tarifas', 'recomendaciones', 'accesibilidad', 'informacion_contacto')

@register(PaginaInstitucional)
class PaginaInstitucionalTranslationOptions(TranslationOptions):
    fields = ('titulo_banner', 'subtitulo_banner', 'contenido_principal', 'programas_proyectos', 'estrategias_apoyo', 'politicas_locales', 'convenios_asociaciones', 'informes_resultados')

@register(ContenidoMunicipio)
class ContenidoMunicipioTranslationOptions(TranslationOptions):
    fields = ('titulo', 'contenido')

@register(HechoHistorico)
class HechoHistoricoTranslationOptions(TranslationOptions):
    fields = ('titulo', 'descripcion')

@register(CategoriaPrestador)
class CategoriaPrestadorTranslationOptions(TranslationOptions):
    fields = ('nombre',)

@register(RubroArtesano)
class RubroArtesanoTranslationOptions(TranslationOptions):
    fields = ('nombre',)

@register(PrestadorServicio)
class PrestadorServicioTranslationOptions(TranslationOptions):
    fields = ('descripcion', 'promociones_ofertas')

@register(Artesano)
class ArtesanoTranslationOptions(TranslationOptions):
    fields = ('descripcion',)

@register(Video)
class VideoTranslationOptions(TranslationOptions):
    fields = ('titulo', 'descripcion')

@register(ConsejoConsultivo)
class ConsejoConsultivoTranslationOptions(TranslationOptions):
    fields = ('titulo', 'contenido')