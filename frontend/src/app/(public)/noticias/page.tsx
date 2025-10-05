"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Noticia {
  id: number;
  titulo: string;
  slug: string;
  imagen_principal: string | null;
  fecha_publicacion: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [ordering, setOrdering] = useState('-fecha_publicacion'); // Más recientes primero

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchNoticias = useCallback(async (isNewSearch = false) => {
    setIsLoading(true);
    setError(null);

    const currentPage = isNewSearch ? 1 : page;

    try {
      const response = await axios.get(`${API_BASE_URL}/publicaciones/`, {
        params: {
          tipo: 'NOTICIA',
          search: debouncedSearchTerm,
          ordering: ordering,
          page: currentPage,
        },
      });

      if (isNewSearch) {
        setNoticias(response.data.results);
      } else {
        setNoticias(prev => [...prev, ...response.data.results]);
      }

      setHasNextPage(!!response.data.next);

    } catch (err) {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, ordering, page]);

  useEffect(() => {
    fetchNoticias(true);
  }, [debouncedSearchTerm, ordering, fetchNoticias]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchNoticias(false);
    }
  }, [page, fetchNoticias]);


  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Noticias de Puerto Gaitán
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Mantente al día con las últimas novedades y acontecimientos de nuestro municipio.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm"
          />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
          >
            <option value="-fecha_publicacion">Más recientes</option>
            <option value="fecha_publicacion">Más antiguas</option>
            <option value="titulo">Título (A-Z)</option>
            <option value="-titulo">Título (Z-A)</option>
          </select>
        </div>

        {isLoading && page === 1 ? (
          <p className="text-center">Cargando noticias...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {noticias.map((noticia) => (
                <Link key={noticia.id} href={`/publicaciones/${noticia.slug}`} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                    <div className="relative h-48 w-full">
                      <Image
                        src={noticia.imagen_principal || 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Noticia'}
                        alt={noticia.titulo}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <p className="text-sm text-gray-500">{formatDate(noticia.fecha_publicacion)}</p>
                      <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-indigo-600 flex-grow">
                        {noticia.titulo}
                      </h3>
                      <p className="mt-4 text-indigo-500 font-semibold self-start">Leer más →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {noticias.length === 0 && !isLoading && (
              <p className="col-span-full text-center text-gray-500 mt-8">No se encontraron noticias con los criterios actuales.</p>
            )}
            {hasNextPage && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {isLoading ? 'Cargando...' : 'Cargar más noticias'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}