import os
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import MenuItem

# Desactivar las variables de entorno de proxy si existen
# (A veces, en entornos de desarrollo, pueden interferir con las operaciones locales).
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)


class Command(BaseCommand):
    """
    Este comando de Django limpia y crea los elementos del menú principal del sitio web.
    Define una estructura de menú jerárquica (con soporte para varios niveles).
    Es útil para inicializar o restablecer la navegación del sitio a un estado predefinido.
    """
    help = 'Limpia y crea los elementos del menú principal con una estructura jerárquica.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        """
        Punto de entrada principal para el comando.
        Ejecuta la lógica de limpieza y creación del menú dentro de una transacción.
        """
        self.stdout.write(self.style.WARNING('Limpiando la configuración de menú existente...'))
        MenuItem.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('¡Menú limpiado con éxito!'))

        self.stdout.write(self.style.NOTICE('Creando la nueva estructura del menú...'))

        # --- Definición de la nueva estructura del Menú ---
        menu_data = [
            {
                "nombre": "Institucionalidad", "url": "#", "children": [
                    {
                        "nombre": "Secretaría de Turismo y Desarrollo Económico",
                        "url": "/institucional/secretaria",
                        "children": [
                            {"nombre": "Banner de fotos", "url": "/institucional/secretaria#banner"},
                            {"nombre": "Objetivos y funciones", "url": "/institucional/secretaria#objetivos"},
                            {"nombre": "Programas y proyectos", "url": "/institucional/secretaria#proyectos"},
                            {"nombre": "Estrategias de apoyo", "url": "/institucional/secretaria#estrategias"},
                        ]
                    },
                    {
                        "nombre": "Dirección de Turismo",
                        "url": "/institucional/direccion",
                        "children": [
                            {"nombre": "Banner de fotos", "url": "/institucional/direccion#banner"},
                            {"nombre": "Objetivos y funciones", "url": "/institucional/direccion#objetivos"},
                            {"nombre": "Políticas locales de turismo", "url": "/institucional/direccion#politicas"},
                            {"nombre": "Convenios y asociaciones", "url": "/institucional/direccion#convenios"},
                            {
                                "nombre": "Informes de resultados", "url": "#", "children": [
                                    {"nombre": "Capacitación y recursos", "url": "/institucional/direccion/informes#capacitacion"},
                                    {"nombre": "Seguimiento de la informalidad", "url": "/institucional/direccion/informes#seguimiento"},
                                ]
                            },
                        ]
                    },
                    {
                        "nombre": "Consejo consultivo de turismo",
                        "url": "/institucional/consejo",
                        "children": [
                            {"nombre": "Banner de fotos", "url": "/institucional/consejo#banner"},
                            {"nombre": "Objetivos y funciones", "url": "/institucional/consejo#objetivos"},
                            {"nombre": "Sesiones", "url": "/institucional/consejo#sesiones"},
                            {"nombre": "Actas (HOME)", "url": "/institucional/consejo#actas"},
                        ]
                    },
                ]
            },
            {
                "nombre": "Agenda y Servicios", "url": "#", "children": [
                    {
                        "nombre": "Agenda Cultural",
                        "url": "/agenda",
                        "children": [
                            {"nombre": "Calendario detallado", "url": "/agenda#calendario"},
                            {"nombre": "Enlace a inscripciones", "url": "/agenda#inscripciones"},
                            {"nombre": "Integración con Google Calendar", "url": "/agenda#integracion"},
                        ]
                    },
                    {
                        "nombre": "Eventos Destacados",
                        "url": "/eventos",
                        "children": [
                             {"nombre": "Próximos 3-5 eventos", "url": "/eventos#proximos"},
                             {"nombre": "Ver todos", "url": "/agenda"},
                        ]
                    },
                    {
                        "nombre": "Directorio",
                        "url": "/directorio",
                        "children": [
                            {"nombre": "Búsqueda de prestadores", "url": "/directorio#prestadores"},
                            {"nombre": "Contacto de funcionarios", "url": "/directorio#funcionarios"},
                            {"nombre": "Enlaces a cámaras de comercio", "url": "/directorio#enlaces"},
                        ]
                    },
                ]
            },
            {
                "nombre": "Nuestro Municipio", "url": "#", "children": [
                    {
                        "nombre": "Historia y Cultura",
                        "url": "/municipio/historia",
                        "children": [
                            {"nombre": "Línea de tiempo", "url": "/municipio/historia#linea-tiempo"},
                            {"nombre": "Tradiciones", "url": "/municipio/historia#tradiciones"},
                            {"nombre": "Personajes históricos", "url": "/municipio/historia#personajes"},
                            {"nombre": "Museos y casas de cultura", "url": "/municipio/historia#museos"},
                        ]
                    },
                    {
                        "nombre": "Eventos",
                        "url": "/municipio/eventos",
                        "children": [
                            {"nombre": "Calendario dinámico", "url": "/municipio/eventos#calendario"},
                            {"nombre": "Clasificación de eventos", "url": "/municipio/eventos#clasificacion"},
                            {"nombre": "Fotos y reseñas de eventos pasados", "url": "/municipio/eventos#pasados"},
                        ]
                    },
                    {
                        "nombre": "Noticias y Blog",
                        "url": "/municipio/noticias",
                        "children": [
                            {"nombre": "Publicaciones de actualidad", "url": "/municipio/noticias#actualidad"},
                            {"nombre": "Artículos de interés", "url": "/municipio/noticias#articulos"},
                            {"nombre": "Suscripción al boletín", "url": "/municipio/noticias#suscripcion"},
                        ]
                    },
                ]
            },
            {
                "nombre": "Turismo por el Paraiso",
                "url": "#",
                "children": [
                    {
                        "nombre": "Atracciones Naturales",
                        "url": "/atractivos",
                        "children": [
                            {"nombre": "Listado y descripción", "url": "/atractivos#lista"},
                            {"nombre": "Clasificación", "url": "/atractivos#clasificacion"},
                            {"nombre": "Recomendaciones de visita", "url": "/atractivos#recomendaciones"},
                        ]
                    },
                    {
                        "nombre": "Oferta Turística",
                        "url": "/prestadores",
                        "children": [
                            {"nombre": "Hoteles, restaurantes, etc.", "url": "/prestadores#listado"},
                            {"nombre": "Perfil del prestador", "url": "/prestadores#perfil"},
                            {"nombre": "Filtro por categorías", "url": "/prestadores#filtro"},
                        ]
                    },
                    {
                        "nombre": "Mapa Interactivo",
                        "url": "/mapa",
                        "children": [
                            {"nombre": "Ubicación de atractivos", "url": "/mapa#atractivos"},
                            {"nombre": "Filtros por categorías", "url": "/mapa#filtros"},
                            {"nombre": "Integración con Google Maps", "url": "/mapa#integracion"},
                        ]
                    },
                    {
                        "nombre": "Galería (fotos y videos)",
                        "url": "/galeria",
                        "children": [
                            {"nombre": "Álbum de fotos", "url": "/galeria#fotos"},
                            {"nombre": "Videos promocionales", "url": "/galeria#videos"},
                            {"nombre": "Opción de compartir", "url": "/galeria#compartir"},
                        ]
                    }
                ]
            }
        ]

        self._create_menu_items_recursive(menu_data)

        self.stdout.write(self.style.SUCCESS('\n¡La nueva estructura del menú ha sido creada con éxito!'))
        self.stdout.write(self.style.NOTICE('Ejecuta el servidor para ver los cambios reflejados en el sitio.'))

    def _create_menu_items_recursive(self, items, parent=None, level=0):
        """Función recursiva para crear elementos de menú anidados."""
        for index, item_data in enumerate(items):
            menu_item = MenuItem.objects.create(
                nombre=item_data['nombre'],
                url=item_data['url'],
                parent=parent,
                orden=index
            )
            indent = "  " * (level + 1)
            self.stdout.write(self.style.SUCCESS(f'{indent}- Creado: {menu_item.nombre}'))

            if 'children' in item_data and item_data['children']:
                self._create_menu_items_recursive(item_data['children'], parent=menu_item, level=level + 1)