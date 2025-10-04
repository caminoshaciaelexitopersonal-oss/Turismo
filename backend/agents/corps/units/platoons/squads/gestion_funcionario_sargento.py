from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_funcionario import get_funcionario_soldiers

def get_gestion_funcionario_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Funcionarios compilado.

    Este sargento comanda la escuadra de herramientas para las tareas específicas
    de los roles de funcionario, como la creación de contenido institucional
    o la revisión de perfiles.
    """
    squad = get_funcionario_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Funcionarios")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Funcionarios compilado y listo.")
    return sargento_agent