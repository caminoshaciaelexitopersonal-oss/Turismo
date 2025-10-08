import os
import httpx
from math import radians, cos, sin, asin, sqrt
from langchain_core.tools import tool
from typing import Optional, Dict, Any, List
from asgiref.sync import sync_to_async

from api.models import AtractivoTuristico, PrestadorServicio, Artesano, CustomUser, SiteConfiguration

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia en kilómetros entre dos puntos geográficos.
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radio de la Tierra en kilómetros
    return c * r

@tool
async def find_nearby_places_tool(latitude: float, longitude: float, category: str, radius_km: float = 5.0) -> Dict[str, Any]:
    """
    (SOLDADO DE RECONOCIMIENTO) Encuentra puntos de interés (atractivos, prestadores, artesanos)
    cerca de una ubicación dada, dentro de un radio específico en kilómetros.
    La categoría puede ser 'atractivo', 'prestador' o 'artesano'.
    """
    print(f"--- 💥 SOLDADO (Reconocimiento Geo): ¡ACCIÓN! Buscando '{category}' cerca de ({latitude}, {longitude}) en un radio de {radius_km}km. ---")

    places = []

    if category == 'atractivo':
        queryset = await sync_to_async(list)(AtractivoTuristico.objects.filter(es_publicado=True, latitud__isnull=False, longitud__isnull=False))
    elif category == 'prestador':
        queryset = await sync_to_async(list)(PrestadorServicio.objects.filter(aprobado=True, latitud__isnull=False, longitud__isnull=False))
    elif category == 'artesano':
        queryset = await sync_to_async(list)(Artesano.objects.filter(aprobado=True, latitud__isnull=False, longitud__isnull=False))
    else:
        return {"status": "error", "message": "Categoría no válida. Debe ser 'atractivo', 'prestador' o 'artesano'."}

    for place in queryset:
        dist = haversine_distance(latitude, longitude, place.latitud, place.longitud)
        if dist <= radius_km:
            places.append({
                "nombre": getattr(place, 'nombre', getattr(place, 'nombre_negocio', getattr(place, 'nombre_taller', 'N/A'))),
                "distancia_km": round(dist, 2),
                "destino_lat": place.latitud,
                "destino_lon": place.longitud,
            })

    if not places:
        return {"status": "success", "message": f"No se encontraron lugares de la categoría '{category}' en un radio de {radius_km} km."}

    # Ordenar por distancia
    sorted_places = sorted(places, key=lambda p: p['distancia_km'])
    return {"status": "success", "count": len(sorted_places), "lugares": sorted_places}

@tool
async def get_directions_tool(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> Dict[str, Any]:
    """
    (SOLDADO DE NAVEGACIÓN) Obtiene indicaciones de ruta entre un punto de origen y uno de destino.
    Utiliza una API de mapas externa (Google Maps).
    """
    print(f"--- 💥 SOLDADO (Navegación): ¡ACCIÓN! Calculando ruta desde ({origin_lat}, {origin_lon}) hasta ({dest_lat}, {dest_lon}). ---")

    try:
        site_config = await sync_to_async(SiteConfiguration.load)()
        api_key = site_config.google_maps_api_key
        if not api_key:
            return {"status": "error", "message": "La clave de API de Google Maps no está configurada en el sistema."}
    except Exception as e:
        return {"status": "error", "message": f"No se pudo cargar la configuración del sitio: {e}"}

    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin_lat},{origin_lon}&destination={dest_lat},{dest_lon}&key={api_key}&language=es"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

        if data['status'] == 'OK':
            # Extraer y simplificar las indicaciones
            steps = data['routes'][0]['legs'][0]['steps']
            directions = [step['html_instructions'].replace('<b>', '').replace('</b>', '') for step in steps]
            return {"status": "success", "indicaciones": directions}
        else:
            return {"status": "error", "message": f"La API de mapas devolvió un error: {data.get('error_message', data['status'])}"}
    except httpx.RequestError as e:
        return {"status": "error", "message": f"Error de conexión a la API de mapas: {e}"}

@tool
async def get_user_location_from_profile_tool(user_id: int) -> Dict[str, Any]:
    """
    (SOLDADO DE INTELIGENCIA) Obtiene las coordenadas de ubicación (latitud, longitud)
    de un usuario desde su perfil, si están disponibles.
    Solo los prestadores y artesanos tienen ubicación en su perfil. Los turistas no.
    """
    print(f"--- 💥 SOLDADO (Inteligencia): ¡ACCIÓN! Obteniendo ubicación del perfil del usuario ID {user_id}. ---")
    try:
        user = await CustomUser.objects.select_related('perfil_prestador', 'perfil_artesano').aget(id=user_id)

        location = None
        if hasattr(user, 'perfil_prestador') and user.perfil_prestador.latitud and user.perfil_prestador.longitud:
            location = {"latitude": user.perfil_prestador.latitud, "longitude": user.perfil_prestador.longitud}
        elif hasattr(user, 'perfil_artesano') and user.perfil_artesano.latitud and user.perfil_artesano.longitud:
            location = {"latitude": user.perfil_artesano.latitud, "longitude": user.perfil_artesano.longitud}

        if location:
            return {"status": "success", "location": location}
        else:
            return {"status": "not_found", "message": "El usuario no tiene una ubicación registrada en su perfil."}

    except CustomUser.DoesNotExist:
        return {"status": "error", "message": f"Usuario con ID {user_id} no encontrado."}

def get_navigation_soldiers() -> List[Any]:
    """Recluta y devuelve la Escuadra de Navegación completa."""
    return [
        find_nearby_places_tool,
        get_directions_tool,
        get_user_location_from_profile_tool,
    ]