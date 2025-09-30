from typing import TypedDict, Any, List
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

class LieutenantTask(BaseModel):
    task_description: str
    responsible_lieutenant: str

class LieutenantPlan(BaseModel):
    plan: List[LieutenantTask]

class ArtesanosCaptainState(TypedDict):
    coronel_order: str
    lieutenant_plan: LieutenantPlan | None
    task_queue: List[LieutenantTask]
    completed_missions: list
    final_report: str
    error: str | None

async def create_lieutenant_plan(state: ArtesanosCaptainState) -> ArtesanosCaptainState:
    print("--- 🧠 CAP. ARTESANOS: Creando Plan de Pelotón... ---")
    # For now, we simulate the plan, as the captain's role is direct delegation.
    plan_simulado = LieutenantPlan(plan=[
        LieutenantTask(
            task_description=state['coronel_order'],
            responsible_lieutenant='Artesanos'
        )
    ])
    state.update({"lieutenant_plan": plan_simulado, "task_queue": plan_simulado.plan.copy(), "completed_missions": []})
    return state

def route_to_lieutenant(state: ArtesanosCaptainState):
    if state.get("error") or not state["task_queue"]:
        return "compile_report"
    return "artesanos_lieutenant"

async def artesanos_node(state: ArtesanosCaptainState) -> ArtesanosCaptainState:
    """Carga perezosamente al Teniente de Artesanos y le delega la misión."""
    from agents.corps.units.platoons.artesanos_teniente import get_artesanos_teniente_graph
    lieutenant_agent = get_artesanos_teniente_graph()

    mission = state["task_queue"].pop(0)
    print(f"--- 🔽 CAPITÁN: Delegando a TTE. ARTESANOS -> '{mission.task_description}' ---")
    result = await lieutenant_agent.ainvoke({"captain_order": mission.task_description, "app_context": state.get("app_context")})
    state["completed_missions"].append({"lieutenant": "Artesanos", "report": result.get("final_report", "Sin reporte.")})
    return state

async def compile_final_report(state: ArtesanosCaptainState) -> ArtesanosCaptainState:
    if state.get("error"):
        state["final_report"] = state["error"]
    else:
        report_body = "\n".join([f"- Reporte del Tte. de {m['lieutenant']}: {m['report']}" for m in state["completed_missions"]])
        state["final_report"] = f"Misión de gestión de Artesanos completada. Resumen:\n{report_body}"
    return state

def get_artesanos_captain_graph():
    workflow = StateGraph(ArtesanosCaptainState)
    workflow.add_node("planner", create_lieutenant_plan)
    workflow.add_node("router", lambda s: s)
    workflow.add_node("artesanos_lieutenant", artesanos_node)
    workflow.add_node("compiler", compile_final_report)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")
    workflow.add_conditional_edges(
        "router",
        route_to_lieutenant,
        {
            "artesanos_lieutenant": "artesanos_lieutenant",
            "compile_report": "compiler"
        }
    )
    workflow.add_edge("artesanos_lieutenant", "router")
    workflow.add_edge("compiler", END)
    return workflow.compile()