from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_restaurantes import get_restaurantes_soldiers
from tools.herramientas_prestador import get_prestador_soldiers

def get_gestion_restaurantes_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Restaurantes compilado.

    Este sargento comanda un arsenal combinado: las herramientas generales de
    prestadores y las herramientas específicas para restaurantes (como la gestión
    de menús o promociones especiales).
    """
    squad = get_prestador_soldiers() + get_restaurantes_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Restaurantes")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Restaurantes compilado y listo.")
    return sargento_agent