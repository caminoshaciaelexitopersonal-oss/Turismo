from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_atractivos import get_atractivos_soldiers

def get_gestion_atractivos_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Atractivos Turísticos compilado.

    Este sargento comanda a la escuadra responsable de crear, actualizar y publicar
    los atractivos turísticos de la plataforma, gestionando su información detallada
    y sus galerías de imágenes.
    """
    squad = get_atractivos_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Atractivos Turísticos")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Atractivos Turísticos compilado y listo.")
    return sargento_agent