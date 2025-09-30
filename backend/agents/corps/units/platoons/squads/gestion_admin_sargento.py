from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_admin import AdminSoldiers
from typing import Any

def get_gestion_admin_sargento_builder():
    """
    Returns a builder function for the Admin Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = AdminSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión Administrativa")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Administración listo para el despliegue.")

    return build_sargento_agent