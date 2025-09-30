from typing import TypedDict, Any, List
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

class LieutenantTask(BaseModel):
    task_description: str
    responsible_lieutenant: str

class LieutenantPlan(BaseModel):
    plan: List[LieutenantTask]

class FuncionarioCaptainState(TypedDict):
    coronel_order: str
    lieutenant_plan: LieutenantPlan | None
    task_queue: List[LieutenantTask]
    completed_missions: list
    final_report: str
    error: str | None

async def create_lieutenant_plan(state: FuncionarioCaptainState) -> FuncionarioCaptainState:
    print("--- 🧠 CAP. FUNCIONARIOS: Creando Plan de Pelotón (SIMULADO)... ---")
    plan_simulado = LieutenantPlan(plan=[
        LieutenantTask(
            task_description=state['coronel_order'],
            responsible_lieutenant='Funcionario'
        )
    ])
    state.update({"lieutenant_plan": plan_simulado, "task_queue": plan_simulado.plan.copy(), "completed_missions": []})
    return state

def route_to_lieutenant(state: FuncionarioCaptainState):
    if state.get("error") or not state["task_queue"]:
        return "compile_report"

    lieutenant_unit = state["task_queue"][0].responsible_lieutenant
    if lieutenant_unit == 'Funcionario':
        return "funcionario_lieutenant"

    state["error"] = f"Planificación defectuosa: Teniente '{lieutenant_unit}' desconocido."
    return "route_to_lieutenant"

async def funcionario_node(state: FuncionarioCaptainState) -> FuncionarioCaptainState:
    """Carga perezosamente al Teniente de Funcionarios y le delega la misión."""
    from agents.corps.units.platoons.funcionario_teniente import get_funcionario_teniente_graph
    funcionario_lieutenant_agent = get_funcionario_teniente_graph()

    mission = state["task_queue"].pop(0)
    print(f"--- 🔽 CAPITÁN: Delegando a TTE. FUNCIONARIO -> '{mission.task_description}' ---")
    result = await funcionario_lieutenant_agent.ainvoke({"captain_order": mission.task_description})
    state["completed_missions"].append({"lieutenant": "Funcionario", "report": result.get("final_report", "Sin reporte.")})
    return state

async def compile_final_report(state: FuncionarioCaptainState) -> FuncionarioCaptainState:
    if state.get("error"):
        state["final_report"] = state["error"]
    else:
        report_body = "\n".join([f"- Reporte del Tte. de {m['lieutenant']}: {m['report']}" for m in state["completed_missions"]])
        state["final_report"] = f"Misión de gestión de Funcionarios completada. Resumen:\n{report_body}"
    return state

def get_funcionario_captain_graph():
    workflow = StateGraph(FuncionarioCaptainState)
    workflow.add_node("planner", create_lieutenant_plan)
    workflow.add_node("router", lambda s: s)
    workflow.add_node("funcionario_lieutenant", funcionario_node)
    workflow.add_node("compiler", compile_final_report)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")
    workflow.add_conditional_edges(
        "router",
        route_to_lieutenant,
        {
            "funcionario_lieutenant": "funcionario_lieutenant",
            "compile_report": "compiler",
            "route_to_lieutenant": "router"
        }
    )
    workflow.add_edge("funcionario_lieutenant", "router")
    workflow.add_edge("compiler", END)
    return workflow.compile()