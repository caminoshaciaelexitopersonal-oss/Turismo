import os
import requests
import tiktoken
from dotenv import load_dotenv
from typing import List, Dict

# --- Importaciones de Django (se inicializan de forma segura) ---
try:
    from api.models import SiteConfiguration
    from .phi3_mini.phi3_service import invoke_phi3_mini
    DJANGO_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    # Esto permite que el archivo se importe en entornos donde Django no está configurado,
    # aunque las funciones que dependen de él fallarán.
    DJANGO_AVAILABLE = False
    # Mock para que el archivo no falle al importarse
    def invoke_phi3_mini(prompt: str) -> str:
        return "Error: Django no está disponible. No se puede invocar a Phi-3."

# Cargar variables de entorno
load_dotenv()

# --- Configuración de Modelos y Palabras Clave ---
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL_NAME = "llama3-8b-8192"
DEEP_REASONING_KEYWORDS = ["analiza", "resume", "explica", "corrige", "evalúa", "genera un reporte", "crea un plan"]

def count_tokens(text: str) -> int:
    """Calcula el número de tokens en un texto usando tiktoken."""
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception as e:
        print(f"Advertencia: No se pudo usar tiktoken. Usando conteo de palabras. Error: {e}")
        return len(text.split())

def requires_deep_reasoning(prompt: str) -> bool:
    """Verifica si el prompt contiene palabras clave que sugieren una tarea compleja."""
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in DEEP_REASONING_KEYWORDS)

def invoke_groq_api(prompt: str, api_key: str, conversation_history: List[Dict[str, str]]) -> str:
    """Envía un prompt y el historial a la API de Groq."""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    messages = conversation_history + [{"role": "user", "content": prompt}]
    data = {"model": GROQ_MODEL_NAME, "messages": messages, "temperature": 0.7}

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=90)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        return f"Error de conexión a la API de Groq: {e}"
    except (KeyError, IndexError, TypeError) as e:
        return f"Respuesta inesperada de la API de Groq: {response.text}. Error: {e}"

def route_llm_request(prompt: str, conversation_history: List[Dict[str, str]], user_api_key: str, user_provider: str) -> str:
    """
    Enruta una solicitud al LLM apropiado basado en el historial, la complejidad y la configuración del usuario.
    """
    if not DJANGO_AVAILABLE:
        return "Error: El entorno de Django no está configurado. No se puede enrutar la solicitud."

    # 1. Obtener el umbral de tokens desde la configuración del sitio
    try:
        config = SiteConfiguration.load()
        token_threshold = config.llm_routing_token_threshold
    except Exception as e:
        print(f"Advertencia: No se pudo cargar SiteConfiguration. Usando umbral por defecto (1500). Error: {e}")
        token_threshold = 1500

    # 2. Calcular la longitud total del historial
    history_text = " ".join([msg["content"] for msg in conversation_history])
    total_tokens = count_tokens(history_text + prompt)

    # 3. Determinar si la tarea es compleja
    is_complex_task = requires_deep_reasoning(prompt)

    # 4. Lógica de enrutamiento
    use_groq = False
    if total_tokens > token_threshold:
        print(f"[LLM Router] Historial largo ({total_tokens} tokens > umbral de {token_threshold}). Escalando a modelo avanzado.")
        use_groq = True
    elif is_complex_task:
        print(f"[LLM Router] Tarea compleja detectada (palabra clave encontrada). Escalando a modelo avanzado.")
        use_groq = True

    if use_groq:
        if user_provider == 'GROQ' and user_api_key:
            print("[LLM Router] Usando modelo en la nube: Groq.")
            return invoke_groq_api(prompt, user_api_key, conversation_history)
        else:
            print("[LLM Router] Se requiere modelo avanzado, pero Groq no está configurado. Haciendo fallback a modelo local.")
            return invoke_phi3_mini(prompt)
    else:
        print(f"[LLM Router] Tarea simple ({total_tokens} tokens). Usando modelo local: Phi-3 Mini.")
        return invoke_phi3_mini(prompt)

# --- Bloque de prueba para ejecución directa ---
if __name__ == '__main__':
    # Este bloque solo funcionará si se ejecuta en un entorno donde Django está configurado.
    # Para ejecutarlo: python -m backend.ai_models.llm_router
    if DJANGO_AVAILABLE:
        print("--- Probando el Router LLM Avanzado ---")

        mock_user_groq_key = os.getenv("GROQ_API_KEY_TEST", "gsk_...")
        mock_user_provider = "GROQ"
        mock_history_short = [{"role": "user", "content": "Hola"}, {"role": "assistant", "content": "Hola, ¿en qué puedo ayudarte?"}]
        mock_history_long = [{"role": "user", "content": " ".join(["palabra"] * 700)}, {"role": "assistant", "content": " ".join(["respuesta"] * 700)}]

        # 1. Tarea simple, historial corto -> Phi-3
        print("\n--- Test 1: Tarea simple, historial corto ---")
        route_llm_request("¿Cuál es la capital de Colombia?", mock_history_short, mock_user_groq_key, mock_user_provider)

        # 2. Tarea simple, historial largo -> Groq
        print("\n--- Test 2: Tarea simple, historial largo ---")
        route_llm_request("¿Cuál es la capital de Colombia?", mock_history_long, mock_user_groq_key, mock_user_provider)

        # 3. Tarea compleja, historial corto -> Groq
        print("\n--- Test 3: Tarea compleja, historial corto ---")
        route_llm_request("Analiza las ventajas del turismo sostenible.", mock_history_short, mock_user_groq_key, mock_user_provider)

        print("\n--- Pruebas del Router LLM Avanzado completadas ---")
    else:
        print("No se puede ejecutar el bloque de prueba porque el entorno de Django no está disponible.")