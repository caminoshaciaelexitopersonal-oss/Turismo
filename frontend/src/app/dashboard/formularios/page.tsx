"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { FiPlus, FiEdit, FiFileText, FiShield } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces
interface Formulario {
  id: number;
  titulo: string;
  descripcion: string;
  categoria_nombre?: string;
}

interface Plantilla {
    id: number;
    nombre: string;
    descripcion: string;
    categoria_prestador_nombre?: string;
}


const FormList = ({ type }: { type: 'caracterizacion' | 'verificacion' }) => {
    const { token } = useAuth();
    const [items, setItems] = useState<(Formulario | Plantilla)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isCaracterizacion = type === 'caracterizacion';
    const title = isCaracterizacion ? 'Formularios de Caracterización' : 'Plantillas de Verificación';
    const endpoint = isCaracterizacion ? '/formularios/' : '/plantillas-verificacion/';
    const createUrl = isCaracterizacion ? '/dashboard/formularios/caracterizacion/crear' : '/dashboard/formularios/verificacion/crear';
    const editUrlPrefix = isCaracterizacion ? '/dashboard/formularios/caracterizacion' : '/dashboard/formularios/verificacion';

    const apiClient = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
        headers: { 'Authorization': `Token ${token}` },
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(endpoint);
            setItems(response.data.results || response.data);
        } catch (error) {
            toast.error(`No se pudieron cargar los ${title.toLowerCase()}.`);
        } finally {
            setIsLoading(false);
        }
    }, [apiClient, endpoint, title]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
                <Link href={createUrl} legacyBehavior>
                    <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                        <FiPlus className="mr-2"/> Crear Nuevo
                    </a>
                </Link>
            </div>
            <div className="space-y-3">
                {isLoading ? <p>Cargando...</p> : items.length === 0 ? <p className="text-gray-500">No hay elementos creados.</p> :
                    items.map(item => (
                        <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800">{(item as Formulario).titulo || (item as Plantilla).nombre}</h3>
                                <p className="text-sm text-gray-600">{item.descripcion}</p>
                            </div>
                            <Link href={`${editUrlPrefix}/${item.id}`} legacyBehavior>
                                <a className="text-blue-600 hover:text-blue-800"><FiEdit/></a>
                            </Link>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};


export default function GestionFormulariosPage() {
  const [activeTab, setActiveTab] = useState('caracterizacion');

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Formularios</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('caracterizacion')}
            className={`inline-flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'caracterizacion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiFileText className="mr-2"/> Formularios de Caracterización
          </button>
          <button
            onClick={() => setActiveTab('verificacion')}
            className={`inline-flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verificacion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiShield className="mr-2"/> Plantillas de Verificación
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'caracterizacion' && <FormList type="caracterizacion" />}
        {activeTab === 'verificacion' && <FormList type="verificacion" />}
      </div>
    </div>
  );
}