from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import CustomUser, CategoriaPrestador, PrestadorServicio

class Command(BaseCommand):
    """
    Este comando crea los datos necesarios para ejecutar las pruebas de regresión del frontend.
    Incluye:
    - Categorías de prestadores ('Hoteles', 'Restaurantes').
    - Un usuario de tipo 'PRESTADOR' para el inicio de sesión.
    - Un prestador de servicio de prueba ('Hotel El Descanso Llanero') que esté aprobado.
    """
    help = 'Crea los datos de prueba necesarios para las pruebas de regresión.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Iniciando la creación de datos de prueba...'))

        # 1. Crear Categorías de Prestador
        cat_hoteles, created_h = CategoriaPrestador.objects.get_or_create(
            nombre='Hoteles',
            defaults={'slug': 'hoteles'}
        )
        if created_h:
            self.stdout.write(self.style.SUCCESS('Categoría "Hoteles" creada.'))

        cat_restaurantes, created_r = CategoriaPrestador.objects.get_or_create(
            nombre='Restaurantes',
            defaults={'slug': 'restaurantes'}
        )
        if created_r:
            self.stdout.write(self.style.SUCCESS('Categoría "Restaurantes" creada.'))

        # 2. Crear Usuario de tipo PRESTADOR
        prestador_user, created_u = CustomUser.objects.get_or_create(
            email='prestador@example.com',
            defaults={
                'username': 'prestador_test',
                'role': CustomUser.Role.PRESTADOR,
            }
        )
        if created_u:
            prestador_user.set_password('testpassword')
            prestador_user.save()
            self.stdout.write(self.style.SUCCESS('Usuario prestador "prestador@example.com" creado.'))
        else:
            # Asegurarse de que la contraseña sea la correcta si el usuario ya existe
            if not prestador_user.check_password('testpassword'):
                prestador_user.set_password('testpassword')
                prestador_user.save()
                self.stdout.write(self.style.WARNING('Contraseña del usuario prestador actualizada.'))


        # 3. Crear Prestador de Servicio de prueba
        prestador_servicio, created_p = PrestadorServicio.objects.get_or_create(
            usuario=prestador_user,
            defaults={
                'nombre_negocio': 'Hotel El Descanso Llanero',
                'categoria': cat_hoteles,
                'aprobado': True, # Es crucial que esté aprobado para ser visible
                'descripcion': 'Un lugar ideal para descansar y disfrutar de la naturaleza llanera.',
                'telefono': '3001234567',
                'email_contacto': 'contacto@eldescansollanero.com'
            }
        )
        if created_p:
            self.stdout.write(self.style.SUCCESS('Prestador de servicio "Hotel El Descanso Llanero" creado y aprobado.'))

        self.stdout.write(self.style.SUCCESS('\n¡Datos de prueba creados con éxito!'))