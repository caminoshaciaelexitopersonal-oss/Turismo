"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import SaveButton from '@/components/SaveButton';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:8000/api';

interface Atractivo {
  id: number;
  nombre: string;
  slug: string;
  categoria_color: 'AMARILLO' | 'ROJO' | 'BLANCO';
  imagen_principal: string | null;
}

const CategoriaInfo = {
  AMARILLO: { nombre: 'Cultural / Histórico', color: 'bg-yellow-400' },
  ROJO: { nombre: 'Urbano / Parque', color: 'bg-red-500' },
  BLANCO: { nombre: 'Natural', color: 'bg-blue-400' },
  TODOS: { nombre: 'Todos', color: 'bg-gray-500' }
};

export default function AtractivosPage() {
  const [atractivos, setAtractivos] = useState<Atractivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoria')?.toUpperCase();
  const [filter, setFilter] = useState<'TODOS' | 'AMARILLO' | 'ROJO' | 'BLANCO'>(() => {
    if (initialCategory && ['AMARILLO', 'ROJO', 'BLANCO'].includes(initialCategory)) {
        return initialCategory as 'AMARILLO' | 'ROJO' | 'BLANCO';
    }
    return 'TODOS';
  });

  useEffect(() => {
    const fetchAtractivos = async () => {
      setIsLoading(true);
      try {
        const params = filter === 'TODOS' ? {} : { categoria: filter };
        const response = await axios.get(`${API_BASE_URL}/atractivos/`, { params });
        setAtractivos(response.data);
      } catch (err) {
        setError('No se pudieron cargar los atractivos. Por favor, intente de nuevo más tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAtractivos();
  }, [filter]);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Atractivos Turísticos de Puerto Gaitán
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Explora la riqueza cultural, urbana y natural de nuestro paraíso.
          </p>
        </div>

        {/* Filtros */}
        <div className="mt-8 flex justify-center gap-2 flex-wrap">
          {(['TODOS', 'AMARILLO', 'ROJO', 'BLANCO'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === cat ? `${CategoriaInfo[cat].color} text-white` : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            >
              {CategoriaInfo[cat].nombre}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="mt-12">
          {isLoading ? (
            <p className="text-center">Cargando atractivos...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {atractivos.map((atractivo) => (
                <Link key={atractivo.id} href={`/atractivos/${atractivo.slug}`} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:-translate-y-2">
                    <div className="relative h-56 w-full">
                      <Image
                        src={atractivo.imagen_principal || 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Puerto+Gaitán'}
                        alt={atractivo.nombre}
                        layout="fill"
                        objectFit="cover"
                      />
                      <div className={`absolute top-0 left-0 h-full w-1 ${CategoriaInfo[atractivo.categoria_color].color}`}></div>
                      <span className={`absolute bottom-2 left-2 px-2 py-1 text-xs font-bold text-white rounded-full ${CategoriaInfo[atractivo.categoria_color].color}`}>
                        {CategoriaInfo[atractivo.categoria_color].nombre}
                      </span>
                      {/* Botón de Guardar */}
                      <SaveButton contentType="atractivoturistico" objectId={atractivo.id} />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600">
                        {atractivo.nombre}
                      </h3>
                      <div className="flex-grow"></div>
                      <p className="mt-4 text-indigo-500 font-semibold self-start">
                        Descubrir más →
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {atractivos.length === 0 && <p className="col-span-full text-center text-gray-500">No hay atractivos para mostrar en esta categoría.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}