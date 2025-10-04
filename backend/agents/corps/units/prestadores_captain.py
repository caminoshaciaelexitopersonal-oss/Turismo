from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos el Pelotón que este Capitán comanda ---
from .platoons.prestadores_teniente import get_prestadores_teniente_graph

class PrestadorCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Prestadores."""
    coronel_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DEL TENIENTE ---
prestadores_teniente_agent = get_prestadores_teniente_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL CAPITÁN ---

async def delegate_to_lieutenant(state: PrestadorCaptainState) -> PrestadorCaptainState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Teniente de Prestadores.
    El Capitán actúa como un supervisor directo para su pelotón.
    """
    order = state['coronel_order']
    print(f"--- 🫡 CAP. PRESTADORES: Recibida orden. Delegando a TTE. PRESTADORES -> '{order}' ---")
    try:
        result = await prestadores_teniente_agent.ainvoke({
            "captain_order": order,
            "app_context": state.get('app_context')
        })
        report_from_lieutenant = result.get("final_report", "El Teniente completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_lieutenant
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Teniente de Prestadores. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_final_report(state: PrestadorCaptainState) -> PrestadorCaptainState:
    """(NODO FINAL) Prepara el informe final para el Coronel."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_prestadores_captain_graph():
    """
    Construye y compila el agente LangGraph para el Capitán de Prestadores.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(PrestadorCaptainState)
    workflow.add_node("delegate_mission", delegate_to_lieutenant)
    workflow.add_node("compile_final_report", compile_final_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Capitán Supervisor de Prestadores compilado y listo.")
    return workflow.compile()