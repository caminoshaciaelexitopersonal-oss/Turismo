from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_agencias import get_agencias_soldiers

def get_gestion_agencias_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Agencias de Viajes compilado.

    Este sargento es un especialista que comanda la escuadra de herramientas
    para gestionar agencias de viajes, una categoría específica de prestadores.
    """
    squad = get_agencias_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Agencias de Viajes")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Agencias de Viajes compilado y listo.")
    return sargento_agent