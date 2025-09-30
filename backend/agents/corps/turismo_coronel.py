from typing import TypedDict, List
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from importlib import import_module
from langchain_openai import ChatOpenAI
from functools import partial

# --- DEFINICIÓN DEL ESTADO Y EL PLAN TÁCTICO DEL CORONEL ---

class CaptainTask(BaseModel):
    """Define una misión táctica clara para ser asignada a un Capitán."""
    task_description: str = Field(description="La descripción específica y detallada de la misión para el Capitán.")
    responsible_captain: str = Field(description="El Capitán especialista (ej: Prestadores, Atractivos, Admin, etc.).")

class TacticalPlan(BaseModel):
    """El plan táctico completo generado por el Coronel."""
    plan: List[CaptainTask] = Field(description="La lista de misiones tácticas secuenciales para cumplir la orden.")

class TurismoColonelState(TypedDict):
    """La pizarra táctica del Coronel de Turismo."""
    general_order: str
    tactical_plan: TacticalPlan | None
    task_queue: List[CaptainTask]
    completed_missions: list
    final_report: str
    error: str | None

# --- NODOS DEL GRAFO DE MANDO DEL CORONEL ---

async def create_tactical_plan(state: TurismoColonelState) -> TurismoColonelState:
    """
    (NODO 1: PLANIFICADOR TÁCTICO)
    Si hay un LLM disponible, lo usamos. De lo contrario, devolvemos un plan simulado.
    """
    print(f"--- 🧠 CORONEL DE TURISMO: Creando Plan Táctico para '{state['general_order']}' ---")

    try:
        structured_llm = ChatOpenAI(model="gpt-4o", temperature=0).with_structured_output(TacticalPlan)
        plan = await structured_llm.ainvoke(
            f"""
            Eres el Coronel de Turismo. Tu misión es asignar la orden "{state['general_order']}" 
            al Capitán especialista más adecuado.
            Responde en JSON válido con el plan táctico.
            """
        )
    except Exception as e:
        print(f"[WARN] LLM no disponible. Usando plan simulado. Error: {e}")
        plan = TacticalPlan(plan=[
            CaptainTask(task_description=state["general_order"], responsible_captain="Prestadores")
        ])

    state.update({
        "tactical_plan": plan,
        "task_queue": plan.plan.copy(),
        "completed_missions": [],
        "error": None
    })
    return state

def route_to_captain(state: TurismoColonelState):
    """(NODO 2: ENRUTADOR DE MANDO) Selecciona el Capitán según la próxima misión."""
    if state.get("error") or not state["task_queue"]:
        return "compile_report"
    return f"{state['task_queue'][0].responsible_captain.lower()}_captain"

async def generic_captain_node(
    state: TurismoColonelState,
    captain_module_name: str,
    captain_graph_func: str,
    captain_name: str
) -> TurismoColonelState:
    """(NODO DE DELEGACIÓN) Invoca dinámicamente el sub-grafo del Capitán adecuado."""
    mission = state["task_queue"].pop(0)
    print(f"--- 🔽 CORONEL: Delegando a CAP. {captain_name.upper()} -> '{mission.task_description}' ---")
    try:
        # La ruta debe ser relativa al directorio 'backend', que es la raíz del proyecto Django.
        module_path = f"agents.corps.units.{captain_module_name}"
        module = import_module(module_path)
        get_captain_graph = getattr(module, captain_graph_func)
        captain_agent = get_captain_graph()
        result = await captain_agent.ainvoke({"coronel_order": mission.task_description})
        state["completed_missions"].append({
            "captain": captain_name,
            "mission": mission.task_description,
            "report": result.get("final_report", "Sin reporte.")
        })
    except Exception as e:
        state["error"] = f"Error al ejecutar Capitán {captain_name}: {e}"
    return state

async def compile_final_report(state: TurismoColonelState) -> TurismoColonelState:
    """(NODO FINAL) Compila los reportes de todos los Capitanes."""
    if state.get("error"):
        state["final_report"] = f"Misión fallida. Razón: {state['error']}"
    else:
        report_body = "\n".join([
            f"- Reporte del Capitán de {m['captain']}:\n  Misión: '{m['mission']}'\n  Resultado: {m['report']}"
            for m in state["completed_missions"]
        ])
        state["final_report"] = f"Misión de la División de Turismo completada.\nResumen de Operaciones:\n{report_body}"
    return state

# --- ENSAMBLAJE DEL GRAFO DE MANDO DEL CORONEL ---

def get_turismo_coronel_graph():
    """Construye y compila el agente LangGraph para el Coronel de Turismo."""
    workflow = StateGraph(TurismoColonelState)

    workflow.add_node("planner", create_tactical_plan)
    workflow.add_node("router", lambda s: s)

    # Definimos Capitanes disponibles
    captain_nodes_map = {
        "prestadores_captain": ("prestadores_captain", "get_prestadores_captain_graph", "Prestadores"),
        "atractivos_captain": ("atractivos_captain", "get_atractivos_captain_graph", "Atractivos"),
        "publicaciones_captain": ("publicaciones_captain", "get_publicaciones_captain_graph", "Publicaciones"),
        "admin_captain": ("admin_captain", "get_admin_captain_graph", "Admin"),
        "turista_captain": ("turista_captain", "get_turista_captain_graph", "Turista"),
        "funcionario_captain": ("funcionario_captain", "get_funcionario_captain_graph", "Funcionario"),
        "videos_captain": ("videos_captain", "get_videos_captain_graph", "Videos"),
        "artesanos_captain": ("artesanos_captain", "get_artesanos_captain_graph", "Artesanos"),
        "oferta_captain": ("oferta_captain", "get_oferta_captain_graph", "Oferta"),
    }

    for node_name, (module, func, display) in captain_nodes_map.items():
        workflow.add_node(
            node_name,
            # Usamos partial para pre-configurar la función asíncrona con sus argumentos
            partial(generic_captain_node, captain_module_name=module, captain_graph_func=func, captain_name=display)
        )

    workflow.add_node("compiler", compile_final_report)

    # Configuración de flujo
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")

    conditional_map = {name: name for name in captain_nodes_map.keys()}
    conditional_map["compile_report"] = "compiler"
    workflow.add_conditional_edges("router", route_to_captain, conditional_map)

    for node_name in captain_nodes_map.keys():
        workflow.add_edge(node_name, "router")

    workflow.add_edge("compiler", END)
    return workflow.compile()