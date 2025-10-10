from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Importar las señales para que se registren correctamente en la aplicación
        print("DEBUG: Antes de importar api.signals")
        print("DEBUG: Antes de importar api.signals")
        print("DEBUG: Después de importar api.signals")
        import api.signals
        print("DEBUG: Después de importar api.signals")