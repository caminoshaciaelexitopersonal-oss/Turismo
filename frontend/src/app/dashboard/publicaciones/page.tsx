"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { FiPlus, FiEdit, FiEye, FiFilter } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces
interface Publicacion {
  id: number;
  titulo: string;
  tipo: string;
  estado: string;
  estado_display: string;
  autor_nombre: string;
  fecha_publicacion: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PUBLICADO':
      return 'bg-green-100 text-green-800';
    case 'PENDIENTE_DIRECTIVO':
    case 'PENDIENTE_ADMIN':
      return 'bg-yellow-100 text-yellow-800';
    case 'BORRADOR':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const PublicacionesPage = () => {
  const { token } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Authorization': `Token ${token}` },
  });

  const fetchPublicaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/publicaciones/');
      setPublicaciones(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching publicaciones:", error);
      toast.error("No se pudieron cargar las publicaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (token) {
      fetchPublicaciones();
    }
  }, [token, fetchPublicaciones]);

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Publicaciones</h1>
        <Link href="/dashboard/publicaciones/crear" legacyBehavior>
          <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            <FiPlus className="mr-2" />
            Crear Publicación
          </a>
        </Link>
      </div>

      {/* Aquí se podrían añadir filtros por estado o tipo */}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando publicaciones...</td></tr>
              ) : publicaciones.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No se encontraron publicaciones.</td></tr>
              ) : (
                publicaciones.map((pub) => (
                  <tr key={pub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pub.titulo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pub.tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pub.estado)}`}>
                        {pub.estado_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pub.autor_nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(pub.fecha_publicacion).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/publicaciones/${pub.id}`} legacyBehavior>
                        <a className="text-blue-600 hover:text-blue-900">
                          {pub.estado === 'BORRADOR' ? 'Editar' : 'Gestionar'}
                        </a>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PublicacionesPage;