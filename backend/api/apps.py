from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        # Importar y conectar las señales cuando la app esté lista
        # import api.signals # Comentado para depurar el arranque
        pass
