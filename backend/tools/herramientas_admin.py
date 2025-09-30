from langchain_core.tools import tool
from typing import Any, List, Dict

class AdminSoldiers:
    """
    El arsenal de herramientas de ejecución (la escuadra de Soldados)
    para las operaciones Administrativas y de Moderación.
    """
    def __init__(self, api_client: Any):
        self.api = api_client

    @tool
    def aprobar_prestador_servicio(self, prestador_id: int, motivo: str) -> Dict:
        """
        (SOLDADO DE MODERACIÓN) Ejecuta la aprobación de un perfil de Prestador de Servicio
        que estaba pendiente de revisión.
        'motivo' es una breve justificación de la aprobación para la bitácora de auditoría.
        Devuelve el estado de la operación.
        """
        print(f"--- 💥 SOLDADO (Admin): ¡ACCIÓN! Aprobando prestador con ID {prestador_id}. Motivo: {motivo}. ---")
        # Lógica de API simulada
        # prestador = self.api.get_prestador(prestador_id)
        # prestador.aprobado = True
        # prestador.save()
        return {"status": "success", "message": f"Prestador {prestador_id} ha sido aprobado y ahora es visible públicamente."}

    def get_all_soldiers(self) -> List:
        """ Recluta y devuelve la Escuadra de Administración completa. """
        return [
            self.aprobar_prestador_servicio,
        ]