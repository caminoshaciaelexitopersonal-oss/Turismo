from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_prestador import get_prestador_soldiers

def get_gestion_prestador_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Prestadores compilado.

    Este sargento recibe misiones de su teniente relacionadas con la gestión
    de perfiles de prestadores de servicios turísticos. Utiliza a su escuadra
    de soldados para crear perfiles, actualizar datos, gestionar galerías,
    y manejar el estado de aprobación.
    """
    # 1. Reclutar la escuadra de soldados especialistas
    squad = get_prestador_soldiers()

    # 2. Usar el constructor estandarizado para crear el agente
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Prestadores")

    # 3. Construir y compilar el grafo
    sargento_agent = builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Prestadores compilado y listo.")

    # 4. Devolver el agente listo para ser usado por el Teniente
    return sargento_agent