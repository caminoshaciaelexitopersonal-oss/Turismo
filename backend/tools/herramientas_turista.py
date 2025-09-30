from langchain_core.tools import tool
from typing import Any, List, Dict

class TuristaSoldiers:
    """
    El arsenal de herramientas de ejecución (la escuadra de Soldados)
    para las operaciones del rol Turista.
    """
    def __init__(self, api_client: Any):
        self.api = api_client

    @tool
    def guardar_elemento_en_mi_viaje(self, usuario_id: int, tipo_contenido: str, objeto_id: int) -> Dict:
        """
        (SOLDADO DE MI VIAJE) Guarda un elemento (como un atractivo o una publicación)
        en la lista de favoritos 'Mi Viaje' de un usuario.
        'tipo_contenido' debe ser 'atractivoturistico' o 'publicacion'.
        'usuario_id' es el ID del turista que guarda el elemento.
        'objeto_id' es el ID del atractivo o publicación a guardar.
        """
        print(f"--- 💥 SOLDADO (Turista): ¡ACCIÓN! Usuario {usuario_id} guardando {tipo_contenido} con ID {objeto_id} en 'Mi Viaje'. ---")
        # Lógica de API simulada para crear un ElementoGuardado
        return {"status": "success", "message": f"El elemento {tipo_contenido} con ID {objeto_id} ha sido guardado en 'Mi Viaje'."}

    def get_all_soldiers(self) -> List:
        """ Recluta y devuelve la Escuadra de Turistas completa. """
        return [
            self.guardar_elemento_en_mi_viaje,
        ]