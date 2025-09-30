from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_oferta import OfertaSoldiers
from typing import Any

def get_gestion_oferta_sargento_builder():
    """
    Returns a builder function for the Oferta Turística Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = OfertaSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Oferta Turística")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Oferta Turística listo para el despliegue.")

    return build_sargento_agent