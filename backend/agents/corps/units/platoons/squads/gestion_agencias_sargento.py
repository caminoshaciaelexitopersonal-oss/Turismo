from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_prestador import PrestadorSoldiers
from typing import Any

def get_gestion_agencias_sargento_builder():
    """
    Returns a builder function for the Agencias de Viajes Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = PrestadorSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Agencias de Viajes")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Agencias de Viajes listo para el despliegue.")

    return build_sargento_agent