"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import SaveButton from '@/components/SaveButton';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:8000/api';

interface Publicacion {
  id: number;
  tipo: 'EVENTO' | 'CAPACITACION' | 'NOTICIA' | 'BLOG';
  titulo: string;
  slug: string;
  imagen_principal: string | null;
  fecha_evento_inicio: string | null;
  fecha_evento_fin: string | null;
  fecha_publicacion: string;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Fecha no especificada';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};

export default function CalendarioPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'TODOS' | 'EVENTO' | 'CAPACITACION'>('TODOS');

  useEffect(() => {
    const fetchPublicaciones = async () => {
      setIsLoading(true);
      try {
        // Gracias al backend optimizado, ahora podemos pedir ambos tipos en una sola llamada.
        const response = await axios.get(`${API_BASE_URL}/publicaciones/`, {
          params: {
            tipo: 'EVENTO,CAPACITACION'
          }
        });

        // Ordenamos los resultados por fecha de publicación descendente
        const sortedPublicaciones = response.data.sort((a: Publicacion, b: Publicacion) =>
          new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
        );
        setPublicaciones(sortedPublicaciones);

      } catch (err) {
        setError('No se pudieron cargar las actividades. Por favor, intente de nuevo más tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicaciones();
  }, []);

  const filteredPublicaciones = useMemo(() => {
    if (filter === 'TODOS') {
      return publicaciones;
    }
    return publicaciones.filter(p => p.tipo === filter);
  }, [filter, publicaciones]);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Calendario de Actividades
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Descubre todo lo que Puerto Gaitán tiene para ofrecer.
          </p>
        </div>

        {/* Filtros */}
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setFilter('TODOS')} className={`px-4 py-2 rounded-full text-sm font-semibold ${filter === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}>
            Todas
          </button>
          <button onClick={() => setFilter('EVENTO')} className={`px-4 py-2 rounded-full text-sm font-semibold ${filter === 'EVENTO' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}>
            Eventos
          </button>
          <button onClick={() => setFilter('CAPACITACION')} className={`px-4 py-2 rounded-full text-sm font-semibold ${filter === 'CAPACITACION' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}>
            Capacitaciones
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-12">
          {isLoading ? (
            <p className="text-center">Cargando actividades...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublicaciones.map((pub) => (
                <Link key={pub.id} href={`/publicaciones/${pub.slug}`} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                    <div className="relative h-48 w-full">
                      <Image
                        src={pub.imagen_principal || 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Imagen'}
                        alt={pub.titulo}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pub.tipo === 'EVENTO' ? 'Evento' : 'Capacitación'}
                      </span>
                      {/* Botón de Guardar */}
                      <SaveButton contentType="publicacion" objectId={pub.id} />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600">
                        {pub.titulo}
                      </h3>
                      <div className="mt-2 text-sm text-gray-600 flex-grow">
                        <p><strong>Inicio:</strong> {formatDate(pub.fecha_evento_inicio)}</p>
                        {pub.fecha_evento_fin && <p><strong>Fin:</strong> {formatDate(pub.fecha_evento_fin)}</p>}
                      </div>
                      <p className="mt-4 text-indigo-500 font-semibold self-start">Ver más →</p>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredPublicaciones.length === 0 && <p className="col-span-full text-center text-gray-500">No hay actividades para mostrar en esta categoría.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}