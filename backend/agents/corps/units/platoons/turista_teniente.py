from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos al comandante de escuadra: el Sargento especialista ---
from .squads.gestion_turista_sargento import get_gestion_turista_sargento_graph

class TuristaLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Asistencia al Turista."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: INSTANCIA DE SU SARGENTO ---
turista_sargento_agent = get_gestion_turista_sargento_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL TENIENTE ---

async def delegate_to_sargento(state: TuristaLieutenantState) -> TuristaLieutenantState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Sargento de Asistencia al Turista.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE TURISTAS: Recibida orden. Delegando misión al Sargento -> '{order}' ---")
    try:
        result = await turista_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_sargento
        print(f"--- ✔️ TENIENTE DE TURISTAS: El Sargento reporta misión cumplida. ---")
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Sargento de Turistas. Razón: {e}"
        print(f"--- ❌ TENIENTE DE TURISTAS: El Sargento reportó un error crítico: {error_message} ---")
        state["error"] = error_message
    return state

async def compile_report(state: TuristaLieutenantState) -> TuristaLieutenantState:
    """(NODO FINAL) Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    print("--- 📄 TENIENTE DE TURISTAS: Informe para el Capitán de Turistas listo. ---")
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_turista_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Asistencia al Turista.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(TuristaLieutenantState)

    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)

    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Teniente Supervisor de Turistas compilado y listo.")
    return workflow.compile()