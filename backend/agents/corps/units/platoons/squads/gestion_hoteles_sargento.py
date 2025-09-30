from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_prestador import PrestadorSoldiers
from typing import Any

def get_gestion_hoteles_sargento_builder():
    """
    Returns a builder function for the Hoteles Sargento agent.
    This sargento specializes in hotel-related operations.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        # The Hotel sargento commands the same squad as the general Prestador sargento for now.
        squad = PrestadorSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Hotelería")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Hotelería listo para el despliegue.")

    return build_sargento_agent