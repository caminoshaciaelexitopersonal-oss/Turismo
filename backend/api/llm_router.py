import os
import httpx
import tiktoken
from dotenv import load_dotenv
from typing import List, Dict

from asgiref.sync import sync_to_async

# --- Importaciones de Django (se inicializan de forma segura) ---
try:
    from api.models import SiteConfiguration
    # Importamos el nuevo servicio local generalizado
    from api.local_llm_service import invoke_local_llm
    DJANGO_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    DJANGO_AVAILABLE = False
    # Mock para que el archivo no falle al importarse
    async def invoke_local_llm(prompt: str, model_name: str) -> str:
        return f"Error: Django no está disponible. No se puede invocar a {model_name}."

load_dotenv()

# --- Configuración ---
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL_NAME = "llama3-8b-8192"
DEEP_REASONING_KEYWORDS = ["analiza", "resume", "explica", "corrige", "evalúa", "genera un reporte", "crea un plan"]
# Mapeo de proveedores locales a nombres de modelos de Ollama
LOCAL_MODEL_MAP = {
    "PHI3_LOCAL": "phi3:mini",
    "PHI4_LOCAL": "phi-4"  # Asumiendo que este es el nombre en Ollama
}

def count_tokens(text: str) -> int:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception as e:
        print(f"Advertencia: No se pudo usar tiktoken. Usando conteo de palabras. Error: {e}")
        return len(text.split())

def requires_deep_reasoning(prompt: str) -> bool:
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in DEEP_REASONING_KEYWORDS)

async def invoke_groq_api(prompt: str, api_key: str, conversation_history: List[Dict[str, str]]) -> str:
    """Envía un prompt y el historial a la API de Groq de forma asíncrona."""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    messages = conversation_history + [{"role": "user", "content": prompt}]
    data = {"model": GROQ_MODEL_NAME, "messages": messages, "temperature": 0.7}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=data, timeout=90)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
    except httpx.RequestError as e:
        return f"Error de conexión a la API de Groq: {e}"
    except (KeyError, IndexError, TypeError) as e:
        return f"Respuesta inesperada de la API de Groq: {response.text}. Error: {e}"

async def route_llm_request(prompt: str, conversation_history: List[Dict[str, str]], user) -> str:
    """
    Enruta una solicitud al LLM apropiado de forma asíncrona.
    """
    if not DJANGO_AVAILABLE:
        return "Error: El entorno de Django no está configurado."

    # 1. Verificar si el usuario tiene una configuración personalizada y activa
    if user and hasattr(user, 'llm_config'):
        config = user.llm_config
        if config.provider == 'GROQ' and config.api_key:
            print(f"🔑 [LLM Router] Usando Groq personalizado del usuario {user.username}.")
            return await invoke_groq_api(prompt, config.api_key, conversation_history)
        elif config.provider in LOCAL_MODEL_MAP:
            model_name = LOCAL_MODEL_MAP[config.provider]
            print(f"⚙️ [LLM Router] Usando modelo local {model_name} (configuración de usuario) para {user.username}.")
            return await invoke_local_llm(prompt, model_name=model_name)

    # 2. Si no hay config personalizada, usar el router híbrido del sistema
    print("ℹ️ [LLM Router] Usando router híbrido del sistema.")

    try:
        site_config = await sync_to_async(SiteConfiguration.load)()
        token_threshold = site_config.llm_routing_token_threshold
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
            return await invoke_groq_api(prompt, groq_api_key_global, conversation_history)
        else:
            print(f"[LLM Router] Tarea compleja/larga ({total_tokens} tokens) pero sin Groq global. Fallback a Phi-3 local.")
            return await invoke_local_llm(prompt, model_name=LOCAL_MODEL_MAP["PHI3_LOCAL"])
    else:
        print(f"[LLM Router] Tarea simple ({total_tokens} tokens). Usando modelo local: Phi-3 Mini.")
        return await invoke_local_llm(prompt, model_name=LOCAL_MODEL_MAP["PHI3_LOCAL"])