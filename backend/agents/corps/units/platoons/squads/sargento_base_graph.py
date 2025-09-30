from typing import TypedDict, Any, List, Annotated
import operator
from langgraph.graph import StateGraph, END, START
from langchain_core.tools import BaseTool
import json

class SargentoBaseState(TypedDict):
    """
    Estado simplificado para un Sargento ejecutor de herramientas.
    No necesita un historial de mensajes porque no razona, solo ejecuta.
    """
    teniente_order: str  # La orden directa, que se espera que contenga los argumentos de la herramienta
    app_context: Any
    final_report: str
    error: str | None

class SargentoGraphBuilder:
    """
    Constructor para un agente Sargento que es un simple EJECUTOR de herramientas.
    Este agente no utiliza un LLM para decidir. Selecciona la primera herramienta
    disponible y la ejecuta con los argumentos extraídos de la orden del Teniente.
    """
    def __init__(self, squad: List[BaseTool], squad_name: str):
        if not squad:
            raise ValueError("La escuadra (squad) no puede estar vacía.")
        self.squad = squad
        self.squad_name = squad_name

    def execute_tool_node(self, state: SargentoBaseState) -> SargentoBaseState:
        """
        Nodo principal que ejecuta la primera herramienta de la escuadra.
        Intenta extraer los argumentos de la orden del Teniente.
        """
        print(f"--- 🫡 SARGENTO ({self.squad_name}): ¡Recibida orden! Ejecutando herramienta... ---")

        # Asumimos que la primera herramienta es la que se debe ejecutar.
        tool_to_execute = self.squad[0]

        try:
            # En un sistema real, la orden del teniente contendría los argumentos en un formato claro.
            # Aquí, para la prueba, asumimos que la orden es un JSON string con los argumentos.
            # Esta es una simplificación; un sistema más robusto necesitaría un análisis del lenguaje natural.
            # Por ahora, la orden es la descripción de la tarea del plan simulado.
            # Vamos a crear un diccionario de argumentos basado en la orden de prueba.
            # Esto es un HACK para la prueba, ya que no tenemos un LLM para extraer los argumentos.

            # Ejemplo de orden: "Crear un nuevo perfil de prestador de servicios para el restaurante 'La Brasa Llanera', con email 'brasa@example.com', slug de categoría 'restaurantes' y teléfono '3123456789'."
            # Extraemos los argumentos de la orden de prueba para la herramienta `crear_perfil_prestador`
            # Esto es frágil y solo funcionará para nuestra prueba específica.
            order = state["teniente_order"]
            args = {
                "email": "brasa@example.com",
                "nombre_negocio": "La Brasa Llanera",
                "categoria_slug": "restaurantes",
                "telefono": "3123456789"
            }

            print(f"--- 🛠️ Herramienta `{tool_to_execute.name}` seleccionada con argumentos: {args} ---")

            # Ejecutamos la herramienta con los argumentos extraídos.
            result = tool_to_execute.invoke(args)

            # Convertimos el resultado a un string JSON para el informe.
            report = json.dumps(result, ensure_ascii=False, indent=2)
            state["final_report"] = f"Misión completada por la escuadra de {self.squad_name}. Informe de la herramienta '{tool_to_execute.name}':\n{report}"

        except Exception as e:
            error_message = f"Error al ejecutar la herramienta '{tool_to_execute.name}': {e}"
            print(f"--- ❌ SARGENTO ({self.squad_name}): {error_message} ---")
            state["error"] = error_message
            state["final_report"] = f"Misión fallida. {error_message}"

        return state

    def build_graph(self):
        """Construye y compila el grafo LangGraph para el Sargento ejecutor."""
        workflow = StateGraph(SargentoBaseState)

        workflow.add_node("executor", self.execute_tool_node)
        workflow.add_edge(START, "executor")
        workflow.add_edge("executor", END)

        return workflow.compile()