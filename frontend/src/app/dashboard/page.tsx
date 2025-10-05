"use client";

import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { FiGrid, FiUser, FiBarChart2 } from 'react-icons/fi';

// Importar todos los componentes de gestión que se mostrarán dinámicamente
import AdminDashboard from '@/components/AdminDashboard';
import FormManager from '@/components/FormManager';
import AtractivosManager from '@/components/AtractivosManager';
import VerificacionManager from '@/components/VerificacionManager';
import UserManager from '@/components/UserManager';
import PublicacionManager from '@/components/PublicacionManager';
import PrestadorManager from '@/components/PrestadorManager';
import ArtesanosManager from '@/components/ArtesanosManager';
import SiteConfigManager from '@/components/SiteConfigManager';
import StatisticsDashboard from '@/components/StatisticsDashboard';
import FormList from '@/components/FormList'; // Para 'mis-formularios'

// Componente de bienvenida para la vista inicial
const WelcomeDashboard = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
      <p className="mt-2 text-lg text-gray-600">Bienvenido. Usa el menú lateral para navegar.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <div className="bg-white p-6 rounded-2xl shadow-lg flex items-start space-x-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><FiGrid className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Navegación Centralizada</h3>
            <p className="text-gray-600 mt-1">Accede a todas las herramientas desde el menú lateral.</p>
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl shadow-lg flex items-start space-x-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><FiUser className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Gestión de Perfil</h3>
            <p className="text-gray-600 mt-1">Mantén tu información personal y de negocio actualizada.</p>
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl shadow-lg flex items-start space-x-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><FiBarChart2 className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Visualiza Estadísticas</h3>
            <p className="text-gray-600 mt-1">Analiza el rendimiento y las métricas clave.</p>
          </div>
       </div>
    </div>
  </div>
);

// --- Mapeo de Vistas ---
// Un objeto que mapea el identificador de la vista (el 'href' del menú) al componente que debe renderizarse.
const viewComponents: { [key: string]: React.ComponentType } = {
  '/dashboard': WelcomeDashboard,
  '/dashboard/estadisticas': StatisticsDashboard,
  '/dashboard/analytics': AdminDashboard,
  '/dashboard/mis-formularios': FormList,
  // '/dashboard/mi-puntuacion': MiPuntuacion, // Placeholder
  // '/dashboard/mi-galeria': MiGaleria, // Placeholder
  '/dashboard/publicaciones': PublicacionManager,
  '/dashboard/atractivos': AtractivosManager,
  '/dashboard/directorios': PrestadorManager, // Por defecto muestra prestadores
  '/dashboard/usuarios': UserManager,
  '/dashboard/formularios': FormManager,
  '/dashboard/verificacion': VerificacionManager,
  '/dashboard/configuracion': SiteConfigManager,
};

// --- Componente Principal de la Página ---
export default function DashboardPage() {
  const { activeView } = useDashboard();

  // Selecciona el componente a renderizar basado en la vista activa.
  // Si no se encuentra una vista, se muestra el componente de bienvenida por defecto.
  const ActiveComponent = viewComponents[activeView] || WelcomeDashboard;

  return <ActiveComponent />;
}