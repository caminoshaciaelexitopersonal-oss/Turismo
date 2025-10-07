from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    CustomUser,
    PrestadorServicio,
    Artesano,
    PerfilAdministrador,
    PerfilFuncionarioDirectivo,
    PerfilFuncionarioProfesional
)

# --- Credenciales y Datos de Prueba ---
# Contraseña común para todos los usuarios de prueba para facilitar la verificación
COMMON_PASSWORD = "password123"

USERS_TO_CREATE = {
    "turista_test": {
        "email": "turista@test.com",
        "role": CustomUser.Role.TURISTA,
        "profile_data": {
            "origen": "NACIONAL",
            "pais_origen": None
        }
    },
    "prestador_test": {
        "email": "prestador@test.com",
        "role": CustomUser.Role.PRESTADOR,
        "profile_data": {
            "nombre_negocio": "Hotel Paraíso de Prueba",
            "aprobado": True
        }
    },
    "artesano_test": {
        "email": "artesano@test.com",
        "role": CustomUser.Role.ARTESANO,
        "profile_data": {
            "nombre_taller": "Manos Mágicas de Pruebas",
            "nombre_artesano": "Artesano de Pruebas",
            "aprobado": True
        }
    },
    "admin_test": {
        "email": "admintest@test.com",
        "role": CustomUser.Role.ADMIN,
        "profile_data": {
            "cargo": "Administrador de Pruebas",
            "dependencia_asignada": "Plataforma SITYC",
            "nivel_acceso": "Total"
        }
    },
    "directivo_test": {
        "email": "directivo@test.com",
        "role": CustomUser.Role.FUNCIONARIO_DIRECTIVO,
        "profile_data": {
            "dependencia": "Secretaría de Turismo",
            "nivel_direccion": "Director",
            "area_funcional": "Planeación Estratégica"
        }
    },
    "profesional_test": {
        "email": "profesional@test.com",
        "role": CustomUser.Role.FUNCIONARIO_PROFESIONAL,
        "profile_data": {
            "dependencia": "Oficina de Proyectos",
            "profesion": "Ingeniero de Sistemas",
            "area_asignada": "Tecnología"
        }
    }
}

class Command(BaseCommand):
    help = 'Crea un conjunto de usuarios de prueba, uno para cada rol, con perfiles y datos predefinidos.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("--- Iniciando Creación de Usuarios de Prueba para Verificación Manual ---"))

        for username, data in USERS_TO_CREATE.items():
            # Verificar si el usuario ya existe
            if CustomUser.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"El usuario '{username}' ya existe. Saltando creación."))
                continue

            # Crear el usuario base
            user = CustomUser.objects.create_user(
                username=username,
                email=data["email"],
                password=COMMON_PASSWORD,
                role=data["role"]
            )

            # Crear el perfil asociado según el rol
            role = data["role"]
            profile_data = data["profile_data"]

            if role == CustomUser.Role.TURISTA:
                user.origen = profile_data["origen"]
                user.pais_origen = profile_data["pais_origen"]
                user.save()
            elif role == CustomUser.Role.PRESTADOR:
                PrestadorServicio.objects.create(usuario=user, **profile_data)
            elif role == CustomUser.Role.ARTESANO:
                Artesano.objects.create(usuario=user, **profile_data)
            elif role == CustomUser.Role.ADMIN:
                PerfilAdministrador.objects.create(usuario=user, **profile_data)
            elif role == CustomUser.Role.FUNCIONARIO_DIRECTIVO:
                PerfilFuncionarioDirectivo.objects.create(usuario=user, **profile_data)
            elif role == CustomUser.Role.FUNCIONARIO_PROFESIONAL:
                PerfilFuncionarioProfesional.objects.create(usuario=user, **profile_data)

            self.stdout.write(self.style.SUCCESS(f"✅ Usuario '{username}' y su perfil de {role} creados con éxito."))

        self.stdout.write(self.style.SUCCESS("\n--- Proceso de Creación de Usuarios de Prueba Finalizado ---"))