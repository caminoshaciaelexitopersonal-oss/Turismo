"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { FiPlus, FiCheckCircle, FiEdit } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface
interface Atractivo {
  id: number;
  nombre: string;
  slug: string;
  categoria_color_display: string;
  es_publicado: boolean;
  fecha_actualizacion: string;
}

const AtractivosPage = () => {
  const { token } = useAuth();
  const [atractivos, setAtractivos] = useState<Atractivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Authorization': `Token ${token}` },
  });

  const fetchAtractivos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Usamos el endpoint de staff que devuelve todos los atractivos, no solo los publicados
      const response = await apiClient.get('/atractivos/');
      setAtractivos(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching atractivos:", error);
      toast.error("No se pudieron cargar los atractivos turísticos.");
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (token) {
      fetchAtractivos();
    }
  }, [token, fetchAtractivos]);

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Atractivos Turísticos</h1>
        <Link href="/dashboard/atractivos/crear" legacyBehavior>
          <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            <FiPlus className="mr-2" />
            Crear Atractivo
          </a>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8">Cargando atractivos...</td></tr>
              ) : atractivos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron atractivos turísticos.</td></tr>
              ) : (
                atractivos.map((atractivo) => (
                  <tr key={atractivo.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{atractivo.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atractivo.categoria_color_display}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {atractivo.es_publicado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheckCircle className="mr-1.5" /> Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(atractivo.fecha_actualizacion).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/atractivos/${atractivo.slug}`} legacyBehavior>
                        <a className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                          <FiEdit className="mr-1.5" /> Editar
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

export default AtractivosPage;