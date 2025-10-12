import os
import django

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'puerto_gaitan_turismo.settings')
django.setup()

from rest_framework.authtoken.models import Token
from api.models import CustomUser

def get_token():
    """
    Obtiene o crea un token para el usuario de prueba 'admin_test'.
    """
    try:
        # Asegurarse de que el usuario exista
        user, created = CustomUser.objects.get_or_create(
            username='admin_test',
            defaults={
                'email': 'admin_test@example.com',
                'role': CustomUser.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print("Usuario 'admin_test' creado.")

        # Obtener o crear el token
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token para admin_test: {token.key}")

    except Exception as e:
        print(f"Ocurrió un error: {e}")

if __name__ == "__main__":
    get_token()