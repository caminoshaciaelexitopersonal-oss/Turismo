"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:8000/api';

interface BlogArticle {
  id: number;
  titulo: string;
  slug: string;
  imagen_principal: string | null;
  fecha_publicacion: string;
  // Para el blog, podríamos querer un extracto en la API, pero por ahora lo simulamos
  contenido: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Función para crear un extracto del contenido
const createExcerpt = (htmlContent: string, length = 150) => {
  const text = htmlContent.replace(/<[^>]+>/g, ''); // Eliminar HTML
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [ordering, setOrdering] = useState('-fecha_publicacion');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchArticles = useCallback(async (isNewSearch = false) => {
    setIsLoading(true);
    setError(null);

    const currentPage = isNewSearch ? 1 : page;

    try {
      const response = await axios.get(`${API_BASE_URL}/publicaciones/`, {
        params: {
          tipo: 'BLOG',
          search: debouncedSearchTerm,
          ordering: ordering,
          page: currentPage,
        },
      });

      const resultsWithExcerpts = response.data.results.map((article: BlogArticle) => ({
        ...article,
        contenido: createExcerpt(article.contenido || ''),
      }));

      if (isNewSearch) {
        setArticles(resultsWithExcerpts);
      } else {
        setArticles(prev => [...prev, ...resultsWithExcerpts]);
      }

      setHasNextPage(!!response.data.next);

    } catch (err) {
      setError('No se pudieron cargar los artículos del blog.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, ordering, page]);

  useEffect(() => {
    fetchArticles(true);
  }, [debouncedSearchTerm, ordering, fetchArticles]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchArticles(false);
    }
  }, [page, fetchArticles]);

  return (
    <div className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Blog de Historias Llaneras
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Sumérgete en las historias, cultura y proyectos que hacen único a Puerto Gaitán.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Buscar en el blog..."
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
            <option value="fecha_publicacion">Más antiguos</option>
            <option value="titulo">Título (A-Z)</option>
            <option value="-titulo">Título (Z-A)</option>
          </select>
        </div>

        {isLoading && page === 1 ? (
          <p className="text-center">Cargando artículos...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
            <div className="space-y-12">
              {articles.map((article) => (
                <Link key={article.id} href={`/publicaciones/${article.slug}`} className="block group">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-1 relative h-48 w-full">
                      <Image
                        src={article.imagen_principal || 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Blog'}
                        alt={article.titulo}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">{formatDate(article.fecha_publicacion)}</p>
                      <h2 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-indigo-600">
                        {article.titulo}
                      </h2>
                      <p className="mt-3 text-gray-600">
                        {article.contenido}
                      </p>
                      <p className="mt-4 text-indigo-500 font-semibold self-start">Leer artículo completo →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {articles.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 mt-8">No se encontraron artículos con los criterios actuales.</p>
            )}
            {hasNextPage && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {isLoading ? 'Cargando...' : 'Cargar más artículos'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}