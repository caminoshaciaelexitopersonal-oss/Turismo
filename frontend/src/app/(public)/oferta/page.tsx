'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { getCategorias, getPrestadores, Categoria, PrestadorPublico } from '@/services/api';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';

// Un componente de esqueleto para la tarjeta del prestador
function PrestadorCardSkeleton() {
  return (
    <div className="border rounded-lg shadow-md animate-pulse">
      <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// El componente principal de la página
function OfertaContent() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prestadores, setPrestadores] = useState<PrestadorPublico[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms de retardo

  // Carga inicial de categorías y prestadores
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const fetchedCategorias = await getCategorias();
        // Excluimos a los artesanos de la lista de filtros principal
        setCategorias(fetchedCategorias.filter(c => c.slug !== 'artesanos'));

        const fetchedPrestadores = await getPrestadores();
        setPrestadores(fetchedPrestadores.filter(p => p.categoria_nombre !== 'Artesanos'));

        setError(null);
      } catch (err) {
        setError('No se pudo cargar la información. Por favor, inténtalo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Efecto para recargar los prestadores cuando cambia la categoría o el término de búsqueda
  useEffect(() => {
    async function loadPrestadores() {
      try {
        setLoading(true);
        const fetchedPrestadores = await getPrestadores(selectedCategoria, debouncedSearchTerm);
        // Nos aseguramos de que los artesanos no se muestren en esta vista
        setPrestadores(fetchedPrestadores.filter(p => p.categoria_nombre !== 'Artesanos'));
        setError(null);
      } catch (err) {
        setError('No se pudo cargar los prestadores. Por favor, inténtalo de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPrestadores();
  }, [selectedCategoria, debouncedSearchTerm]);

  const handleCategoriaClick = (slug: string | undefined) => {
    setSelectedCategoria(slug);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-4">Directorio Turístico</h1>

      {/* Barra de Búsqueda */}
      <div className="w-full max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="¿Qué estás buscando? (ej. hotel, restaurante)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtros de Categoría */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => handleCategoriaClick(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            !selectedCategoria ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoriaClick(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              selectedCategoria === cat.slug ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Grid de Prestadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          // Mostrar esqueletos mientras carga
          Array.from({ length: 8 }).map((_, index) => <PrestadorCardSkeleton key={index} />)
        ) : prestadores.length > 0 ? (
          prestadores.map((prestador) => (
            <Link key={prestador.id} href={`/oferta/${prestador.id}`} legacyBehavior>
              <a className="border rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group">
                <div className="relative w-full h-48">
                  {prestador.imagen_principal ? (
                    <Image
                      src={prestador.imagen_principal}
                      alt={`Imagen de ${prestador.nombre_negocio}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold">{prestador.nombre_negocio}</h3>
                  <p className="text-sm text-gray-600">{prestador.categoria_nombre}</p>
                </div>
              </a>
            </Link>
          ))
        ) : (
          <p className="text-center col-span-full">
            No se encontraron resultados para tu búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}

export default function OfertaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <OfertaContent />
    </Suspense>
  );
}