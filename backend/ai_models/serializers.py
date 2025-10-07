from rest_framework import serializers
from .models import UserLLMConfig

class UserLLMConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para la configuración LLM de un usuario.
    La clave de API es de solo escritura y se enmascara al leerla.
    """

    # Hacemos que el campo 'api_key' sea de solo escritura para que nunca se devuelva en una respuesta GET.
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})

    # Añadimos un campo de solo lectura para mostrar la clave enmascarada.
    api_key_masked = serializers.SerializerMethodField()

    class Meta:
        model = UserLLMConfig
        fields = [
            'provider',
            'api_key',
            'api_key_masked',
            'updated_at'
        ]
        read_only_fields = ['updated_at', 'api_key_masked']

    def get_api_key_masked(self, obj):
        """
        Devuelve los primeros 5 y los últimos 4 caracteres de la clave si existe,
        o un mensaje indicando que no está configurada.
        """
        if obj.api_key:
            return f"{obj.api_key[:5]}...{obj.api_key[-4:]}"
        return "No configurada"

    def update(self, instance, validated_data):
        # Si no se proporciona una nueva clave, mantenemos la existente.
        # Si se proporciona una cadena vacía, se borra la clave.
        instance.api_key = validated_data.get('api_key', instance.api_key)
        instance.provider = validated_data.get('provider', instance.provider)
        instance.save()
        return instance