from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_artesanos import get_artesano_soldiers

def get_gestion_artesanos_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Artesanos compilado.

    Este sargento comanda a la escuadra responsable de gestionar los perfiles de
    los artesanos, incluyendo su creación, actualización de datos, manejo de
    galerías y estado de aprobación.
    """
    squad = get_artesano_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Artesanos")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Artesanos compilado y listo.")
    return sargento_agent