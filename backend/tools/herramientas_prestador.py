from langchain_core.tools import tool
from typing import List, Dict
from api.models import CustomUser, CategoriaPrestador, PrestadorServicio, ImagenGaleria
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError

@tool
def crear_perfil_prestador(email: str, nombre_negocio: str, categoria_slug: str, telefono: str) -> Dict:
    """
    (SOLDADO DE REGISTRO) Ejecuta la creación de un nuevo usuario de tipo PRESTADOR
    y su perfil de servicio asociado. Requiere un email único, el nombre del negocio,
    el slug de la categoría (ej. 'hoteles', 'restaurantes') y un teléfono.
    Devuelve el ID del nuevo prestador.
    """
    print(f"--- 💥 SOLDADO (Registro): ¡ACCIÓN! Creando perfil para '{nombre_negocio}' con email {email}. ---")
    try:
        categoria = CategoriaPrestador.objects.get(slug=categoria_slug)
        user, created = CustomUser.objects.get_or_create(
            username=email,
            email=email,
            defaults={'role': CustomUser.Role.PRESTADOR}
        )
        if not created:
            return {"status": "error", "message": f"El usuario con el email {email} ya existe."}

        user.set_password("password_provisonal_123")
        user.save()

        prestador = PrestadorServicio.objects.create(
            usuario=user,
            nombre_negocio=nombre_negocio,
            categoria=categoria,
            telefono=telefono,
            aprobado=False
        )
        return {"status": "success", "prestador_id": prestador.id, "message": f"Usuario y perfil para '{nombre_negocio}' creados. El perfil está pendiente de aprobación."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"La categoría con slug '{categoria_slug}' no existe."}
    except IntegrityError as e:
        return {"status": "error", "message": f"Error de base de datos: {e}"}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado: {e}"}

@tool
def actualizar_datos_negocio(prestador_id: int, descripcion: str = None, facebook_url: str = None, instagram_url: str = None) -> Dict:
    """
    (SOLDADO DE ACTUALIZACIÓN) Ejecuta la actualización de los datos de un perfil
    de prestador de servicios ya existente.
    """
    print(f"--- 💥 SOLDADO (Actualización): ¡ACCIÓN! Actualizando datos para el prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        if descripcion:
            prestador.descripcion = descripcion
        if facebook_url:
            prestador.red_social_facebook = facebook_url
        if instagram_url:
            prestador.red_social_instagram = instagram_url

        prestador.save()
        return {"status": "success", "prestador_id": prestador.id, "message": "Datos del negocio actualizados correctamente."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado al actualizar: {e}"}

@tool
def agregar_foto_galeria(prestador_id: int, url_imagen: str, alt_text: str) -> Dict:
    """
    (SOLDADO DE GALERÍA) Añade una nueva imagen a la galería de un prestador de servicios.
    NOTA: La descarga real de la imagen no está implementada, solo se crea el registro.
    """
    print(f"--- 💥 SOLDADO (Galería): ¡ACCIÓN! Agregando imagen a la galería del prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        imagen_path = f"galeria_simulada/{prestador_id}_{url_imagen.split('/')[-1]}"

        imagen = ImagenGaleria.objects.create(
            prestador=prestador,
            imagen=imagen_path,
            alt_text=alt_text
        )
        return {"status": "success", "image_id": imagen.id, "message": "Registro de imagen creado con éxito."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado al agregar la foto: {e}"}

def get_prestador_soldiers() -> List:
    """ Recluta y devuelve la Escuadra de Prestadores completa. """
    return [
        crear_perfil_prestador,
        actualizar_datos_negocio,
        agregar_foto_galeria,
    ]