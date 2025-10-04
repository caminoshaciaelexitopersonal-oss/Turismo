from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos la fábrica de Tenientes Genéricos y el constructor del Sargento a comandar ---
from .platoons.teniente_generico import get_generic_lieutenant_graph
from .platoons.squads.gestion_publicaciones_sargento import get_gestion_publicaciones_sargento_graph

class PublicacionesCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Publicaciones."""
    coronel_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DEL TENIENTE ---
# Usamos la fábrica para crear un Teniente Supervisor que comanda al Sargento de Publicaciones.
publicaciones_teniente_agent = get_generic_lieutenant_graph(
    sargento_builder=get_gestion_publicaciones_sargento_graph,
    teniente_name="Publicaciones"
)

# --- NODOS DEL GRAFO SUPERVISOR DEL CAPITÁN ---

async def delegate_to_lieutenant(state: PublicacionesCaptainState) -> PublicacionesCaptainState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Teniente de Publicaciones.
    """
    order = state['coronel_order']
    print(f"--- 🫡 CAP. PUBLICACIONES: Recibida orden. Delegando a TTE. PUBLICACIONES -> '{order}' ---")
    try:
        result = await publicaciones_teniente_agent.ainvoke({
            "captain_order": order,
            "app_context": state.get('app_context')
        })
        report_from_lieutenant = result.get("final_report", "El Teniente completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_lieutenant
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Teniente de Publicaciones. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_final_report(state: PublicacionesCaptainState) -> PublicacionesCaptainState:
    """(NODO FINAL) Prepara el informe final para el Coronel."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_publicaciones_captain_graph():
    """
    Construye y compila el agente LangGraph para el Capitán de Publicaciones.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(PublicacionesCaptainState)
    workflow.add_node("delegate_mission", delegate_to_lieutenant)
    workflow.add_node("compile_final_report", compile_final_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Capitán Supervisor de Publicaciones compilado y listo.")
    return workflow.compile()