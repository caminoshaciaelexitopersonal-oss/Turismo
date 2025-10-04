from langchain_core.tools import tool
from typing import List, Dict
from api.models import PrestadorServicio, DetallesHotel
from django.core.exceptions import ObjectDoesNotExist

@tool
def actualizar_detalles_hotel(prestador_id: int, ocupacion_nacional: int, ocupacion_internacional: int) -> Dict:
    """
    (SOLDADO ESPECIALISTA EN HOTELES) Actualiza los detalles específicos para un prestador de tipo hotel,
    como los reportes de ocupación. Si los detalles no existen, los crea.
    """
    print(f"--- 💥 SOLDADO (Hoteles): ¡ACCIÓN! Actualizando detalles para el prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        if prestador.categoria.slug != 'hoteles':
            return {"status": "error", "message": "Esta operación solo es válida para prestadores de la categoría 'hoteles'."}

        detalles, created = DetallesHotel.objects.get_or_create(prestador=prestador)
        detalles.reporte_ocupacion_nacional = ocupacion_nacional
        detalles.reporte_ocupacion_internacional = ocupacion_internacional
        detalles.save()

        accion = "creados" if created else "actualizados"
        return {"status": "success", "message": f"Detalles de hotel para '{prestador.nombre_negocio}' {accion} correctamente."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado: {e}"}


def get_hoteles_soldiers() -> List:
    """
    Recluta y devuelve la Escuadra especialista de Hoteles.
    """
    return [
        actualizar_detalles_hotel,
    ]