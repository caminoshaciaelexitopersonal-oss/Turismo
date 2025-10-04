from langchain_core.tools import tool
from typing import List, Dict, Optional
from api.models import (
    CustomUser,
    CategoriaPrestador,
    PrestadorServicio,
    ImagenGaleria,
    DetallesHotel,
    DocumentoLegalizacion
)
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from django.utils.text import slugify
import os

# --- SOLDADOS DE GESTIÓN DE PERFILES (CRUD) ---

@tool
def crear_perfil_prestador(email: str, nombre_negocio: str, categoria_slug: str, telefono: str) -> Dict:
    """
    (SOLDADO DE REGISTRO) Ejecuta la creación de un nuevo usuario de tipo PRESTADOR y su perfil de servicio asociado.
    Requiere un email único para el usuario, el nombre del negocio, el slug de la categoría (ej. 'hoteles', 'restaurantes') y un teléfono.
    El perfil se crea como 'no aprobado' por defecto. Devuelve el ID del nuevo prestador.
    """
    print(f"--- 💥 SOLDADO (Registro): ¡ACCIÓN! Creando perfil para '{nombre_negocio}' con email {email}. ---")
    try:
        if CustomUser.objects.filter(email=email).exists():
            return {"status": "error", "message": f"El email {email} ya está en uso."}

        categoria = CategoriaPrestador.objects.get(slug=categoria_slug)

        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            role=CustomUser.Role.PRESTADOR
        )
        user.set_password(f"temp_{slugify(nombre_negocio)}_{user.id}") # Contraseña temporal
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
        return {"status": "error", "message": f"Error de integridad de datos: {e}"}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado: {e}"}

@tool
def actualizar_perfil_prestador(
    prestador_id: int,
    nombre_negocio: Optional[str] = None,
    descripcion: Optional[str] = None,
    telefono: Optional[str] = None,
    email_contacto: Optional[str] = None,
    facebook_url: Optional[str] = None,
    instagram_url: Optional[str] = None,
    tiktok_url: Optional[str] = None,
    whatsapp: Optional[str] = None,
    direccion: Optional[str] = None,
    latitud: Optional[float] = None,
    longitud: Optional[float] = None,
    promociones: Optional[str] = None
) -> Dict:
    """
    (SOLDADO DE ACTUALIZACIÓN) Ejecuta la actualización de los datos de un perfil de prestador de servicios existente.
    Permite modificar múltiples campos a la vez. Los campos no proporcionados no se modificarán.
    """
    print(f"--- 💥 SOLDADO (Actualización): ¡ACCIÓN! Actualizando datos para el prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        update_fields = []

        if nombre_negocio: prestador.nombre_negocio = nombre_negocio; update_fields.append('nombre_negocio')
        if descripcion: prestador.descripcion = descripcion; update_fields.append('descripcion')
        if telefono: prestador.telefono = telefono; update_fields.append('telefono')
        if email_contacto: prestador.email_contacto = email_contacto; update_fields.append('email_contacto')
        if facebook_url: prestador.red_social_facebook = facebook_url; update_fields.append('red_social_facebook')
        if instagram_url: prestador.red_social_instagram = instagram_url; update_fields.append('red_social_instagram')
        if tiktok_url: prestador.red_social_tiktok = tiktok_url; update_fields.append('red_social_tiktok')
        if whatsapp: prestador.red_social_whatsapp = whatsapp; update_fields.append('red_social_whatsapp')
        if direccion: prestador.direccion = direccion; update_fields.append('direccion')
        if latitud is not None: prestador.latitud = latitud; update_fields.append('latitud')
        if longitud is not None: prestador.longitud = longitud; update_fields.append('longitud')
        if promociones: prestador.promociones_ofertas = promociones; update_fields.append('promociones_ofertas')

        if not update_fields:
            return {"status": "info", "message": "No se proporcionaron campos para actualizar."}

        prestador.save(update_fields=update_fields)
        return {"status": "success", "prestador_id": prestador.id, "message": f"Datos del negocio actualizados correctamente. Campos modificados: {', '.join(update_fields)}."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado al actualizar: {e}"}

@tool
def gestionar_aprobacion_prestador(prestador_id: int, aprobar: bool) -> Dict:
    """
    (SOLDADO DE COMANDO) Aprueba o desaprueba el perfil de un prestador de servicios para que sea visible públicamente.
    `aprobar` debe ser True para aprobar o False para desaprobar.
    """
    print(f"--- 💥 SOLDADO (Comando): ¡ACCIÓN! {'Aprobando' if aprobar else 'Desaprobando'} al prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        prestador.aprobado = aprobar
        prestador.save(update_fields=['aprobado'])
        estado = "aprobado" if aprobar else "desaprobado"
        return {"status": "success", "message": f"El perfil del prestador '{prestador.nombre_negocio}' ha sido {estado}."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}

# --- SOLDADOS DE GESTIÓN DE ENTIDADES RELACIONADAS ---

@tool
def establecer_foto_principal(prestador_id: int, ruta_archivo_imagen: str) -> Dict:
    """
    (SOLDADO DE IMAGEN) Establece o actualiza la foto principal de un prestador de servicios.
    `ruta_archivo_imagen` es la ruta a un archivo en el sistema de almacenamiento.
    """
    print(f"--- 💥 SOLDADO (Imagen): ¡ACCIÓN! Estableciendo foto principal para el prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        prestador.foto_principal.name = ruta_archivo_imagen
        prestador.save(update_fields=['foto_principal'])
        return {"status": "success", "message": f"Foto principal para '{prestador.nombre_negocio}' actualizada."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Error al establecer la foto principal: {e}"}

@tool
def agregar_foto_galeria(prestador_id: int, ruta_archivo_imagen: str, alt_text: str) -> Dict:
    """
    (SOLDADO DE GALERÍA) Añade una nueva imagen a la galería de un prestador de servicios.
    `ruta_archivo_imagen` es la ruta a un archivo en el sistema de almacenamiento.
    """
    print(f"--- 💥 SOLDADO (Galería): ¡ACCIÓN! Agregando imagen a la galería del prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        imagen = ImagenGaleria.objects.create(
            prestador=prestador,
            imagen=ruta_archivo_imagen,
            alt_text=alt_text
        )
        return {"status": "success", "image_id": imagen.id, "message": "Imagen añadida a la galería con éxito."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}

@tool
def eliminar_foto_galeria(imagen_id: int) -> Dict:
    """
    (SOLDADO DE GALERÍA) Elimina una imagen de la galería de un prestador por su ID.
    NOTA: Esto solo elimina el registro de la base de datos, no el archivo físico.
    """
    print(f"--- 💥 SOLDADO (Galería): ¡ACCIÓN! Eliminando imagen_id {imagen_id} de la galería. ---")
    try:
        imagen = ImagenGaleria.objects.get(id=imagen_id)
        prestador_nombre = imagen.prestador.nombre_negocio
        imagen.delete()
        return {"status": "success", "message": f"Imagen eliminada de la galería de '{prestador_nombre}'."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró una imagen con el ID {imagen_id}."}

@tool
def subir_documento_legalizacion(prestador_id: int, nombre_documento: str, ruta_archivo: str) -> Dict:
    """
    (SOLDADO DE ARCHIVOS) Sube un documento de legalización para un prestador.
    `ruta_archivo` es la ruta al archivo en el sistema de almacenamiento.
    """
    print(f"--- 💥 SOLDADO (Archivos): ¡ACCIÓN! Subiendo documento '{nombre_documento}' para el prestador_id {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.get(id=prestador_id)
        documento = DocumentoLegalizacion.objects.create(
            prestador=prestador,
            nombre_documento=nombre_documento,
            documento=ruta_archivo
        )
        return {"status": "success", "documento_id": documento.id, "message": "Documento subido con éxito."}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró un prestador con el ID {prestador_id}."}

# --- SOLDADOS DE CONSULTA ---

@tool
def consultar_prestador_por_id(prestador_id: int) -> Dict:
    """
    (SOLDADO DE RECONOCIMIENTO) Busca y devuelve los datos detallados de un prestador de servicios por su ID.
    """
    print(f"--- 💥 SOLDADO (Reconocimiento): ¡ACCIÓN! Buscando al prestador con ID {prestador_id}. ---")
    try:
        prestador = PrestadorServicio.objects.select_related('usuario', 'categoria').get(id=prestador_id)
        datos = {
            "id": prestador.id,
            "nombre_negocio": prestador.nombre_negocio,
            "descripcion": prestador.descripcion,
            "telefono": prestador.telefono,
            "email_usuario": prestador.usuario.email,
            "email_contacto": prestador.email_contacto,
            "categoria": prestador.categoria.nombre,
            "aprobado": prestador.aprobado,
            "ubicacion": {
                "direccion": prestador.direccion,
                "latitud": prestador.latitud,
                "longitud": prestador.longitud
            },
            "redes_sociales": {
                "facebook": prestador.red_social_facebook,
                "instagram": prestador.red_social_instagram,
                "tiktok": prestador.red_social_tiktok,
                "whatsapp": prestador.red_social_whatsapp
            },
            "puntuacion": {
                "verificacion": prestador.puntuacion_verificacion,
                "capacitacion": prestador.puntuacion_capacitacion,
                "reseñas": prestador.puntuacion_reseñas,
                "total": prestador.puntuacion_total
            }
        }
        return {"status": "success", "data": datos}
    except ObjectDoesNotExist:
        return {"status": "error", "message": f"No se encontró ningún prestador con el ID {prestador_id}."}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado al consultar: {e}"}

@tool
def listar_prestadores_por_categoria(categoria_slug: str, solo_aprobados: bool = True) -> Dict:
    """
    (SOLDADO DE PATRULLA) Devuelve una lista de los prestadores de servicios que pertenecen a una categoría.
    Por defecto, lista solo los aprobados.
    """
    print(f"--- 💥 SOLDADO (Patrulla): ¡ACCIÓN! Listando prestadores de la categoría '{categoria_slug}'. ---")
    try:
        prestadores = PrestadorServicio.objects.filter(categoria__slug=categoria_slug)
        if solo_aprobados:
            prestadores = prestadores.filter(aprobado=True)

        if not prestadores.exists():
            return {"status": "success", "message": f"No se encontraron prestadores en la categoría '{categoria_slug}'."}

        lista_prestadores = [{"id": p.id, "nombre": p.nombre_negocio, "puntuacion": p.puntuacion_total} for p in prestadores]
        return {"status": "success", "categoria_slug": categoria_slug, "prestadores": lista_prestadores}
    except Exception as e:
        return {"status": "error", "message": f"Ocurrió un error inesperado al listar: {e}"}


def get_prestador_soldiers() -> List:
    """ Recluta y devuelve la Escuadra de Prestadores completa. """
    return [
        crear_perfil_prestador,
        actualizar_perfil_prestador,
        gestionar_aprobacion_prestador,
        establecer_foto_principal,
        agregar_foto_galeria,
        eliminar_foto_galeria,
        subir_documento_legalizacion,
        consultar_prestador_por_id,
        listar_prestadores_por_categoria,
    ]