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

// Componente de bienvenida para la vista inicial del dashboard.
const WelcomeDashboard = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
    <p className="mt-2 text-lg text-gray-600">
      Bienvenido. Selecciona una opción del menú lateral para comenzar a gestionar el contenido.
    </p>
  </div>
);


// --- Mapeo de Vistas ---
// Un objeto que mapea el identificador de la vista (el 'href' del menú) al componente que debe renderizarse.
const viewComponents: { [key: string]: React.ComponentType } = {
  'inicio': WelcomeDashboard, // Vista por defecto
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