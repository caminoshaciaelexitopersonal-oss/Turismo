"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SaveButton from '@/components/SaveButton';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface PublicacionDetalle {
  id: number;
  titulo: string;
  contenido: string;
  imagen_principal: string | null;
  fecha_publicacion: string;
  autor_nombre: string;
  tipo: 'NOTICIA' | 'BLOG' | 'EVENTO' | 'CAPACITACION';
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function PublicacionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [publicacion, setPublicacion] = useState<PublicacionDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      const fetchPublicacion = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/publicaciones/${slug}/`);
          setPublicacion(response.data);
        } catch (err) {
          setError('No se pudo encontrar la publicación.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPublicacion();
    }
  }, [slug]);

  if (isLoading) {
    return <div className="text-center py-20">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  if (!publicacion) {
    return null;
  }

  return (
    <article className="bg-white">
      <div className="relative w-full h-96">
        <Image
          src={publicacion.imagen_principal || 'https://via.placeholder.com/1200x500/CCCCCC/FFFFFF?text=Puerto+Gaitán'}
          alt={publicacion.titulo}
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                {publicacion.titulo}
            </h1>
            <p className="mt-2 text-lg text-gray-200">
                Publicado por {publicacion.autor_nombre || 'Dirección de Turismo'} el {formatDate(publicacion.fecha_publicacion)}
            </p>
        </div>
        <SaveButton contentType="publicacion" objectId={publicacion.id} />
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: publicacion.contenido }}
        />

        <div className="mt-12 border-t pt-8 text-center">
            <Link href={publicacion.tipo === 'NOTICIA' ? '/noticias' : '/blog'} className="text-indigo-600 hover:text-indigo-800">
                ← Volver a {publicacion.tipo === 'NOTICIA' ? 'Noticias' : 'Blog'}
            </Link>
        </div>
      </div>
    </article>
  );
}