from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos la fábrica de Tenientes Genéricos y el constructor del Sargento a comandar ---
from .platoons.teniente_generico import get_generic_lieutenant_graph
from .platoons.squads.gestion_atractivos_sargento import get_gestion_atractivos_sargento_graph

class AtractivosCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Atractivos Turísticos."""
    coronel_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DEL TENIENTE ---
# Usamos la fábrica para crear un Teniente Supervisor que comanda al Sargento de Atractivos.
atractivos_teniente_agent = get_generic_lieutenant_graph(
    sargento_builder=get_gestion_atractivos_sargento_graph,
    teniente_name="Atractivos Turísticos"
)

# --- NODOS DEL GRAFO SUPERVISOR DEL CAPITÁN ---

async def delegate_to_lieutenant(state: AtractivosCaptainState) -> AtractivosCaptainState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Teniente de Atractivos Turísticos.
    """
    order = state['coronel_order']
    print(f"--- 🫡 CAP. ATRACTIVOS: Recibida orden. Delegando a TTE. ATRACTIVOS -> '{order}' ---")
    try:
        result = await atractivos_teniente_agent.ainvoke({
            "captain_order": order,
            "app_context": state.get('app_context')
        })
        report_from_lieutenant = result.get("final_report", "El Teniente completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_lieutenant
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Teniente de Atractivos. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_final_report(state: AtractivosCaptainState) -> AtractivosCaptainState:
    """(NODO FINAL) Prepara el informe final para el Coronel."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_atractivos_captain_graph():
    """
    Construye y compila el agente LangGraph para el Capitán de Atractivos Turísticos.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(AtractivosCaptainState)
    workflow.add_node("delegate_mission", delegate_to_lieutenant)
    workflow.add_node("compile_final_report", compile_final_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Capitán Supervisor de Atractivos Turísticos compilado y listo.")
    return workflow.compile()