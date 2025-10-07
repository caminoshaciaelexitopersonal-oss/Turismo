"""
Django settings for puerto_gaitan_turismo project.
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env (para desarrollo local).
load_dotenv()

# --- Configuración de Seguridad y Entorno ---

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure--20v8f1jb-!a8l@l9-lnfqiebalcvq8rut^mj8@_m-uso36uop"
)

FIELD_ENCRYPTION_KEY = os.environ.get(
    "DJANGO_FIELD_ENCRYPTION_KEY",
    "pU4Wtwp-25i8a5v9M4wVw2H6jP5a_X-m3Nq8y7bK_cE="
).encode()

DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

ALLOWED_HOSTS_str = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_str.split(",")]

# --- CSRF y Seguridad ---
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

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
    "modeltranslation",

    # Mis Apps
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.locale.LocaleMiddleware",
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
# ------------------------------------------------------------------------
# Usa DATABASE_URL desde .env
# Formato: postgresql://USER:PASSWORD@HOST:PORT/DBNAME
# ------------------------------------------------------------------------
if "DATABASE_URL" in os.environ:
    DATABASES = {
        "default": dj_database_url.config(conn_max_age=600, ssl_require=False)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

# Traducciones con modeltranslation
gettext = lambda s: s
LANGUAGES = (
    ("es", gettext("Español")),
    ("en", gettext("English")),
)
MODELTRANSLATION_DEFAULT_LANGUAGE = "es"
MODELTRANSLATION_PREPOPULATE_LANGUAGE = "es"

# Archivos estáticos y media
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Modelo de usuario personalizado
AUTH_USER_MODEL = "api.CustomUser"

# Requerido por dj-rest-auth y allauth
SITE_ID = 1

# --- Configuración de Terceros ---

# DJ-REST-AUTH
REST_AUTH = {
    "USER_DETAILS_SERIALIZER": "api.serializers.CustomUserSerializer",
    "REGISTER_SERIALIZER": "api.serializers.PrestadorRegisterSerializer",
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# DJANGO-ALLAUTH
ACCOUNT_LOGIN_METHODS = {"username", "email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = "mandatory" if not DEBUG else "none"
ACCOUNT_ADAPTER = "allauth.account.adapter.DefaultAccountAdapter"

AUTHENTICATION_BACKENDS = [
    "allauth.account.auth_backends.AuthenticationBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# MFA
MFA_ENABLED = True
ACCOUNT_LOGIN_ON_MFA_PASSWORD_VERIFIED = False

# DRF
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
}

# Email con anymail
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@puertogaitan.gov.co"
    ADMINS = [("Admin", "admin@example.com")]
else:
    EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
    ANYMAIL = {"SENDGRID_API_KEY": os.environ.get("SENDGRID_API_KEY")}
    DEFAULT_FROM_EMAIL = os.environ.get(
        "DEFAULT_FROM_EMAIL", "noreply@puertogaitan.gov.co"
    )
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
    if ADMIN_EMAIL:
        ADMINS = [("Admin", ADMIN_EMAIL)]
    else:
        ADMINS = []
