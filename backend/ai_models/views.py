from rest_framework import generics, permissions
from .models import UserLLMConfig
from .serializers import UserLLMConfigSerializer

class UserLLMConfigView(generics.RetrieveUpdateAPIView):
    """
    Permite a un usuario ver y actualizar su propia configuración de LLM.
    Crea la configuración si no existe al primer acceso (GET o PUT).
    """
    serializer_class = UserLLMConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Devuelve la configuración LLM del usuario que realiza la petición.
        Si no existe, la crea con los valores por defecto.
        """
        # `get_or_create` devuelve una tupla (objeto, creado_booleano)
        config, created = UserLLMConfig.objects.get_or_create(user=self.request.user)
        if created:
            print(f"Nueva configuración LLM creada para el usuario: {self.request.user.username}")
        return config