"""
Django settings for puerto_gaitan_turismo project.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Configuración de Seguridad y Entorno ---

# Lee la SECRET_KEY desde una variable de entorno.
# ¡NO USES LA CLAVE POR DEFECTO EN PRODUCCIÓN!
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure--20v8f1jb-!a8l@l9-lnfqiebalcvq8rut^mj8@_m-uso36uop"
)

# Clave para encriptar campos sensibles en la base de datos.
# DEBE ser sobreescrita en producción con una variable de entorno.
# Para generar una nueva clave:
# from cryptography.fernet import Fernet; Fernet.generate_key()
FIELD_ENCRYPTION_KEY = os.environ.get(
    "DJANGO_FIELD_ENCRYPTION_KEY",
    "pU4Wtwp-25i8a5v9M4wVw2H6jP5a_X-m3Nq8y7bK_cE="
).encode()

# El modo DEBUG no debe estar activado en producción.
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

# Configura los hosts permitidos desde una variable de entorno.
# Ejemplo: "localhost,127.0.0.1,yourdomain.com"
ALLOWED_HOSTS_str = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_str.split(",")]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # Terceros
    "rest_framework",
    "rest_framework.authtoken",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.mfa",
    "dj_rest_auth",
    "corsheaders",
    "anymail",
    "django_filters",

    # Mis Apps
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "puerto_gaitan_turismo.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "puerto_gaitan_turismo.wsgi.application"


# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    # {
    #     "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    # },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (user-uploaded files)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Modelo de Usuario Personalizado
AUTH_USER_MODEL = "api.CustomUser"

# Requerido por dj-rest-auth y allauth
SITE_ID = 1

# --- Configuraciones de Terceros ---

# DJ-REST-AUTH
REST_AUTH = {
    # Usa el serializador personalizado para incluir el rol del usuario en el endpoint de detalles
    'USER_DETAILS_SERIALIZER': 'api.serializers.CustomUserSerializer',
    'REGISTER_SERIALIZER': 'api.serializers.PrestadorRegisterSerializer',
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# DJANGO-ALLAUTH
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = "none" # Cambiar a "mandatory" en producción
ACCOUNT_ADAPTER = "allauth.account.adapter.DefaultAccountAdapter"
AUTHENTICATION_BACKENDS = [
    'allauth.account.auth_backends.AuthenticationBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# MFA (Multi-Factor Authentication)
MFA_ENABLED = True
ACCOUNT_LOGIN_ON_MFA_PASSWORD_VERIFIED = False

# DJANGO REST FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
}

# --- Configuración de Email (con Anymail) ---
if DEBUG:
    # En desarrollo, los correos se imprimen en la consola. No se envían realmente.
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@puertogaitan.gov.co"
    ADMINS = [("Admin", "admin@example.com")]
else:
    # En producción, usamos Anymail con un proveedor de servicios (ej. SendGrid).
    # Debes configurar las variables de entorno correspondientes.
    EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
    ANYMAIL = {
        "SENDGRID_API_KEY": os.environ.get("SENDGRID_API_KEY"),
    }
    # Dirección de correo por defecto para el remitente.
    # Debe ser un correo verificado por tu proveedor (ej. SendGrid).
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@puertogaitan.gov.co")

    # Correo del administrador para recibir notificaciones del sistema.
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
    if ADMIN_EMAIL:
        ADMINS = [("Admin", ADMIN_EMAIL)]
    else:
        ADMINS = []
