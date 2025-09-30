from typing import TypedDict, Any, Callable
from langgraph.graph import StateGraph, END
from importlib import import_module

class GenericLieutenantState(TypedDict):
    """
    La pizarra táctica para el Teniente Genérico.
    Es universal para cualquier tipo de misión.
    """
    captain_order: str
    app_context: Any
    # --- Parámetros de Configuración de la Misión ---
    sargento_builder_path: str # ej. 'agents.corps.units.platoons.squads.gestion_hoteles_sargento.get_gestion_hoteles_sargento_builder'
    sargento_name: str       # ej. 'Hotelería'
    # --- Resultados ---
    final_report: str
    error: str | None

async def delegate_to_sargento(state: GenericLieutenantState) -> GenericLieutenantState:
    """
    (NODO DE EJECUCIÓN) Carga dinámicamente el constructor del sargento correcto,
    lo construye y le delega la misión.
    """
    order = state['captain_order']
    sargento_builder_path = state['sargento_builder_path']
    sargento_name = state['sargento_name']

    print(f"--- 🫡 TENIENTE GENÉRICO: Recibida orden para {sargento_name}. Delegando -> '{order}' ---")

    try:
        # Carga dinámica del constructor del sargento
        path_parts = sargento_builder_path.split('.')
        module_path = ".".join(path_parts[:-1])
        func_name = path_parts[-1]

        module = import_module(module_path)
        sargento_builder = getattr(module, func_name)

        # Construcción del agente sargento
        api_client = state.get('app_context')
        sargento_agent = sargento_builder()(api_client) # Llama al builder para obtener el agente

        # Invocación del sargento
        result = await sargento_agent.ainvoke({
            "teniente_order": order,
            "app_context": api_client
        })
        state["final_report"] = result.get("final_report", f"El Sargento de {sargento_name} completó la misión sin un reporte detallado.")

    except Exception as e:
        state["error"] = f"Misión fallida bajo el mando del Sargento de {sargento_name}. Razón: {e}"

    return state

async def compile_report(state: GenericLieutenantState) -> GenericLieutenantState:
    """Prepara el informe final para el Capitán."""
    if state.get("error"):
        state["final_report"] = state["error"]
    return state

def get_generic_lieutenant_graph():
    """
    Construye y compila el agente LangGraph para el Teniente Genérico.
    Este grafo es reutilizable por cualquier Capitán.
    """
    workflow = StateGraph(GenericLieutenantState)
    workflow.add_node("delegate_mission", delegate_to_sargento)
    workflow.add_node("compile_report", compile_report)
    workflow.set_entry_point("delegate_mission")
    workflow.add_edge("delegate_mission", "compile_report")
    workflow.add_edge("compile_report", END)
    return workflow.compile()