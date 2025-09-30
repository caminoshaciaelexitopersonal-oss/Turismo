from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_prestador import get_prestador_soldiers
from typing import Any

def get_gestion_prestador_sargento_builder():
    """
    Devuelve una función (builder) que puede construir el agente sargento.
    Sigue el patrón factory/builder.
    """
    def build_sargento_agent():
        """Construye el grafo del Sargento."""
        # El Sargento recluta a su escuadra de soldados especialistas
        squad = get_prestador_soldiers()

        # Construye el grafo de mando usando la plantilla estandarizada
        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Prestadores")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Prestadores listo para el despliegue.")

    # Devuelve la función constructora, no el agente compilado.
    return build_sargento_agent