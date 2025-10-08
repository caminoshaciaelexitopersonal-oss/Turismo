import os
import httpx
from dotenv import load_dotenv
from typing import Optional

# Cargar variables de entorno
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# --- Configuración del Servicio Local ---
DEFAULT_OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
LOCAL_LLM_API_KEY = os.getenv("OLLAMA_API_KEY", "ollama")

async def invoke_local_llm(prompt: str, model_name: str, api_url: Optional[str] = None) -> str:
    """
    Envía un prompt a un modelo local especificado de forma asíncrona.
    Permite sobreescribir la URL de la API para pruebas o configuraciones dinámicas.
    """
    url_to_use = api_url or DEFAULT_OLLAMA_API_URL

    headers = {
        "Authorization": f"Bearer {LOCAL_LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url_to_use, headers=headers, json=data, timeout=10)
            response.raise_for_status()
            response_data = response.json()
            return response_data.get("response", "No se recibió una respuesta válida del modelo.")
    except httpx.RequestError as e:
        error_message = f"Error de conexión a la URL '{url_to_use}' para el modelo '{model_name}': {e}"
        print(error_message)
        return error_message
    except Exception as e:
        error_message = f"Ocurrió un error inesperado al invocar a {model_name}: {e}"
        print(error_message)
        return error_message