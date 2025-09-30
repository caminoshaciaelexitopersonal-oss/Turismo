from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from agents.corps.units.platoons.squads.gestion_prestador_sargento import get_gestion_prestador_sargento_builder

class PrestadoresLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Prestadores."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: CONSTRUCTOR DEL SARGENTO ---
prestador_sargento_builder = get_gestion_prestador_sargento_builder()

# --- NODOS DEL GRAFO SUPERVISOR DEL TENIENTE ---

async def delegate_to_sargento(state: PrestadoresLieutenantState) -> PrestadoresLieutenantState:
    """
    (NODO DE EJECUCIÓN) Construye y delega la misión al Sargento especialista.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE PRESTADORES: Recibida orden. Construyendo y delegando misión al Sargento -> '{order}' ---")
    try:
        # 1. Construir al Sargento. Ya no necesita el api_client.
        prestador_sargento_agent = prestador_sargento_builder()

        # 2. El Teniente invoca el grafo completo del Sargento, pasándole la orden.
        result = await prestador_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_sargento
        print(f"--- ✔️ TENIENTE DE PRESTADORES: El Sargento reporta misión cumplida. ---")
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Sargento de Prestadores. Razón: {e}"
        print(f"--- ❌ TENIENTE DE PRESTADORES: El Sargento reportó un error crítico: {error_message} ---")
        state["error"] = error_message
    return state

async def compile_report(state: PrestadoresLieutenantState) -> PrestadoresLieutenantState:
    """(NODO FINAL) Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    print("--- 📄 TENIENTE DE PRESTADORES: Informe para el Capitán de Prestadores listo. ---")
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_prestadores_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Prestadores.
    """
    workflow = StateGraph(PrestadoresLieutenantState)

    workflow.add_node("delegate_mission_to_sargento", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)

    workflow.set_entry_point("delegate_mission_to_sargento")
    workflow.add_edge("delegate_mission_to_sargento", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    return workflow.compile()