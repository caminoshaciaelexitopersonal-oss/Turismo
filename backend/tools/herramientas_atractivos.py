from langchain_core.tools import tool
from typing import Any, List, Dict

class AtractivosSoldiers:
    """
    El arsenal de herramientas de ejecución (la escuadra de Soldados)
    para las operaciones de Atractivos Turísticos.
    """
    def __init__(self, api_client: Any):
        self.api = api_client

    @tool
    def crear_atractivo_turistico(self, nombre: str, descripcion: str, categoria_color: str, como_llegar: str) -> Dict:
        """
        (SOLDADO DE CREACIÓN) Ejecuta la creación de un nuevo atractivo turístico.
        'categoria_color' debe ser una de: 'AMARILLO', 'ROJO', 'BLANCO'.
        Devuelve el ID del nuevo atractivo.
        """
        print(f"--- 💥 SOLDADO (Atractivos): ¡ACCIÓN! Creando atractivo '{nombre}'. ---")
        # Lógica de API simulada
        return {"status": "success", "atractivo_id": 55, "message": f"Atractivo '{nombre}' creado con éxito."}

    @tool
    def agregar_imagen_atractivo(self, atractivo_id: int, url_imagen: str, alt_text: str) -> Dict:
        """
        (SOLDADO DE GALERÍA) Sube una nueva imagen a la galería de un atractivo turístico.
        """
        print(f"--- 💥 SOLDADO (Atractivos): ¡ACCIÓN! Agregando imagen a la galería del atractivo {atractivo_id}. ---")
        # Lógica de API simulada
        return {"status": "success", "image_id": 101, "message": "Imagen añadida a la galería del atractivo."}

    def get_all_soldiers(self) -> List:
        """ Recluta y devuelve la Escuadra de Atractivos completa. """
        return [
            self.crear_atractivo_turistico,
            self.agregar_imagen_atractivo,
        ]