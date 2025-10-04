from typing import TypedDict, Any, List
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

# --- Importamos a los comandantes de escuadra: los Sargentos Especialistas ---
from .squads.gestion_hoteles_sargento import get_gestion_hoteles_sargento_graph
from .squads.gestion_restaurantes_sargento import get_gestion_restaurantes_sargento_graph
from .squads.gestion_guias_sargento import get_gestion_guias_sargento_graph
from .squads.gestion_agencias_sargento import get_gestion_agencias_sargento_graph
from .squads.gestion_transporte_sargento import get_gestion_transporte_sargento_graph
from .squads.gestion_prestador_sargento import get_gestion_prestador_sargento_graph

# --- DEFINICIÓN DEL ESTADO Y EL PLAN TÁCTICO DEL TENIENTE ---

class SargentoTask(BaseModel):
    """Define una misión específica para ser asignada a un Sargento especialista."""
    task_description: str = Field(description="La descripción detallada de la misión para el Sargento.")
    responsible_sargento: str = Field(
        description="El Sargento especialista. Debe ser uno de: 'Hoteles', 'Restaurantes', 'Guias', 'Agencias', 'Transporte', 'Generico'."
    )

class SargentoPlan(BaseModel):
    """El plan de escuadra generado por el Teniente para cumplir la orden del Capitán."""
    plan: List[SargentoTask] = Field(description="La lista de misiones para los Sargentos.")

class PrestadoresLieutenantState(TypedDict):
    """La pizarra táctica del Teniente de Prestadores."""
    captain_order: str
    app_context: Any
    sargento_plan: SargentoPlan | None
    task_queue: List[SargentoTask]
    completed_missions: list
    final_report: str
    error: str | None

# --- PUESTO DE MANDO: INSTANCIACIÓN DE SARGENTOS ---
# Se instancian una sola vez para eficiencia
sargentos = {
    "Hoteles": get_gestion_hoteles_sargento_graph(),
    "Restaurantes": get_gestion_restaurantes_sargento_graph(),
    "Guias": get_gestion_guias_sargento_graph(),
    "Agencias": get_gestion_agencias_sargento_graph(),
    "Transporte": get_gestion_transporte_sargento_graph(),
    "Generico": get_gestion_prestador_sargento_graph(),
}

# --- NODOS DEL GRAFO ORQUESTADOR DEL TENIENTE ---

async def create_sargento_plan(state: PrestadoresLieutenantState) -> PrestadoresLieutenantState:
    """(NODO 1: PLANIFICADOR) Analiza la orden del Capitán y la descompone en misiones para los Sargentos especialistas."""
    print("--- 🧠 TTE. PRESTADORES: Creando Plan de Escuadra... ---")
    # Se instancia el LLM aquí para evitar errores de API Key al cargar el módulo
    llm = ChatOpenAI(api_key="test_key", model="gpt-4o", temperature=0, model_kwargs={"response_format": {"type": "json_object"}})
    structured_llm = llm.with_structured_output(SargentoPlan)
    prompt = f"""
Eres un Teniente de Prestadores de Servicios Turísticos. Tu Capitán te ha dado una orden.
Tu deber es descomponerla en un plan, asignando cada misión al Sargento especialista correcto.

Sargentos bajo tu mando y sus especialidades:
- 'Hoteles': Gestiona todo lo relacionado con hoteles, hostales, etc. (incluyendo perfiles y ocupación).
- 'Restaurantes': Gestiona restaurantes, cafés, etc. (incluyendo perfiles y menús).
- 'Guias': Gestiona guías de turismo y sus asociaciones.
- 'Agencias': Gestiona agencias de viajes.
- 'Transporte': Gestiona empresas de transporte turístico.
- 'Generico': Usa este sargento para tareas generales sobre prestadores que no encajan en una especialidad, como listar todas las categorías o realizar búsquedas amplias.

Analiza la orden de tu Capitán y genera el plan de escuadra en formato JSON:
"{state['captain_order']}"
"""
    try:
        plan = await structured_llm.ainvoke(prompt)
        state.update({
            "sargento_plan": plan,
            "task_queue": plan.plan.copy(),
            "completed_missions": [],
            "error": None
        })
        return state
    except Exception as e:
        state["error"] = f"No se pudo crear un plan de escuadra: {e}"; return state

def route_to_sargento(state: PrestadoresLieutenantState):
    """(NODO 2: ENRUTADOR) Lee la siguiente misión y dirige el flujo al Sargento correcto."""
    if state.get("error") or not state.get("task_queue"):
        return "compile_report"

    next_mission = state["task_queue"][0]
    sargento_unit = next_mission.responsible_sargento

    if sargento_unit in sargentos:
        return sargento_unit
    else:
        # Si el LLM alucina un sargento, se maneja el error y se continúa.
        state["error"] = f"Error de planificación: Sargento '{sargento_unit}' desconocido."
        state["task_queue"].pop(0)
        return "route_to_sargento"

# --- NODOS DE DELEGACIÓN DE MANDO (SUB-GRAFOS) ---

async def delegate_mission(state: PrestadoresLieutenantState, sargento_name: str) -> PrestadoresLieutenantState:
    """Función genérica para invocar a cualquier sargento."""
    mission = state["task_queue"].pop(0)
    print(f"--- 🫡 TTE. PRESTADORES: Delegando a SGTO. {sargento_name} -> '{mission.task_description}' ---")

    sargento_agent = sargentos[sargento_name]
    result = await sargento_agent.ainvoke({
        "teniente_order": mission.task_description,
        "app_context": state.get('app_context')
    })

    state["completed_missions"].append({
        "sargento": sargento_name,
        "mission": mission.task_description,
        "report": result.get("final_report", "Sin reporte detallado.")
    })
    return state

async def compile_final_report(state: PrestadoresLieutenantState) -> PrestadoresLieutenantState:
    """(NODO FINAL) Sintetiza los reportes de los Sargentos para el Capitán."""
    print("--- 📄 TTE. PRESTADORES: Compilando Informe para el Capitán... ---")
    if state.get("error"):
        state["final_report"] = f"Misión del pelotón fallida. Razón: {state['error']}"
    else:
        report_body = "\n".join([f"- Reporte del Sgto. de {m['sargento']}:\n  Misión: '{m['mission']}'\n  Resultado: {m['report']}" for m in state["completed_missions"]])
        state["final_report"] = f"Misión del pelotón de Prestadores completada.\nResumen de Operaciones:\n{report_body}"
    return state

# --- ENSAMBLAJE DEL GRAFO ORQUESTADOR DEL TENIENTE ---

def get_prestadores_teniente_graph():
    """Construye y compila el agente LangGraph para el Teniente de Prestadores."""
    workflow = StateGraph(PrestadoresLieutenantState)

    workflow.add_node("planner", create_sargento_plan)

    # Nodos de delegación para cada sargento
    for name in sargentos.keys():
        workflow.add_node(name, lambda state, s_name=name: delegate_mission(state, s_name))
        workflow.add_edge(name, "router")

    workflow.add_node("compiler", compile_final_report)
    workflow.add_node("router", lambda state: state) # Nodo 'passthrough' para el enrutador

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "router")

    workflow.add_conditional_edges("router", route_to_sargento, {
        **{name: name for name in sargentos.keys()}, # Rutas a cada sargento
        "compile_report": "compiler"
    })

    workflow.add_edge("compiler", END)

    print("✅ Doctrina aplicada: Teniente Orquestador de Prestadores compilado y listo.")
    return workflow.compile()