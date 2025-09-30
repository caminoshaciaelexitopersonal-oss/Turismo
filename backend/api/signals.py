from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import CustomUser, PrestadorServicio

# URL base del frontend (debería estar en settings, pero se simplifica aquí)
FRONTEND_BASE_URL = "http://localhost:3000"

def send_notification_email(subject, template_name, context, to_emails):
    """
    Función de ayuda para renderizar y enviar correos HTML con alternativa de texto.
    """
    try:
        # Renderiza el contenido HTML y de texto plano
        html_content = render_to_string(template_name, context)
        # Se puede crear una versión de texto plano o dejar que el cliente de correo lo genere
        text_content = "Este es un correo importante del sistema de turismo de Puerto Gaitán."

        # Crea el correo
        email = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            to_emails
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        print(f"Correo '{subject}' enviado exitosamente a: {', '.join(to_emails)}")
    except Exception as e:
        print(f"ERROR al enviar correo '{subject}': {e}")


@receiver(post_save, sender=PrestadorServicio)
def prestador_notifications_handler(sender, instance, created, update_fields=None, **kwargs):
    """
    Gestiona las notificaciones por correo para los prestadores de servicios.
    - Notifica a los admins cuando se crea un nuevo prestador.
    - Notifica al prestador cuando su perfil es aprobado.
    """
    # 1. Notificación a los administradores sobre un nuevo registro
    if created:
        admin_users = CustomUser.objects.filter(
            role__in=[CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL],
            is_active=True
        )
        admin_emails = [user.email for user in admin_users if user.email]

        if not admin_emails:
            print("Señal de notificación: No se encontraron administradores/funcionarios para notificar.")
            return

        subject = f"Nuevo Prestador Registrado: {instance.nombre_negocio}"
        context = {
            "nombre_negocio": instance.nombre_negocio,
            "email_contacto": instance.usuario.email,
            "fecha_registro": instance.fecha_creacion.strftime('%d/%m/%Y'),
            "admin_url": f"{FRONTEND_BASE_URL}/dashboard?tab=prestadores"
        }
        send_notification_email(
            subject,
            "mail/admin_new_prestador_notification.html",
            context,
            admin_emails
        )

    # 2. Notificación al prestador cuando su perfil es aprobado
    else:
        # Se comprueba si el campo 'aprobado' está en los campos actualizados
        if update_fields and 'aprobado' in update_fields and instance.aprobado:
            # Asegurarse de que el prestador tenga un email
            if not instance.usuario.email:
                print(f"Señal de notificación: El prestador {instance.nombre_negocio} no tiene email para notificar aprobación.")
                return

            subject = "¡Tu negocio ha sido aprobado en el Portal de Turismo!"
            context = {
                "nombre_usuario": instance.usuario.first_name or instance.usuario.username,
                "nombre_negocio": instance.nombre_negocio,
                "portal_url": f"{FRONTEND_BASE_URL}/(public)/prestadores/{instance.id}"
            }
            send_notification_email(
                subject,
                "mail/prestador_approval_notification.html",
                context,
                [instance.usuario.email]
            )