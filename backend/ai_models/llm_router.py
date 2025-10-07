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

def route_llm_request(prompt: str, conversation_history: List[Dict[str, str]], user) -> str:
    """
    Enruta una solicitud al LLM apropiado, priorizando la configuración personalizada del usuario.
    """
    if not DJANGO_AVAILABLE:
        return "Error: El entorno de Django no está configurado. No se puede enrutar la solicitud."

    # 1. Verificar si el usuario tiene una configuración personalizada y activa
    if user and hasattr(user, 'llm_config'):
        config = user.llm_config
        if config.provider == 'GROQ' and config.api_key:
            print(f"🔑 [LLM Router] Usando Groq personalizado del usuario {user.username}.")
            return invoke_groq_api(prompt, config.api_key, conversation_history)
        elif config.provider == 'PHI3_LOCAL':
            print(f"⚙️ [LLM Router] Usando modelo local Phi-3 Mini (configuración de usuario) para {user.username}.")
            return invoke_phi3_mini(prompt)

    # 2. Si no hay config personalizada, usar el router híbrido del sistema
    print("ℹ️ [LLM Router] Usando router híbrido del sistema.")

    try:
        site_config = SiteConfiguration.load()
        token_threshold = site_config.llm_routing_token_threshold
        # Asumimos que la clave de Groq global está en las variables de entorno si es necesaria
        groq_api_key_global = os.getenv("GROQ_API_KEY")
    except Exception as e:
        print(f"Advertencia: No se pudo cargar SiteConfiguration. Usando valores por defecto. Error: {e}")
        token_threshold = 1500
        groq_api_key_global = None

    history_text = " ".join([msg["content"] for msg in conversation_history])
    total_tokens = count_tokens(history_text + prompt)
    is_complex_task = requires_deep_reasoning(prompt)

    use_groq = total_tokens > token_threshold or is_complex_task

    if use_groq:
        if groq_api_key_global:
            print(f"[LLM Router] Tarea compleja/larga ({total_tokens} tokens). Usando Groq global del sistema.")
            return invoke_groq_api(prompt, groq_api_key_global, conversation_history)
        else:
            print(f"[LLM Router] Tarea compleja/larga ({total_tokens} tokens) pero sin Groq global. Fallback a Phi-3 local.")
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