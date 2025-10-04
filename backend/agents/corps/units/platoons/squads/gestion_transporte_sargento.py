from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_transporte import get_transporte_soldiers
from tools.herramientas_prestador import get_prestador_soldiers

def get_gestion_transporte_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Transporte compilado.

    Este sargento comanda un arsenal combinado: las herramientas generales de
    prestadores y las herramientas específicas para empresas de transporte
    (como la gestión de flotas o rutas).
    """
    squad = get_prestador_soldiers() + get_transporte_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Transporte")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Transporte compilado y listo.")
    return sargento_agent