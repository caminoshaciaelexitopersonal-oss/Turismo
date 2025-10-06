"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getResenas, createResena, Resena, CreateResenaPayload } from '@/services/api';
import { FiStar, FiSend } from 'react-icons/fi';

// --- Componente para mostrar estrellas ---
const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const starClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <FiStar
          key={index}
          className={`${starClasses[size]} ${
            index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill={index < Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
};


// --- Formulario para dejar una reseña ---
const ResenaForm = ({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (calificacion: number, comentario: string) => void;
  isSubmitting: boolean;
}) => {
  const [calificacion, setCalificacion] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calificacion === 0 || !comentario) {
      alert('Por favor, seleccione una calificación y escriba un comentario.');
      return;
    }
    onSubmit(calificacion, comentario);
    setCalificacion(0);
    setComentario('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border mt-6">
      <h4 className="font-bold text-lg mb-4">Deja tu reseña</h4>
      <div className="flex items-center mb-4">
        <p className="mr-4 text-gray-700">Tu calificación:</p>
        <div className="flex" onMouseLeave={() => setHoverRating(0)}>
            {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
                <FiStar
                key={index}
                className={`w-8 h-8 cursor-pointer ${
                    ratingValue <= (hoverRating || calificacion) ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill={ratingValue <= (hoverRating || calificacion) ? 'currentColor' : 'none'}
                onClick={() => setCalificacion(ratingValue)}
                onMouseEnter={() => setHoverRating(ratingValue)}
                />
            );
            })}
        </div>
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escribe tu comentario aquí..."
        rows={4}
        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
      >
        <FiSend className="mr-2" />
        {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
      </button>
    </form>
  );
};


// --- Componente principal de la sección de reseñas ---
interface ResenasSectionProps {
    contentType: 'prestadorservicio' | 'artesano';
    objectId: number;
}

export const ResenasSection: React.FC<ResenasSectionProps> = ({ contentType, objectId }) => {
    const { isAuthenticated } = useAuth();
    const [resenas, setResenas] = useState<Resena[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchResenas = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getResenas(contentType, objectId);
            setResenas(data);
        } catch (err) {
            setError("No se pudieron cargar las reseñas.");
        } finally {
            setIsLoading(false);
        }
    }, [contentType, objectId]);

    useEffect(() => {
        fetchResenas();
    }, [fetchResenas]);

    const handleCreateResena = async (calificacion: number, comentario: string) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: CreateResenaPayload = {
                calificacion,
                comentario,
                content_type: contentType,
                object_id: objectId,
            };
            await createResena(payload);
            // Refrescar la lista de reseñas para mostrar la nueva (aunque estará pendiente de aprobación)
            // Opcional: mostrar un mensaje de "reseña enviada para moderación"
            alert("¡Gracias! Tu reseña ha sido enviada y estará visible una vez sea aprobada.");
            fetchResenas();
        } catch (err) {
            setError("Error al enviar tu reseña. Es posible que ya hayas dejado una.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const promedioCalificaciones = resenas.length > 0
        ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
        : 0;

    return (
        <section className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-6">
                Calificaciones y Reseñas
            </h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className="text-center">
                    <p className="text-5xl font-bold text-gray-800">{promedioCalificaciones.toFixed(1)}</p>
                    <StarRating rating={promedioCalificaciones} size="md" />
                    <p className="text-gray-600 mt-1">Basado en {resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'}</p>
                </div>
                {/* Aquí se podrían añadir barras de progreso por cada estrella (5, 4, 3, etc.) */}
            </div>

            {/* Lista de Reseñas */}
            <div className="space-y-6">
                {isLoading && <p>Cargando reseñas...</p>}
                {!isLoading && resenas.length === 0 && <p className="text-gray-500">Aún no hay reseñas. ¡Sé el primero en dejar una!</p>}
                {resenas.map(resena => (
                    <div key={resena.id} className="bg-white p-5 rounded-lg shadow-sm border">
                        <div className="flex items-center mb-2">
                            <StarRating rating={resena.calificacion} size="sm" />
                            <p className="ml-4 font-bold text-gray-700">{resena.usuario_nombre}</p>
                        </div>
                        <p className="text-gray-600">{resena.comentario}</p>
                        <p className="text-xs text-gray-400 mt-2 text-right">{new Date(resena.fecha_creacion).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>

            {/* Formulario para nueva reseña */}
            {isAuthenticated ? (
                 <ResenaForm onSubmit={handleCreateResena} isSubmitting={isSubmitting} />
            ) : (
                <p className="mt-8 text-center bg-gray-100 p-4 rounded-lg">
                    <a href="/login" className="font-bold text-blue-600 hover:underline">Inicia sesión</a> para dejar una reseña.
                </p>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </section>
    );
};