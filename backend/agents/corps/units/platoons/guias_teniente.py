from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos al comandante de escuadra: el Sargento especialista ---
from .squads.gestion_guias_sargento import get_gestion_guias_sargento_graph

class GuiasLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Guías de Turismo."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: INSTANCIA DE SU SARGENTO ---
guias_sargento_agent = get_gestion_guias_sargento_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL TENIENTE ---

async def delegate_to_sargento(state: GuiasLieutenantState) -> GuiasLieutenantState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Sargento especialista en Guías de Turismo.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE GUÍAS: Recibida orden. Delegando misión al Sargento -> '{order}' ---")
    try:
        result = await guias_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_sargento
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Sargento de Guías. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_report(state: GuiasLieutenantState) -> GuiasLieutenantState:
    """(NODO FINAL) Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_guias_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Guías de Turismo.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(GuiasLieutenantState)
    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)
    print("✅ Doctrina aplicada: Teniente Supervisor de Guías de Turismo compilado y listo.")
    return workflow.compile()