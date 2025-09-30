"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para el ícono por defecto de Leaflet que se rompe con Webpack/Next.js
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetinaUrl.src,
    iconUrl: iconUrl.src,
    shadowUrl: shadowUrl.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Interfaz para los datos de ubicación que el mapa espera
interface Location {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    tipo: string;
    url_detalle: string | null;
}

interface InteractiveMapProps {
  locations: Location[];
}

const InteractiveMap = ({ locations }: InteractiveMapProps) => {
  // Coordenadas del centro del mapa (ej: centradas en Puerto Gaitán)
  const mapCenter: [number, number] = [4.315, -72.085];

  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map(location => (
        <Marker key={location.id} position={[location.lat, location.lng]}>
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold text-lg mb-1">{location.nombre}</h3>
              <p className="capitalize text-sm text-gray-600 mb-2">{location.tipo.replace(/_/g, ' ')}</p>
              {location.url_detalle && (
                <a href={location.url_detalle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Ver más detalles
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default InteractiveMap;