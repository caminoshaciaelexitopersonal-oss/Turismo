from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_hoteles import get_hoteles_soldiers
from tools.herramientas_prestador import get_prestador_soldiers

def get_gestion_hoteles_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Hoteles compilado.

    Este sargento es un especialista que comanda un arsenal combinado: las
    herramientas generales de prestadores y las herramientas específicas para
    hoteles (como la gestión de la ocupación).
    """
    # El arsenal de este sargento es la combinación de dos escuadras
    squad = get_prestador_soldiers() + get_hoteles_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Hoteles")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Hoteles compilado y listo.")
    return sargento_agent