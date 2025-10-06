"use client";

import { useAuth } from '@/contexts/AuthContext';
import { FiChevronDown, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useDashboard } from '@/contexts/DashboardContext'; // Importar el hook del contexto

// --- Definición de Tipos y Componentes Internos ---

export interface NavLink {
  href: string; // Se usará como identificador de la vista
  label: string;
  icon: React.ElementType;
  allowedRoles: string[];
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

import {
  FiHome, FiUsers, FiFileText, FiMapPin, FiSettings, FiBarChart2,
  FiShield, FiFolder, FiAward, FiCamera, FiEdit
} from 'react-icons/fi';

// Mapeo de strings de iconos a componentes de React Icons
const iconMap: { [key: string]: React.ElementType } = {
  FiHome, FiUsers, FiFileText, FiMapPin, FiSettings, FiBarChart2,
  FiShield, FiFolder, FiAward, FiCamera, FiEdit
};

// Componente para el estado de carga (esqueleto)
const SidebarSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-6"></div>
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-6 bg-gray-200 rounded-md w-1/2 mb-3"></div>
          <div className="space-y-2 pl-4">
            <div className="h-5 bg-gray-200 rounded-md w-5/6"></div>
            <div className="h-5 bg-gray-200 rounded-md w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Componente para un enlace individual en el menú, ahora es un botón
const SidebarLink = ({ link }: { link: NavLink }) => {
  const { activeView, setActiveView } = useDashboard();
  const isActive = activeView === link.href;
  const Icon = typeof link.icon === 'string' ? iconMap[link.icon] : link.icon;

  return (
    <button
      onClick={() => setActiveView(link.href)}
      className={`w-full flex items-center pl-10 pr-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-left
        ${isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      {Icon && <Icon className="mr-3 h-5 w-5 flex-shrink-0" />}
      <span className="truncate">{link.label}</span>
    </button>
  );
};

// Componente para una sección de navegación colapsable
const CollapsibleNavSection = ({ section, userRole }: { section: NavSection; userRole: string }) => {
  const { activeView } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar enlaces permitidos para el rol del usuario
  const filteredLinks = section.links.filter(link =>
    link.allowedRoles.includes(userRole)
  );

  // Determinar si la sección está activa (contiene la vista activa)
  const isSectionActive = filteredLinks.some(link => activeView === link.href);

  // Expandir la sección por defecto si está activa
  useEffect(() => {
    if (isSectionActive) {
      setIsOpen(true);
    }
  }, [isSectionActive]);

  if (filteredLinks.length === 0) {
    return null; // No renderizar la sección si no hay enlaces permitidos
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isSectionActive
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        aria-expanded={isOpen}
      >
        <span className="font-semibold">{section.title}</span>
        {isOpen ? <FiChevronDown className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1">
          {filteredLinks.map((link) => (
            <SidebarLink key={link.href} link={link} />
          ))}
        </div>
      )}
    </div>
  );
};


// --- Componente Principal del Sidebar ---

export default function Sidebar() {
  const { user } = useAuth();
  const { setActiveView } = useDashboard(); // Obtener la función para cambiar la vista
  const [navSections, setNavSections] = useState<NavSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000); // 8 segundos de timeout

    try {
      // Endpoint corregido de `/api/menu/` a `/api/config/menu-items/` tras verificar
      // los archivos de URLs del backend (`api/urls.py`), donde se encontró que el
      // primero no existía y el segundo sí.
      const response = await api.get<NavSection[]>('/config/menu-items/', {
        signal: controller.signal,
      });

      const menuData = response.data;
      setNavSections(menuData);

      // La lógica para establecer la vista activa inicial se ha movido a DashboardPage.
      // El Sidebar ya no es responsable de esta acción para evitar conflictos.

    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        setError("La petición ha tardado demasiado y ha sido cancelada.");
      } else {
        setError("No se pudo conectar con el servidor para cargar el menú.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [user, setActiveView]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Si el usuario no está cargado, no mostrar nada
  if (!user) {
    return <SidebarSkeleton />;
  }

  // Estado de carga
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  // Estado de error
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <FiAlertCircle className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm font-medium">Error al cargar el menú</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadMenu}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Estado exitoso: renderizar el menú
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 truncate">SITYC</h2>
        <p className="text-sm text-gray-500 truncate" title={user.email}>{user.username}</p>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navSections.map((section) => (
          <CollapsibleNavSection key={section.title} section={section} userRole={user.role} />
        ))}
      </nav>
    </aside>
  );
}