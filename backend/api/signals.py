from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import (
    Resena,
    Verificacion,
    AsistenciaCapacitacion,
    PrestadorServicio,
    Artesano,
    ScoringRule,
    RespuestaItemVerificacion
)

@receiver(post_save, sender=Resena)
def actualizar_puntuacion_por_resena(sender, instance, created, **kwargs):
    """
    Actualiza la puntuación de un Prestador o Artesano cuando se crea
    o actualiza una reseña aprobada.
    """
    if not instance.aprobada:
        return

    content_object = instance.content_object
    if not isinstance(content_object, (PrestadorServicio, Artesano)):
        return

    try:
        rules = ScoringRule.load()
        puntos_por_estrella = rules.puntos_por_estrella_reseña
    except ScoringRule.DoesNotExist:
        puntos_por_estrella = 2 # Valor por defecto si no hay reglas

    # Recalcular el total de puntos de reseñas para el objeto
    total_puntos_resenas = 0
    content_type = ContentType.objects.get_for_model(content_object)
    resenas_aprobadas = Resena.objects.filter(
        content_type=content_type,
        object_id=content_object.id,
        aprobada=True
    )

    for resena in resenas_aprobadas:
        total_puntos_resenas += resena.calificacion * puntos_por_estrella

    content_object.puntuacion_reseñas = total_puntos_resenas
    content_object.recalcular_puntuacion_total()


@receiver(post_save, sender=Verificacion)
def actualizar_puntuacion_por_verificacion(sender, instance, created, **kwargs):
    """
    Actualiza la puntuación de un Prestador de Servicio cuando se crea
    o actualiza una verificación.
    """
    prestador = instance.prestador

    # Primero, se calcula el puntaje de esta verificación específica
    puntaje_calculado = 0
    respuestas = RespuestaItemVerificacion.objects.filter(verificacion=instance, cumple=True)
    for respuesta in respuestas:
        puntaje_calculado += respuesta.item_original.puntaje

    # Se actualiza el puntaje_obtenido de la instancia de Verificacion
    # Se usa update para evitar recursión de la señal post_save
    Verificacion.objects.filter(pk=instance.pk).update(puntaje_obtenido=puntaje_calculado)

    # Ahora, se recalcula la puntuación total del prestador
    total_puntos_verificacion = 0
    verificaciones = Verificacion.objects.filter(prestador=prestador)

    for v in verificaciones:
        total_puntos_verificacion += v.puntaje_obtenido

    prestador.puntuacion_verificacion = total_puntos_verificacion
    prestador.recalcular_puntuacion_total()


@receiver(post_save, sender=AsistenciaCapacitacion)
def actualizar_puntuacion_por_capacitacion(sender, instance, created, **kwargs):
    """
    Actualiza la puntuación de un Prestador o Artesano cuando se registra
    la asistencia a una capacitación.
    """
    usuario = instance.usuario

    if hasattr(usuario, 'perfil_prestador'):
        entidad = usuario.perfil_prestador
    elif hasattr(usuario, 'perfil_artesano'):
        entidad = usuario.perfil_artesano
    else:
        return # El usuario no es ni prestador ni artesano

    try:
        rules = ScoringRule.load()
        puntos_base = rules.puntos_asistencia_capacitacion
    except ScoringRule.DoesNotExist:
        puntos_base = 10 # Valor por defecto

    # Recalcular el total de puntos por capacitación
    total_puntos_capacitacion = 0
    asistencias = AsistenciaCapacitacion.objects.filter(usuario=usuario)

    for asistencia in asistencias:
        # Usar los puntos definidos en la capacitación si existen, si no, los de las reglas
        puntos_otorgados = asistencia.capacitacion.puntos_asistencia if asistencia.capacitacion.puntos_asistencia > 0 else puntos_base
        total_puntos_capacitacion += puntos_otorgados

    entidad.puntuacion_capacitacion = total_puntos_capacitacion
    entidad.recalcular_puntuacion_total()

# --- Señales post_delete para mantener la consistencia ---

@receiver(post_delete, sender=AsistenciaCapacitacion)
def recalcular_puntuacion_al_borrar_asistencia(sender, instance, **kwargs):
    # Llama a la misma lógica de actualización para recalcular con un elemento menos
    actualizar_puntuacion_por_capacitacion(sender, instance, created=False, **kwargs)

@receiver(post_delete, sender=Verificacion)
def recalcular_puntuacion_al_borrar_verificacion(sender, instance, **kwargs):
    actualizar_puntuacion_por_verificacion(sender, instance, created=False, **kwargs)

@receiver(post_delete, sender=Resena)
def recalcular_puntuacion_al_borrar_resena(sender, instance, **kwargs):
    actualizar_puntuacion_por_resena(sender, instance, created=False, **kwargs)