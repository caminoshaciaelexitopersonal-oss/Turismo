"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:8000/api';

interface Publicacion {
  id: number;
  tipo: string;
  titulo: string;
  slug: string;
  imagen_principal: string | null;
  fecha_evento_inicio: string | null;
  fecha_publicacion: string;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Fecha no especificada';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function CapacitacionesPage() {
  const [capacitaciones, setCapacitaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/publicaciones/`, {
          params: { tipo: 'CAPACITACION' },
        });
        setCapacitaciones(response.data);
      } catch (err) {
        setError('No se pudieron cargar las capacitaciones. Por favor, intente de nuevo más tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Capacitaciones para Prestadores
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Fortalece tus habilidades y mejora tu oferta turística con nuestros programas de formación.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center">Cargando capacitaciones...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capacitaciones.length > 0 ? (
              capacitaciones.map((cap) => (
                <Link key={cap.id} href={`/publicaciones/${cap.slug}`} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:-translate-y-2">
                    <div className="relative h-48 w-full">
                      <Image
                        src={cap.imagen_principal || 'https://via.placeholder.com/400x300/4B5563/FFFFFF?text=Capacitación'}
                        alt={cap.titulo}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <p className="text-sm text-indigo-600 font-semibold">
                        Inicia: {formatDate(cap.fecha_evento_inicio)}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-indigo-700">
                        {cap.titulo}
                      </h3>
                      <div className="flex-grow"></div>
                      <p className="mt-4 text-indigo-500 font-semibold self-start">
                        Ver Detalles →
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No hay capacitaciones programadas en este momento.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}