from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_videos import get_videos_soldiers

def get_gestion_videos_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Videos compilado.

    Este sargento comanda la escuadra de herramientas para gestionar la
    sección de videos de la plataforma, permitiendo agregar, actualizar y
    publicar contenido de YouTube.
    """
    squad = get_videos_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Videos")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Videos compilado y listo.")
    return sargento_agent