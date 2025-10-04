from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos el Pelotón que este Capitán comanda ---
from .platoons.artesanos_teniente import get_artesanos_teniente_graph

class ArtesanoCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Artesanos."""
    coronel_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DEL TENIENTE ---
artesanos_teniente_agent = get_artesanos_teniente_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL CAPITÁN ---

async def delegate_to_lieutenant(state: ArtesanoCaptainState) -> ArtesanoCaptainState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Teniente de Artesanos.
    """
    order = state['coronel_order']
    print(f"--- 🫡 CAP. ARTESANOS: Recibida orden. Delegando a TTE. ARTESANOS -> '{order}' ---")
    try:
        result = await artesanos_teniente_agent.ainvoke({
            "captain_order": order,
            "app_context": state.get('app_context')
        })
        report_from_lieutenant = result.get("final_report", "El Teniente completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_lieutenant
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Teniente de Artesanos. Razón: {e}"
        state["error"] = error_message
    return state

async def compile_final_report(state: ArtesanoCaptainState) -> ArtesanoCaptainState:
    """(NODO FINAL) Prepara el informe final para el Coronel."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_artesanos_captain_graph():
    """
    Construye y compila el agente LangGraph para el Capitán de Artesanos.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(ArtesanoCaptainState)
    workflow.add_node("delegate_mission", delegate_to_lieutenant)
    workflow.add_node("compile_final_report", compile_final_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Capitán Supervisor de Artesanos compilado y listo.")
    return workflow.compile()