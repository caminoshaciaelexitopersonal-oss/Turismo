from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_funcionario import FuncionarioSoldiers
from typing import Any

def get_gestion_funcionario_sargento_builder():
    """
    Returns a builder function for the Funcionario Sargento agent.
    """
    def build_sargento_agent(api_client: Any):
        """Builds the sargento's compiled graph."""

        squad = FuncionarioSoldiers(api_client).get_all_soldiers()

        builder = SargentoGraphBuilder(squad, squad_name="Gestión de Funcionarios")
        return builder.build_graph()

    print("✅ Doctrina aplicada: Sargento de Gestión de Funcionarios listo para el despliegue.")

    return build_sargento_agent