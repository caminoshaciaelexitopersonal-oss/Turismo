import os
import httpx
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env del backend
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

# --- Configuración del Servicio Local Phi-3 ---
PHI3_API_URL = os.getenv("PHI3_API_URL", "http://localhost:11434/api/generate")
PHI3_MODEL_NAME = os.getenv("PHI3_MODEL_NAME", "phi3:mini")
PHI3_API_KEY = os.getenv("PHI3_API_KEY", "ollama")

async def invoke_phi3_mini(prompt: str) -> str:
    """
    Envía un prompt al modelo local Phi-3 Mini de forma asíncrona.
    """
    headers = {
        "Authorization": f"Bearer {PHI3_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": PHI3_MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(PHI3_API_URL, headers=headers, json=data, timeout=90)
            response.raise_for_status()
            response_data = response.json()
            return response_data.get("response", "No se recibió una respuesta válida del modelo.")
    except httpx.RequestError as e:
        error_message = f"Error de conexión al servicio local de Phi-3: {e}"
        print(error_message)
        return error_message
    except Exception as e:
        error_message = f"Ocurrió un error inesperado al invocar a Phi-3: {e}"
        print(error_message)
        return error_message