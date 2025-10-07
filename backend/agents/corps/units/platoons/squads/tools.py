from langchain_core.tools import tool
from api.models import AtractivoTuristico

@tool
def list_atractivos_turisticos() -> str:
    """
    Devuelve una lista con los nombres de todos los atractivos turísticos registrados en el sistema.
    Es útil para obtener un resumen rápido del contenido disponible.
    """
    try:
        atractivos = AtractivoTuristico.objects.filter(es_publicado=True).values_list('nombre', flat=True)
        if not atractivos:
            return "No se encontraron atractivos turísticos publicados en el sistema."

        # Formatear la lista para que sea legible
        return "Aquí está la lista de atractivos turísticos:\n- " + "\n- ".join(atractivos)
    except Exception as e:
        return f"Ocurrió un error al consultar la base de datos: {e}"

# --- Aquí se pueden añadir más herramientas en el futuro ---
# Por ejemplo:
# @tool
# def get_atractivo_details(nombre: str) -> str:
#     """Busca los detalles de un atractivo turístico específico por su nombre."""
#     ...