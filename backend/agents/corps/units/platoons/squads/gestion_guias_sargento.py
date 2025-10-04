from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_guias import get_guias_soldiers

def get_gestion_guias_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Guías de Turismo compilado.

    Este sargento es un especialista que comanda la escuadra de herramientas
    para gestionar guías de turismo, una categoría específica de prestadores.
    """
    squad = get_guias_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Guías de Turismo")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Guías de Turismo compilado y listo.")
    return sargento_agent