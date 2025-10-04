from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_admin import get_admin_soldiers

def get_gestion_admin_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Administración General compilado.

    Este sargento comanda la escuadra de herramientas administrativas de más alto nivel,
    como la gestión de usuarios, configuración del sitio y la visualización de logs.
    """
    squad = get_admin_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Administración General")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Administración General compilado y listo.")
    return sargento_agent