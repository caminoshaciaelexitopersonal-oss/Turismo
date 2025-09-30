from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_turista import TuristaSoldiers
from typing import Any

def get_gestion_turista_sargento_builder():
    """
    Returns a builder function for the Turista Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = TuristaSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Turistas")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Turistas listo para el despliegue.")

    return build_sargento_agent