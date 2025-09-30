from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_videos import VideosSoldiers
from typing import Any

def get_gestion_videos_sargento_builder():
    """
    Returns a builder function for the Videos Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = VideosSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Videos")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Videos listo para el despliegue.")

    return build_sargento_agent