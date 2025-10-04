from typing import TypedDict, Any, List
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

# --- Importamos los Pelotones (Tenientes) que este Capitán comanda ---
from .platoons.prestadores_teniente import get_prestadores_teniente_graph
from .platoons.artesanos_teniente import get_artesanos_teniente_graph
from .platoons.teniente_generico import get_generic_lieutenant_graph

# --- Importamos los constructores de Sargentos para los Tenientes Genéricos ---
from .platoons.squads.gestion_publicaciones_sargento import get_gestion_publicaciones_sargento_graph
from .platoons.squads.gestion_atractivos_sargento import get_gestion_atractivos_sargento_graph
from .platoons.squads.gestion_admin_sargento import get_gestion_admin_sargento_graph

# --- DEFINICIÓN DEL ESTADO Y EL PLAN TÁCTICO DEL CAPITÁN ---

class LieutenantTask(BaseModel):
    """Define una misión específica para ser asignada a un pelotón de Tenientes."""
    task_description: str = Field(description="La descripción detallada de la misión para el Teniente.")
    responsible_lieutenant: str = Field(
        description="El Teniente especialista. Debe ser uno de: 'Prestadores', 'Artesanos', 'Publicaciones', 'Atractivos', 'Admin'."
    )

class LieutenantPlan(BaseModel):
    """El plan de pelotón completo generado por el Capitán de Administración."""
    plan: List[LieutenantTask] = Field(description="La lista de misiones para los Tenientes.")

class AdminCaptainState(TypedDict):
    """La pizarra táctica del Capitán de Administración."""
    coronel_order: str
    app_context: Any
    lieutenant_plan: LieutenantPlan | None
    task_queue: List[LieutenantTask]
    completed_missions: list
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DE TENIENTES ---
# Se instancian una sola vez para eficiencia
tenientes = {
    "Prestadores": get_prestadores_teniente_graph(),
    "Artesanos": get_artesanos_teniente_graph(),
    "Publicaciones": get_generic_lieutenant_graph(get_gestion_publicaciones_sargento_graph, "Publicaciones"),
    "Atractivos": get_generic_lieutenant_graph(get_gestion_atractivos_sargento_graph, "Atractivos"),
    "Admin": get_generic_lieutenant_graph(get_gestion_admin_sargento_graph, "Admin"),
}

# --- NODOS DEL GRAFO DE MANDO DEL CAPITÁN ---

async def create_lieutenant_plan(state: AdminCaptainState) -> AdminCaptainState:
    """(NODO 1: PLANIFICADOR) Analiza la orden del Coronel y la descompone en misiones para los Tenientes."""
    print("--- 🧠 CAP. ADMIN: Creando Plan de Pelotón... ---")
    llm = ChatOpenAI(api_key="test_key", model="gpt-4o", temperature=0, model_kwargs={"response_format": {"type": "json_object"}})
    structured_llm = llm.with_structured_output(LieutenantPlan)
    prompt = f"""
Eres el Capitán de Administración de la plataforma de turismo. Tu Coronel te ha dado una orden.
Tu deber es descomponerla en un plan detallado, asignando cada misión a tu Teniente especialista.

Tenientes bajo tu mando y sus especialidades:
- 'Prestadores': Un teniente orquestador que comanda a todos los sargentos de prestadores (hoteles, restaurantes, etc.). Úsalo para cualquier tarea relacionada con la gestión de perfiles de prestadores.
- 'Artesanos': Un teniente supervisor para todas las tareas relacionadas con los artesanos.
- 'Publicaciones': Un teniente supervisor para crear, aprobar y gestionar noticias, eventos y blogs.
- 'Atractivos': Un teniente supervisor para crear, actualizar y publicar atractivos turísticos.
- 'Admin': Un teniente supervisor para tareas de administración del sitio: gestionar usuarios, cambiar la configuración general, moderar reseñas, etc.

Analiza la orden de tu Coronel y genera el plan de pelotón en formato JSON:
"{state['coronel_order']}"
"""
    try:
        plan = await structured_llm.ainvoke(prompt)
        state.update({
            "lieutenant_plan": plan,
            "task_queue": plan.plan.copy(),
            "completed_missions": [],
            "error": None
        })
        return state
    except Exception as e:
        state["error"] = f"No se pudo crear un plan de pelotón: {e}"; return state

def route_to_lieutenant(state: AdminCaptainState):
    """(NODO 2: ENRUTADOR) Lee la siguiente misión y dirige el flujo al Teniente correcto."""
    if state.get("error") or not state.get("task_queue"):
        return "compile_report"

    next_mission = state["task_queue"][0]
    lieutenant_unit = next_mission.responsible_lieutenant

    if lieutenant_unit in tenientes:
        return lieutenant_unit
    else:
        state["error"] = f"Error de planificación: Teniente '{lieutenant_unit}' desconocido."
        state["task_queue"].pop(0)
        return "route_to_lieutenant"

# --- NODOS DE DELEGACIÓN DE MANDO (SUB-GRAFOS) ---

async def delegate_mission(state: AdminCaptainState, teniente_name: str) -> AdminCaptainState:
    """Función genérica para invocar a cualquier teniente."""
    mission = state["task_queue"].pop(0)
    print(f"--- 🫡 CAP. ADMIN: Delegando a TTE. {teniente_name} -> '{mission.task_description}' ---")

    teniente_agent = tenientes[teniente_name]
    result = await teniente_agent.ainvoke({
        "captain_order": mission.task_description,
        "app_context": state.get('app_context')
    })

    state["completed_missions"].append({
        "lieutenant": teniente_name,
        "mission": mission.task_description,
        "report": result.get("final_report", "Sin reporte detallado.")
    })
    return state

async def compile_final_report(state: AdminCaptainState) -> AdminCaptainState:
    """(NODO FINAL) Sintetiza los reportes de los Tenientes para el Coronel."""
    print("--- 📄 CAP. ADMIN: Compilando Informe Táctico para el Coronel... ---")
    if state.get("error"):
        state["final_report"] = f"Misión de Administración fallida. Razón: {state['error']}"
    else:
        report_body = "\n".join([f"- Reporte del Tte. de {m['lieutenant']}:\n  Misión: '{m['mission']}'\n  Resultado: {m['report']}" for m in state["completed_missions"]])
        state["final_report"] = f"Misión de Administración completada.\nResumen de Operaciones:\n{report_body}"
    return state

# --- ENSAMBLAJE DEL GRAFO DE MANDO DEL CAPITÁN ---

def get_admin_captain_graph():
    """Construye y compila el agente LangGraph para el Capitán de Administración."""
    workflow = StateGraph(AdminCaptainState)

    workflow.add_node("planner", create_lieutenant_plan)

    for name in tenientes.keys():
        workflow.add_node(name, lambda state, t_name=name: delegate_mission(state, t_name))
        workflow.add_edge(name, "router")

    workflow.add_node("compiler", compile_final_report)
    workflow.add_node("router", lambda state: state)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")

    workflow.add_conditional_edges("router", route_to_lieutenant, {
        **{name: name for name in tenientes.keys()},
        "compile_report": "compiler"
    })

    workflow.add_edge("compiler", END)

    print("✅ Doctrina aplicada: Capitán Orquestador de Administración compilado y listo.")
    return workflow.compile()