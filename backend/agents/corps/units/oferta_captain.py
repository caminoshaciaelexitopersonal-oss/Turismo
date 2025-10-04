from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos la fábrica de Tenientes Genéricos y el constructor del Sargento a comandar ---
from .platoons.teniente_generico import get_generic_lieutenant_graph
from .platoons.squads.gestion_oferta_sargento import get_gestion_oferta_sargento_graph

class OfertaCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Oferta Turística."""
    coronel_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DEL TENIENTE ---
# Usamos la fábrica para crear un Teniente Supervisor que comanda al Sargento de Oferta.
oferta_teniente_agent = get_generic_lieutenant_graph(
    sargento_builder=get_gestion_oferta_sargento_graph,
    teniente_name="Oferta Turística"
)

# --- NODOS DEL GRAFO SUPERVISOR DEL CAPITÁN ---

async def delegate_to_lieutenant(state: OfertaCaptainState) -> OfertaCaptainState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Teniente de Oferta Turística.
    """
    order = state['coronel_order']
    print(f"--- 🫡 CAP. OFERTA: Recibida orden. Delegando a TTE. OFERTA -> '{order}' ---")
    try:
        result = await oferta_teniente_agent.ainvoke({
            "captain_order": order,
            "app_context": state.get('app_context')
        })
        report_from_lieutenant = result.get("final_report", "El Teniente completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_lieutenant
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Teniente de Oferta Turística. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_final_report(state: OfertaCaptainState) -> OfertaCaptainState:
    """(NODO FINAL) Prepara el informe final para el Coronel."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_oferta_captain_graph():
    """
    Construye y compila el agente LangGraph para el Capitán de Oferta Turística.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(OfertaCaptainState)
    workflow.add_node("delegate_mission", delegate_to_lieutenant)
    workflow.add_node("compile_final_report", compile_final_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Capitán Supervisor de Oferta Turística compilado y listo.")
    return workflow.compile()