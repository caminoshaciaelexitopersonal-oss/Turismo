from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos al comandante de escuadra: el Sargento especialista ---
from .squads.gestion_transporte_sargento import get_gestion_transporte_sargento_graph

class TransporteLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Transporte Turístico."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: INSTANCIA DE SU SARGENTO ---
transporte_sargento_agent = get_gestion_transporte_sargento_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL TENIENTE ---

async def delegate_to_sargento(state: TransporteLieutenantState) -> TransporteLieutenantState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Sargento especialista en Transporte Turístico.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE TRANSPORTE: Recibida orden. Delegando misión al Sargento -> '{order}' ---")
    try:
        result = await transporte_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_sargento
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Sargento de Transporte. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_report(state: TransporteLieutenantState) -> TransporteLieutenantState:
    """(NODO FINAL) Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_transporte_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Transporte Turístico.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(TransporteLieutenantState)
    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)
    print("✅ Doctrina aplicada: Teniente Supervisor de Transporte Turístico compilado y listo.")
    return workflow.compile()