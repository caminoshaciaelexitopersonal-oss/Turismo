"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ConsejoPublicacion {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  documento_adjunto: string | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ConsejoConsultivoPage() {
  const [publicaciones, setPublicaciones] = useState<ConsejoPublicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicaciones = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/consejo-consultivo/`);
        setPublicaciones(response.data);
      } catch (err) {
        setError('No se pudo cargar la información. Por favor, intente de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicaciones();
  }, []);

  return (
    <div className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Consejo Consultivo de Turismo
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Información, actas y noticias relevantes sobre la gestión turística del municipio.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center">Cargando publicaciones...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="space-y-8">
            {publicaciones.length > 0 ? (
              publicaciones.map((pub) => (
                <div key={pub.id} className="p-6 border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">{formatDate(pub.fecha_publicacion)}</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{pub.titulo}</h2>
                  <div className="mt-4 text-gray-700" dangerouslySetInnerHTML={{ __html: pub.contenido.replace(/\n/g, '<br />') }} />
                  {pub.documento_adjunto && (
                    <div className="mt-6">
                      <a
                        href={pub.documento_adjunto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Descargar Documento Adjunto
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No hay publicaciones del Consejo Consultivo disponibles en este momento.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}