'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { getPrestadorById, PrestadorPublicoDetalle } from '@/services/api';
import Link from 'next/link';
import Image from 'next/image';

// Componente de esqueleto para la página de detalle
function DetailPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-10 bg-gray-300 rounded w-2/3 mx-auto mb-4"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="h-64 bg-gray-300 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
        <div>
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

// Componente principal del detalle
function PrestadorDetailPageContent() {
  const params = useParams();
// Obtenemos el ID de los parámetros de la ruta.
// Puede ser nulo en la primera renderización, así que lo manejamos con elegancia.
  const id = params && params.id ? parseInt(params.id as string, 10) : null;

  const [prestador, setPrestador] = useState<PrestadorPublicoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  // No iniciar la carga si el ID aún no está disponible.
  // El hook se volverá a ejecutar cuando el 'id' cambie de null a un valor.
  if (id === null) {
    return;
  }

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getPrestadorById(id);
        setPrestador(data);
        setError(null);
      } catch (err) {
        setError('No se pudo encontrar el prestador de servicios. Es posible que ya no esté disponible.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-xl">{error}</p>
        <Link href="/prestadores" legacyBehavior>
          <a className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Volver al Directorio
          </a>
        </Link>
      </div>
    );
  }

  if (!prestador) {
    return null; // O un mensaje de "no encontrado" más genérico si se prefiere
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold">{prestador.nombre_negocio}</h1>
        <p className="text-xl text-gray-600 mt-2">{prestador.categoria.nombre}</p>
      </div>

      {/* Galería de Imágenes */}
      {prestador.galeria_imagenes && prestador.galeria_imagenes.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {prestador.galeria_imagenes.map((img) => (
              <div key={img.id} className="relative h-48 w-full overflow-hidden rounded-lg shadow-md">
                <Image src={img.imagen} alt={img.alt_text || `Imagen de ${prestador.nombre_negocio}`} layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Descripción</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{prestador.descripcion || 'No hay descripción disponible.'}</p>

          {prestador.promociones_ofertas && (
            <>
              <h2 className="text-2xl font-semibold border-b pb-2 mt-8 mb-4">Promociones y Ofertas</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{prestador.promociones_ofertas}</p>
            </>
          )}
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Contacto</h2>
          <ul className="space-y-3 text-gray-800">
            {prestador.telefono && <li><strong>Teléfono:</strong> {prestador.telefono}</li>}
            {prestador.email_contacto && <li><strong>Email:</strong> {prestador.email_contacto}</li>}
            {prestador.ubicacion_mapa && <li><strong>Ubicación:</strong> {prestador.ubicacion_mapa}</li>}
            {prestador.red_social_whatsapp && <li><strong>WhatsApp:</strong> {prestador.red_social_whatsapp}</li>}
            {prestador.red_social_facebook && <li><a href={prestador.red_social_facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook</a></li>}
            {prestador.red_social_instagram && <li><a href={prestador.red_social_instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Instagram</a></li>}
          </ul>
        </div>
      </div>

       <div className="text-center mt-12">
            <Link href="/prestadores" legacyBehavior>
                <a className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    &larr; Volver al Directorio
                </a>
            </Link>
        </div>
    </div>
  );
}


export default function PrestadorDetailPage() {
    return (
        <Suspense fallback={<DetailPageSkeleton />}>
            <PrestadorDetailPageContent />
        </Suspense>
    )
}