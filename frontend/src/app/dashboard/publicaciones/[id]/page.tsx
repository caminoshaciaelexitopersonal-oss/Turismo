"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiSave, FiSend, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';

// Interfaces
interface PublicacionDetalle {
  id: number;
  titulo: string;
  contenido: string;
  tipo: 'EVENTO' | 'NOTICIA' | 'BLOG' | 'CAPACITACION';
  estado: 'BORRADOR' | 'PENDIENTE_DIRECTIVO' | 'PENDIENTE_ADMIN' | 'PUBLICADO';
  subcategoria_evento?: string;
  fecha_evento_inicio?: string;
  fecha_evento_fin?: string;
  imagen_principal?: string | File;
}

const PublicacionEditPage = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id; // Puede ser 'crear' o un número
  const isCreating = id === 'crear';

  const [publicacion, setPublicacion] = useState<PublicacionDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(!isCreating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PublicacionDetalle>();
  const tipoPublicacion = watch('tipo');

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Authorization': `Token ${token}` },
  });

  const fetchPublicacion = useCallback(async (pubId: string) => {
    try {
      const response = await apiClient.get(`/admin/publicaciones/${pubId}/`);
      setPublicacion(response.data);
      reset(response.data); // Cargar datos en el formulario
    } catch (error) {
      toast.error("No se pudo cargar la publicación.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, reset]);

  useEffect(() => {
    if (!isCreating && id && token) {
      fetchPublicacion(id as string);
    }
  }, [id, token, isCreating, fetchPublicacion]);

  const onSubmit = async (data: PublicacionDetalle) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // Añadir todos los campos al FormData
    Object.keys(data).forEach(key => {
        const value = data[key as keyof PublicacionDetalle];
        if (key === 'imagen_principal' && value instanceof File) {
            formData.append(key, value);
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    try {
      const url = isCreating ? '/admin/publicaciones/' : `/admin/publicaciones/${id}/`;
      const method = isCreating ? 'post' : 'patch';

      await apiClient({
          method: method,
          url: url,
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Publicación ${isCreating ? 'creada' : 'actualizada'} con éxito.`);
      router.push('/dashboard/publicaciones');
    } catch (error) {
      toast.error("Hubo un error al guardar la publicación.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: 'submit-for-approval' | 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
        await apiClient.post(`/admin/publicaciones/${id}/${action}/`);
        toast.success("Acción completada con éxito.");
        router.push('/dashboard/publicaciones');
    } catch (error) {
        toast.error("Error al realizar la acción.");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Cargando...</p>;

  const canEdit = publicacion?.estado === 'BORRADOR' || isCreating;

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <Link href="/dashboard/publicaciones" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <FiArrowLeft className="mr-2" />
          Volver a Publicaciones
      </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isCreating ? 'Crear Nueva Publicación' : `Gestionar: ${publicacion?.titulo}`}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título</label>
                <input type="text" id="titulo" {...register('titulo', { required: 'El título es obligatorio' })} disabled={!canEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
            </div>

            {/* Tipo de Publicación */}
            <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
                <select id="tipo" {...register('tipo')} disabled={!canEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value="NOTICIA">Noticia</option>
                    <option value="EVENTO">Evento</option>
                    <option value="BLOG">Blog</option>
                    <option value="CAPACITACION">Capacitación</option>
                </select>
            </div>

            {/* Imagen Principal */}
            <div>
                <label htmlFor="imagen_principal" className="block text-sm font-medium text-gray-700">Imagen Principal</label>
                <input type="file" id="imagen_principal" onChange={(e) => reset({ ...watch(), imagen_principal: e.target.files?.[0] })} disabled={!canEdit} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>

            {/* Campos específicos para Evento */}
            {tipoPublicacion === 'EVENTO' && (
                <>
                    <div>
                        <label htmlFor="fecha_evento_inicio" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                        <input type="datetime-local" id="fecha_evento_inicio" {...register('fecha_evento_inicio')} disabled={!canEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="fecha_evento_fin" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                        <input type="datetime-local" id="fecha_evento_fin" {...register('fecha_evento_fin')} disabled={!canEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                </>
            )}

            {/* Contenido */}
            <div className="md:col-span-2">
                <label htmlFor="contenido" className="block text-sm font-medium text-gray-700">Contenido</label>
                <textarea id="contenido" {...register('contenido')} rows={10} disabled={!canEdit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
            </div>
        </div>

        {/* --- Botones de Acción --- */}
        <div className="mt-8 flex items-center justify-end space-x-4">
            {canEdit && (
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <FiSave className="mr-2"/> {isCreating ? 'Crear Borrador' : 'Guardar Cambios'}
                </button>
            )}

            {publicacion?.estado === 'BORRADOR' && (
                <button type="button" onClick={() => handleAction('submit-for-approval')} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600">
                    <FiSend className="mr-2"/> Enviar para Aprobación
                </button>
            )}

            {(user?.role === 'FUNCIONARIO_DIRECTIVO' || user?.role === 'ADMIN') && publicacion?.estado === 'PENDIENTE_DIRECTIVO' && (
                 <button type="button" onClick={() => handleAction('approve')} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                    <FiCheck className="mr-2"/> Aprobar (como Directivo)
                </button>
            )}

            {user?.role === 'ADMIN' && publicacion?.estado === 'PENDIENTE_ADMIN' && (
                 <button type="button" onClick={() => handleAction('approve')} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                    <FiCheck className="mr-2"/> Aprobar y Publicar
                </button>
            )}

            {(user?.role === 'FUNCIONARIO_DIRECTIVO' || user?.role === 'ADMIN') && ['PENDIENTE_DIRECTIVO', 'PENDIENTE_ADMIN'].includes(publicacion?.estado || '') && (
                <button type="button" onClick={() => handleAction('reject')} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600">
                    <FiX className="mr-2"/> Rechazar
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default PublicacionEditPage;