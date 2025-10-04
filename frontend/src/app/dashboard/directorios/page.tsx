"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiEdit } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminProviderManager from '@/components/AdminProviderManager';

// --- Type Definitions ---
type ProviderType = 'prestadores' | 'artesanos';

interface Provider {
  id: number;
  nombre_negocio?: string;
  nombre_taller?: string;
  nombre_artesano?: string;
  usuario_email: string;
  aprobado: boolean;
  fecha_creacion: string;
  categoria_nombre?: string;
  rubro_nombre?: string;
}

// --- Reusable Table Component ---
interface DirectoryTableProps {
  type: ProviderType;
  onManage: (id: number, type: ProviderType) => void;
  fetchTrigger: number;
}

const DirectoryTable: React.FC<DirectoryTableProps> = ({ type, onManage, fetchTrigger }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendientes'>('pendientes');

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Authorization': `Token ${token}` },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = `/admin/${type}/?aprobado=${filter === 'pendientes' ? 'false' : 'true,false'}`;
      if (filter === 'todos') {
          const endpoint = `/admin/${type}/`;
      }
      const response = await apiClient.get(endpoint);
      setItems(response.data.results || response.data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`No se pudieron cargar los ${type}.`);
    } finally {
      setIsLoading(false);
    }
  }, [type, filter, apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData, fetchTrigger]);

  const title = type === 'prestadores' ? 'Prestadores de Servicios' : 'Artesanos';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
        <div className="flex items-center space-x-2">
            <button onClick={() => setFilter('pendientes')} className={`px-4 py-2 text-sm rounded-md ${filter === 'pendientes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Pendientes</button>
            <button onClick={() => setFilter('todos')} className={`px-4 py-2 text-sm rounded-md ${filter === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Todos</button>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría/Rubro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr>
            ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No hay perfiles {filter === 'pendientes' ? 'pendientes de aprobación' : 'en esta lista'}.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.nombre_negocio || item.nombre_taller}</div>
                    {item.nombre_artesano && <div className="text-sm text-gray-500">{item.nombre_artesano}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.usuario_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.categoria_nombre || item.rubro_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.aprobado ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1.5" /> Aprobado</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1.5" /> Pendiente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onManage(item.id, type)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                      <FiEdit /> Gestionar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function DirectoriosPage() {
  const [activeTab, setActiveTab] = useState<ProviderType>('prestadores');
  const [managerState, setManagerState] = useState<{ isOpen: boolean; providerId: number | null; providerType: ProviderType | null }>({
    isOpen: false,
    providerId: null,
    providerType: null,
  });
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const handleOpenManager = (id: number, type: ProviderType) => {
    setManagerState({ isOpen: true, providerId: id, providerType: type });
  };

  const handleCloseManager = () => {
    setManagerState({ isOpen: false, providerId: null, providerType: null });
  };

  const handleUpdate = () => {
    handleCloseManager();
    setFetchTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Directorios</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('prestadores')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'prestadores' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Prestadores de Servicios
          </button>
          <button onClick={() => setActiveTab('artesanos')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'artesanos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Artesanos
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'prestadores' && <DirectoryTable type="prestadores" onManage={handleOpenManager} fetchTrigger={fetchTrigger} />}
        {activeTab === 'artesanos' && <DirectoryTable type="artesanos" onManage={handleOpenManager} fetchTrigger={fetchTrigger} />}
      </div>

      {managerState.isOpen && managerState.providerId && managerState.providerType && (
        <AdminProviderManager
          providerId={managerState.providerId}
          providerType={managerState.providerType}
          onClose={handleCloseManager}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}