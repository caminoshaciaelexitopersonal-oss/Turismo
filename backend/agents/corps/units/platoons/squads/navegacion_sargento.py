from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_navegacion import get_navigation_soldiers

def get_navegacion_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Navegación compilado.

    Este sargento comanda a la escuadra de herramientas geoespaciales,
    responsable de encontrar lugares, obtener direcciones y localizar usuarios.
    """
    # Reclutar a los "soldados" (herramientas) de navegación
    squad = get_navigation_soldiers()

    # Construir el agente usando el constructor base
    builder = SargentoGraphBuilder(squad, squad_name="Navegación Geoespacial")

    sargento_agent = builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Navegación compilado y listo.")
    return sargento_agent