from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_turista import get_turista_soldiers

def get_gestion_turista_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Asistencia al Turista compilado.

    Este sargento comanda a la escuadra de soldados que interactúan con los turistas.
    Sus misiones incluyen buscar información, gestionar la lista 'Mi Viaje',
    recibir reseñas y procesar sugerencias.
    """
    squad = get_turista_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Asistencia al Turista")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Asistencia al Turista compilado y listo.")
    return sargento_agent