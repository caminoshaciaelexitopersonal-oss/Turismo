from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_oferta import get_oferta_soldiers

def get_gestion_oferta_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Oferta Turística compilado.

    Este sargento comanda la escuadra de herramientas para crear y gestionar
    elementos de la oferta turística, como las rutas que agrupan atractivos
    y prestadores.
    """
    squad = get_oferta_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Oferta Turística")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Oferta Turística compilado y listo.")
    return sargento_agent