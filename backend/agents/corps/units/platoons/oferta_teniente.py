from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from agents.corps.units.platoons.squads.gestion_oferta_sargento import get_gestion_oferta_sargento_builder

class OfertaLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Oferta Turística."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: CONSTRUCTOR DEL SARGENTO ---
oferta_sargento_builder = get_gestion_oferta_sargento_builder()

async def delegate_to_sargento(state: OfertaLieutenantState) -> OfertaLieutenantState:
    """
    Construye y delega la misión al Sargento especialista en ofertas.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE OFERTA TURÍSTICA: Recibida orden. Construyendo y delegando misión al Sargento -> '{order}' ---")
    try:
        api_client = state.get('app_context')
        oferta_sargento_agent = oferta_sargento_builder(api_client)

        result = await oferta_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        state["final_report"] = result.get("final_report", "El Sargento de Oferta Turística completó la misión sin un reporte detallado.")
    except Exception as e:
        state["error"] = f"Misión fallida bajo el mando del Sargento de Oferta Turística. Razón: {e}"
    return state

async def compile_report(state: OfertaLieutenantState) -> OfertaLieutenantState:
    """Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

def get_oferta_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Oferta Turística.
    """
    workflow = StateGraph(OfertaLieutenantState)
    workflow.add_node("delegate_mission_to_sargento", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)
    workflow.set_entry_point("delegate_mission_to_sargento")
    workflow.add_edge("delegate_mission_to_sargento", "compile_final_report")
    workflow.add_edge("compile_final_report", END)
    return workflow.compile()