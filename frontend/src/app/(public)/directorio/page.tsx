"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPrestadores, getCategorias, PrestadorPublico, Categoria } from '@/services/api';
import { FiSearch, FiTag } from 'react-icons/fi';

const PrestadorCard = ({ prestador }: { prestador: PrestadorPublico }) => {
  const fallbackImage = "/images/placeholder.png";

  return (
    <Link href={`/prestadores/${prestador.id}`} legacyBehavior>
      <a className="block bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1.5 transition-all duration-300 group border border-gray-200 hover:shadow-xl">
        <div className="relative h-60 w-full">
          <Image
            src={prestador.imagen_principal || fallbackImage}
            alt={`Foto de ${prestador.nombre_negocio}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 truncate">{prestador.nombre_negocio}</h3>
          <div className="mt-3 inline-flex items-center px-3 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
            <FiTag className="mr-1.5" />
            {prestador.categoria_nombre}
          </div>
        </div>
      </a>
    </Link>
  );
};

const DirectorioPage = () => {
  const [prestadores, setPrestadores] = useState<PrestadorPublico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [prestadoresData, categoriasData] = await Promise.all([
          getPrestadores(),
          getCategorias()
        ]);
        setPrestadores(prestadoresData);
        setCategorias(categoriasData);
      } catch {
        setError('No se pudieron cargar los datos del directorio. Por favor, intente más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchFilteredPrestadores = async (categoriaSlug?: string, search?: string) => {
      setIsLoading(true);
      try {
          const prestadoresData = await getPrestadores(categoriaSlug, search);
          setPrestadores(prestadoresData);
      } catch {
          setError('Error al filtrar los prestadores.');
      } finally {
          setIsLoading(false);
      }
  };

  // Efecto para re-filtrar cuando cambia la categoría o el término de búsqueda
  useEffect(() => {
      const handler = setTimeout(() => {
          fetchFilteredPrestadores(selectedCategoria, searchTerm);
      }, 300); // Debounce de 300ms

      return () => {
          clearTimeout(handler);
      };
  }, [selectedCategoria, searchTerm]);


  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Directorio de <span className="text-purple-600">Servicios Turísticos</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Encuentra hoteles, restaurantes, guías y todo lo que necesitas para tu visita.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="bg-white p-6 rounded-xl shadow-md mb-10 sticky top-4 z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre del negocio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="relative">
              <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading && <p className="text-center text-gray-500">Cargando prestadores...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!isLoading && !error && (
          prestadores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {prestadores.map((prestador) => (
                <PrestadorCard key={prestador.id} prestador={prestador} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No se encontraron prestadores que coincidan con su búsqueda.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default DirectorioPage;