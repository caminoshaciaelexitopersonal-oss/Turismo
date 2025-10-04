from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

# --- Importamos al comandante de escuadra: el Sargento especialista ---
from .squads.gestion_artesanos_sargento import get_gestion_artesanos_sargento_graph

class ArtesanosLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Artesanos."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- PUESTO DE MANDO DEL TENIENTE: INSTANCIA DE SU SARGENTO ---
# El Teniente conoce y confía en su suboficial principal.
artesanos_sargento_agent = get_gestion_artesanos_sargento_graph()

# --- NODOS DEL GRAFO SUPERVISOR DEL TENIENTE ---

async def delegate_to_sargento(state: ArtesanosLieutenantState) -> ArtesanosLieutenantState:
    """
    (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Sargento especialista.
    El Teniente define la misión y confía en su Sargento para la planificación y ejecución.
    """
    order = state['captain_order']
    print(f"--- 🫡 TENIENTE DE ARTESANOS: Recibida orden. Delegando misión al Sargento -> '{order}' ---")
    try:
        # El Teniente invoca el grafo completo del Sargento, pasándole la orden y el contexto.
        result = await artesanos_sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": state.get('app_context')
        })
        report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
        state["final_report"] = report_from_sargento
        print(f"--- ✔️ TENIENTE DE ARTESANOS: El Sargento reporta misión cumplida. ---")
    except Exception as e:
        error_message = f"Misión fallida bajo el mando del Sargento de Artesanos. Razón: {e}"
        print(f"--- ❌ TENIENTE DE ARTESANOS: El Sargento reportó un error crítico: {error_message} ---")
        state["error"] = error_message
    return state

async def compile_report(state: ArtesanosLieutenantState) -> ArtesanosLieutenantState:
    """(NODO FINAL) Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    print("--- 📄 TENIENTE DE ARTESANOS: Informe para el Capitán de Artesanos listo. ---")
    return state

# --- ENSAMBLAJE DEL GRAFO SUPERVISOR ---

def get_artesanos_teniente_graph():
    """
    Construye y compila el agente LangGraph para el Teniente de Artesanos.
    Sigue el patrón "Supervisor" de delegación directa.
    """
    workflow = StateGraph(ArtesanosLieutenantState)

    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)

    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print("✅ Doctrina aplicada: Teniente Supervisor de Artesanos compilado y listo.")
    return workflow.compile()