"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getArtesanos, getRubrosArtesano, ArtesanoPublico, RubroArtesano } from '@/services/api';
import { FiSearch, FiTag } from 'react-icons/fi';

const ArtesanoCard = ({ artesano }: { artesano: ArtesanoPublico }) => {
  const fallbackImage = "/images/placeholder.png";

  return (
    <Link href={`/artesanos/${artesano.id}`} legacyBehavior>
      <a className="block bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1.5 transition-all duration-300 group border border-gray-200 hover:shadow-xl">
        <div className="relative h-60 w-full">
          <Image
            src={artesano.foto_url || fallbackImage}
            alt={`Foto de ${artesano.nombre_taller}`}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 truncate">{artesano.nombre_taller}</h3>
          <p className="text-sm text-gray-600">{artesano.nombre_artesano}</p>
          <div className="mt-3 inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
            <FiTag className="mr-1.5" />
            {artesano.rubro_nombre}
          </div>
        </div>
      </a>
    </Link>
  );
};

const ArtesanosPage = () => {
  const [artesanos, setArtesanos] = useState<ArtesanoPublico[]>([]);
  const [rubros, setRubros] = useState<RubroArtesano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubro, setSelectedRubro] = useState('');

  // Carga inicial de rubros
  useEffect(() => {
    const fetchRubros = async () => {
      try {
        const rubrosData = await getRubrosArtesano();
        setRubros(rubrosData);
      } catch (err) {
        console.error("Error al cargar rubros:", err);
        // Non-critical error, so we don't set the main error state
      }
    };
    fetchRubros();
  }, []);

  // Carga de artesanos (inicial y con filtros)
  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchFilteredArtesanos = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const artesanosData = await getArtesanos(selectedRubro, searchTerm);
          setArtesanos(artesanosData);
        } catch (err) {
          console.error("Error al filtrar artesanos:", err);
          setError('Error al cargar los artesanos.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchFilteredArtesanos();
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [selectedRubro, searchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Directorio de <span className="text-blue-600">Artesanos</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Descubre el talento y la creatividad de los artesanos de nuestro municipio.
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
                placeholder="Buscar por nombre de taller o artesano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedRubro}
                onChange={(e) => setSelectedRubro(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Todos los Rubros</option>
                {rubros.map(rubro => (
                  <option key={rubro.id} value={rubro.slug}>{rubro.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">Cargando artesanos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          artesanos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artesanos.map((artesano) => (
                <ArtesanoCard key={artesano.id} artesano={artesano} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No se encontraron artesanos que coincidan con su búsqueda.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default ArtesanosPage;