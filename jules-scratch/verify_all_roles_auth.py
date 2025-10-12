import os
import django
from django.contrib.auth import authenticate

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'puerto_gaitan_turismo.settings')
django.setup()

from api.models import CustomUser

# --- Configuración de Roles y Credenciales ---
COMMON_PASSWORD = "password123"
ROLES_A_PROBAR = [
    "turista_test",
    "prestador_test",
    "artesano_test",
    "admin_test",
    "directivo_test",
    "profesional_test",
]

def verify_roles_authentication():
    """
    Verifica que la autenticación a nivel de backend funcione para todos los roles de prueba.
    """
    print("--- Verificando la Autenticación de Todos los Roles ---")

    results = {}

    for username in ROLES_A_PROBAR:
        try:
            # Verificar que el usuario existe
            user = CustomUser.objects.get(username=username)

            # Intentar autenticar al usuario
            authenticated_user = authenticate(username=username, password=COMMON_PASSWORD)

            if authenticated_user is not None and authenticated_user.is_active:
                results[username] = "✅ Éxito: Autenticación correcta."
            else:
                results[username] = "❌ Fallo: Credenciales incorrectas o usuario inactivo."

        except CustomUser.DoesNotExist:
            results[username] = f"❌ Fallo: El usuario '{username}' no existe en la base de datos."
        except Exception as e:
            results[username] = f"❌ ERROR inesperado: {e}"

    # Imprimir resumen final
    print("\n--- RESUMEN DE VERIFICACIÓN DE AUTENTICACIÓN ---")
    for username, result in results.items():
        print(f"- {username}: {result}")
    print("-" * 45)

if __name__ == "__main__":
    verify_roles_authentication()