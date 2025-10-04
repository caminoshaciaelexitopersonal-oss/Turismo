from typing import TypedDict, Any, Callable
from langgraph.graph import StateGraph, END

# --- ESTADO GENÉRICO DEL TENIENTE ---

class GenericLieutenantState(TypedDict):
    """La pizarra táctica para un Teniente Genérico."""
    captain_order: str
    app_context: Any
    final_report: str
    error: str | None

# --- CONSTRUCTOR DEL TENIENTE GENÉRICO (PATRÓN FACTORY) ---

def get_generic_lieutenant_graph(
    sargento_builder: Callable[[], Any],
    teniente_name: str
) -> Callable:
    """
    Construye y compila un agente Teniente Supervisor genérico.

    Este patrón es una 'fábrica de tenientes'. En lugar de crear un archivo de teniente
    para cada sargento que solo necesita delegación directa, usamos esta función.

    Args:
        sargento_builder: La función que construye al sargento (ej. get_gestion_videos_sargento_graph).
        teniente_name: El nombre de la unidad del teniente para los logs (ej. "Videos").

    Returns:
        Un agente LangGraph compilado y listo para usar.
    """

    # --- PUESTO DE MANDO: INSTANCIA DEL SARGENTO PASADO COMO PARÁMETRO ---
    sargento_agent = sargento_builder()

    # --- NODOS DEL GRAFO SUPERVISOR ---

    async def delegate_to_sargento(state: GenericLieutenantState) -> GenericLieutenantState:
        """
        (NODO ÚNICO DE EJECUCIÓN) Delega la misión completa al Sargento especialista proporcionado.
        """
        order = state['captain_order']
        print(f"--- 🫡 TENIENTE GENÉRICO ({teniente_name}): Delegando misión al Sargento -> '{order}' ---")
        try:
            result = await sargento_agent.ainvoke({
                "teniente_order": order,
                "app_context": state.get('app_context')
            })
            report_from_sargento = result.get("final_report", "El Sargento completó la misión sin un reporte detallado.")
            state["final_report"] = report_from_sargento
        except Exception as e:
            error_message = f"Misión fallida bajo el mando del Sargento de {teniente_name}. Razón: {e}"
            state["error"] = error_message
        return state

    async def compile_report(state: GenericLieutenantState) -> GenericLieutenantState:
        """(NODO FINAL) Prepara el informe final para el Capitán."""
        if state.get("error"):
            state["final_report"] = state["error"]
        return state

    # --- ENSAMBLAJE DEL GRAFO ---
    workflow = StateGraph(GenericLieutenantState)
    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_final_report", compile_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_final_report")
    workflow.add_edge("compile_final_report", END)

    print(f"✅ Doctrina aplicada: Teniente Supervisor Genérico para '{teniente_name}' compilado y listo.")
    return workflow.compile()