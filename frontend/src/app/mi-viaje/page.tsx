"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE_URL = 'http://localhost:8000/api';

interface SavedItem {
  id: number;
  content_type_name: string;
  content_object: {
    id: number;
    titulo?: string;
    nombre?: string;
    slug: string;
    imagen_principal?: string | null;
  };
}

export default function MiViajePage() {
  const { user, token, isLoading: authLoading, toggleSaveItem } = useAuth();
  const router = useRouter();

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedItems = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/mi-viaje/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setSavedItems(response.data);
    } catch (err) {
      setError('No se pudieron cargar tus elementos guardados.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'TURISTA') {
        router.push('/login');
      } else {
        fetchSavedItems();
      }
    }
  }, [user, authLoading, router, fetchSavedItems]);

  const handleRemove = async (item: SavedItem) => {
    await toggleSaveItem(item.content_type_name, item.content_object.id);
    // Optimistically remove from UI, or refetch
    setSavedItems(prev => prev.filter(i => i.id !== item.id));
  };

  if (authLoading || isLoading) {
    return <div className="text-center py-20">Cargando tu viaje...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const atractivosGuardados = savedItems.filter(item => item.content_type_name === 'atractivoturistico');
  const eventosGuardados = savedItems.filter(item => item.content_type_name === 'publicacion');

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Mi Viaje
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Aquí tienes todos tus lugares y eventos favoritos. ¡Es hora de planificar!
          </p>
        </div>

        {savedItems.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-lg shadow-md">
            <p className="text-gray-500">Aún no has guardado ningún elemento.</p>
            <Link href="/atractivos" className="mt-4 inline-block text-indigo-600 hover:underline">
              ¡Empieza a explorar atractivos!
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Atractivos Guardados */}
            {atractivosGuardados.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">Mis Atractivos Guardados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {atractivosGuardados.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden group">
                      <div className="relative h-48 w-full">
                        <Image
                          src={item.content_object.imagen_principal || 'https://via.placeholder.com/400x300'}
                          alt={item.content_object.nombre || 'Imagen de atractivo guardado'}
                          layout="fill"
                          objectFit="cover"
                        />
                        <button onClick={() => handleRemove(item)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg">{item.content_object.nombre}</h3>
                        <Link href={`/atractivos/${item.content_object.slug}`} className="text-sm text-indigo-600 hover:underline">Ver detalles</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Eventos Guardados */}
            {eventosGuardados.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">Mis Eventos Guardados</h2>
                <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                  {eventosGuardados.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="font-semibold">{item.content_object.titulo}</h3>
                        <Link href={`/publicaciones/${item.content_object.slug}`} className="text-sm text-indigo-600 hover:underline">Ver detalles</Link>
                      </div>
                      <button onClick={() => handleRemove(item)} className="text-red-500 hover:text-red-700">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}