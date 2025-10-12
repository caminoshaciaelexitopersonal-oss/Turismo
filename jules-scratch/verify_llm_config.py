import os
import django

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'puerto_gaitan_turismo.settings')
django.setup()

from api.models import CustomUser, UserLLMConfig
from api.serializers import UserLLMConfigSerializer

def verify_llm_config():
    """
    Verifica que se pueda obtener la configuración LLM para un usuario.
    Esto simula la lógica del endpoint /api/config/my-llm/.
    """
    print("--- Verificando la lógica de UserLLMConfigView ---")
    try:
        # Obtener el usuario de prueba
        user = CustomUser.objects.get(username='admin_test')

        # Simular la lógica de get_object en la vista
        llm_config, created = UserLLMConfig.objects.get_or_create(user=user)

        if created:
            print("Se ha creado una nueva configuración LLM por defecto para 'admin_test'.")
        else:
            print("Se ha obtenido la configuración LLM existente para 'admin_test'.")

        # Serializar los datos para mostrar la respuesta que daría la API
        serializer = UserLLMConfigSerializer(llm_config)

        print("\n✅ ÉXITO: La lógica del endpoint funciona correctamente.")
        print("Respuesta de la API (simulada):")
        # Imprimir el diccionario directamente para evitar problemas de serialización JSON con objetos lazy
        import pprint
        pprint.pprint(serializer.data)

    except CustomUser.DoesNotExist:
        print("❌ FALLO: No se encontró al usuario 'admin_test'. Asegúrate de que los datos de prueba existan.")
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    verify_llm_config()