from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_publicaciones import PublicacionesSoldiers
from typing import Any

def get_gestion_publicaciones_sargento_builder():
    """
    Returns a builder function for the Publicaciones Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = PublicacionesSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Publicaciones")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Publicaciones listo para el despliegue.")

    return build_sargento_agent