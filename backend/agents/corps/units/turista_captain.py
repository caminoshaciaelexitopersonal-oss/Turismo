from typing import TypedDict, Any, List
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from agents.corps.units.platoons.teniente_generico import get_generic_lieutenant_graph

class LieutenantTask(BaseModel):
    task_description: str
    responsible_lieutenant: str

class LieutenantPlan(BaseModel):
    plan: List[LieutenantTask]

class TuristaCaptainState(TypedDict):
    coronel_order: str
    lieutenant_plan: LieutenantPlan | None
    task_queue: List[LieutenantTask]
    completed_missions: list
    final_report: str
    error: str | None

async def create_lieutenant_plan(state: TuristaCaptainState) -> TuristaCaptainState:
    print("--- 🧠 CAP. TURISTAS: Creando Plan de Pelotón (SIMULADO)... ---")
    plan = LieutenantPlan(plan=[
        LieutenantTask(task_description=state['coronel_order'], responsible_lieutenant='Turista')
    ])
    state.update({"lieutenant_plan": plan, "task_queue": plan.plan.copy(), "completed_missions": []})
    return state

def route_to_lieutenant(state: TuristaCaptainState):
    if state.get("error") or not state["task_queue"]:
        return "compile_report"
    return "delegate_to_generic_lieutenant"

async def delegate_node(state: TuristaCaptainState) -> TuristaCaptainState:
    """
    Invoca al Teniente Genérico, configurándolo para que comande al Sargento de Turistas.
    """
    mission = state["task_queue"].pop(0)
    lieutenant_name = mission.responsible_lieutenant
    sargento_module_name = "gestion_turista_sargento"

    print(f"--- 🚀 CAPITÁN TURISTA: Delegando a TTE. GENÉRICO para comandar a Sgto. de {lieutenant_name} -> '{mission.task_description}' ---")

    generic_lieutenant_agent = get_generic_lieutenant_graph()

    try:
        result = await generic_lieutenant_agent.ainvoke({
            "captain_order": mission.task_description,
            "app_context": state.get("app_context"),
            "sargento_builder_path": f"agents.corps.units.platoons.squads.{sargento_module_name}.get_{sargento_module_name}_builder",
            "sargento_name": lieutenant_name
        })
        state["completed_missions"].append({"lieutenant": lieutenant_name, "report": result.get("final_report", "Sin reporte.")})
    except Exception as e:
        state["error"] = f"Error durante la delegación al Teniente Genérico para {lieutenant_name}: {e}"
    return state

async def compile_final_report(state: TuristaCaptainState) -> TuristaCaptainState:
    if state.get("error"):
        state["final_report"] = state["error"]
    else:
        report_body = "\n".join([f"- Reporte del Tte. de {m['lieutenant']}: {m['report']}" for m in state["completed_missions"]])
        state["final_report"] = f"Misión de gestión de Turistas completada. Resumen:\n{report_body}"
    return state

def get_turista_captain_graph():
    workflow = StateGraph(TuristaCaptainState)
    workflow.add_node("planner", create_lieutenant_plan)
    workflow.add_node("router", lambda s: s)
    workflow.add_node("delegate_to_generic_lieutenant", delegate_node)
    workflow.add_node("compiler", compile_final_report)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")
    workflow.add_conditional_edges(
        "router",
        route_to_lieutenant,
        {
            "delegate_to_generic_lieutenant": "delegate_to_generic_lieutenant",
            "compile_report": "compiler"
        }
    )
    workflow.add_edge("delegate_to_generic_lieutenant", "router")
    workflow.add_edge("compiler", END)
    return workflow.compile()