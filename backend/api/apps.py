from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Importar las señales para que se registren correctamente en la aplicación
        # Se comenta temporalmente para evitar cuelgues del servidor durante el desarrollo y las pruebas.
        # import api.signals
        pass