"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getLocations, Location } from '@/services/api';
import Link from 'next/link';

// Fix para el problema de los iconos por defecto en Leaflet con Webpack/Next.js
// @ts-expect-error - This is a known workaround for a Leaflet/Next.js compatibility issue.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const getIcon = () => {
  // Por ahora, todos los marcadores usan el mismo icono por defecto.
  // La lógica para iconos personalizados basados en el 'type' se puede añadir aquí en el futuro.
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};


const MapaInteractivoPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapCenter: L.LatLngExpression = [4.1426, -72.6453]; // Coordenadas de Puerto Gaitán

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (err) {
        setError('No se pudieron cargar las ubicaciones para el mapa.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  return (
    <div className="flex flex-col h-screen">
       <header className="bg-white shadow-md z-20">
        <div className="container mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Mapa Interactivo del Municipio
          </h1>
          <p className="mt-2 text-md text-gray-600 max-w-2xl mx-auto">
            Explora los atractivos turísticos y prestadores de servicios en Puerto Gaitán.
          </p>
        </div>
      </header>

      <main className="flex-grow">
        {isLoading && <div className="flex items-center justify-center h-full"><p>Cargando mapa...</p></div>}
        {error && <div className="flex items-center justify-center h-full"><p className="text-red-500">{error}</p></div>}

        {!isLoading && !error && (
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locations.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={getIcon(loc.tipo)}>
                <Popup>
                  <div className="font-sans">
                    <h4 className="font-bold text-md mb-1">{loc.nombre}</h4>
                    <p className="text-sm text-gray-600 capitalize mb-2">{loc.tipo.replace(/_/g, ' ')}</p>
                    {loc.url_detalle && (
                       <Link href={loc.url_detalle} legacyBehavior>
                        <a className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                          Ver más detalles &rarr;
                        </a>
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </main>
    </div>
  );
};

export default MapaInteractivoPage;