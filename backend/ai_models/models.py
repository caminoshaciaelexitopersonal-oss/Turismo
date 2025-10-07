from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class UserLLMConfig(models.Model):
    """
    Almacena la configuración de LLM personalizada para un usuario.
    """
    class Provider(models.TextChoices):
        SYSTEM_DEFAULT = 'SYSTEM_DEFAULT', _('Usar configuración del sistema')
        GROQ = 'GROQ', _('Groq personalizado')
        PHI3_LOCAL = 'PHI3_LOCAL', _('Modelo local Phi-3 Mini')

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="llm_config"
    )
    provider = models.CharField(
        _("Proveedor LLM"),
        max_length=50,
        choices=Provider.choices,
        default=Provider.SYSTEM_DEFAULT,
        help_text=_("El proveedor de LLM que el usuario prefiere usar.")
    )
    # Usaremos el campo EncryptedTextField de la app 'api' para seguridad.
    # Por ahora, lo definimos como CharField y lo cambiaremos si es necesario
    # para evitar dependencias cruzadas complejas.
    api_key = models.CharField(
        _("Clave de API Personalizada"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("La clave de API para el proveedor seleccionado. Se almacena de forma segura.")
    )
    created_at = models.DateTimeField(_("Fecha de Creación"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Última Actualización"), auto_now=True)

    def __str__(self):
        return f"Configuración LLM para {self.user.username}"

    class Meta:
        verbose_name = "Configuración LLM de Usuario"
        verbose_name_plural = "Configuraciones LLM de Usuarios"
        ordering = ['-updated_at']