"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiMapPin,
  FiSettings,
  FiBarChart2,
  FiShield,
  FiFolder,
  FiAward,
  FiCamera,
  FiEdit,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import React, { useState } from 'react';

// Interfaz para los enlaces de navegación
interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: string[];
}

// Interfaz para las secciones del menú
interface NavSection {
  title: string;
  links: NavLink[];
}

// Definición de todos los enlaces y sus permisos
const navSections: NavSection[] = [
    {
    title: 'Principal',
    links: [
      { 
        href: '/dashboard', 
        label: 'Inicio', 
        icon: FiHome, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL', 'PRESTADOR', 'ARTESANO'] 
      },
      { 
        href: '/dashboard/estadisticas', 
        label: 'Estadísticas', 
        icon: FiBarChart2, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO'] 
      },
      {
        href: '/dashboard/analytics',
        label: 'Análisis de Datos',
        icon: FiBarChart2,
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL']
      },
    ],
  },
  {
    title: 'Mi Perfil',
    links: [
      { 
        href: '/dashboard/mis-formularios', 
        label: 'Mis Formularios', 
        icon: FiFileText, 
        allowedRoles: ['PRESTADOR', 'ARTESANO'] 
      },
      { 
        href: '/dashboard/mi-puntuacion', 
        label: 'Mi Puntuación', 
        icon: FiAward, 
        allowedRoles: ['PRESTADOR', 'ARTESANO'] 
      },
      { 
        href: '/dashboard/mi-galeria', 
        label: 'Mi Galería', 
        icon: FiCamera, 
        allowedRoles: ['PRESTADOR', 'ARTESANO'] 
      },
    ],
  },
  {
    title: 'Gestión de Contenido',
    links: [
      { 
        href: '/dashboard/publicaciones', 
        label: 'Publicaciones', 
        icon: FiFileText, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL'] 
      },
      { 
        href: '/dashboard/atractivos', 
        label: 'Atractivos Turísticos', 
        icon: FiMapPin, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL'] 
      },
    ],
  },
  {
    title: 'Gestión de Directorios',
    links: [
      { 
        href: '/dashboard/directorios', 
        label: 'Prestadores y Artesanos', 
        icon: FiFolder, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL'] 
      },
    ],
  },
  {
    title: 'Administración',
    links: [
      { 
        href: '/dashboard/usuarios', 
        label: 'Gestión de Usuarios', 
        icon: FiUsers, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO'] 
      },
      { 
        href: '/dashboard/formularios', 
        label: 'Gestión de Formularios', 
        icon: FiEdit, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL'] 
      },
      { 
        href: '/dashboard/verificacion', 
        label: 'Verificación', 
        icon: FiShield, 
        allowedRoles: ['ADMIN', 'FUNCIONARIO_DIRECTIVO', 'FUNCIONARIO_PROFESIONAL'] 
      },
      { 
        href: '/dashboard/configuracion', 
        label: 'Configuración del Sitio', 
        icon: FiSettings, 
        allowedRoles: ['ADMIN'] 
      },
    ],
  },
];

const SidebarLink = ({ link }: { link: NavLink }) => {
  const pathname = usePathname();
  const isActive = pathname === link.href;

  return (
    <Link
      href={link.href}
      className={`flex items-center pl-10 pr-4 py-2.5 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <link.icon className="mr-3 h-5 w-5" />
      {link.label}
    </Link>
  );
};

const CollapsibleNavSection = ({ section, userRole }: { section: NavSection; userRole: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const filteredLinks = section.links.filter(link =>
    link.allowedRoles.includes(userRole)
  );

  // La sección es activa si una de sus rutas hijas está activa
  const isSectionActive = filteredLinks.some(link => pathname.startsWith(link.href));

  // La sección debe estar abierta por defecto si está activa
  useState(() => {
    if (isSectionActive) {
      setIsOpen(true);
    }
  });

  if (filteredLinks.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors
          ${isSectionActive
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <span className="flex items-center">
          {/* Opcional: Podríamos añadir un ícono a la sección aquí */}
          {section.title}
        </span>
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


export default function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role;

  if (!userRole) {
    return null;
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4">
      <div className="flex flex-col h-full">
        <nav className="flex-1 space-y-2">
          {navSections.map((section) => (
            <CollapsibleNavSection key={section.title} section={section} userRole={userRole} />
          ))}
        </nav>
      </div>
    </aside>
  );
}