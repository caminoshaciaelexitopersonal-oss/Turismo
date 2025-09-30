from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_atractivos import AtractivosSoldiers
from typing import Any

def get_gestion_atractivos_sargento_builder():
    """
    Returns a builder function for the Atractivos Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph using the provided api_client."""

        squad = AtractivosSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Atractivos")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Atractivos listo para el despliegue.")

    return build_sargento_agent