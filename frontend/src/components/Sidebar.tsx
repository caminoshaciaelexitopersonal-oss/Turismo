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
  FiMenu,
  FiAward,
  FiCamera,
  FiEdit,
} from 'react-icons/fi';
import React from 'react';

// Interfaz para los enlaces de navegación
interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: string[]; // Roles que pueden ver este enlace
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
      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <link.icon className="mr-3 h-5 w-5" />
      {link.label}
    </Link>
  );
};

export default function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role;

  if (!userRole) {
    return null; // No mostrar nada si no hay rol de usuario
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4">
      <div className="flex flex-col h-full">
        <nav className="flex-1 space-y-6">
          {navSections.map((section) => {
            // Filtra los enlaces de la sección para mostrar solo los permitidos para el rol del usuario
            const filteredLinks = section.links.filter(link =>
              link.allowedRoles.includes(userRole)
            );

            // No renderizar la sección si no tiene enlaces visibles para este usuario
            if (filteredLinks.length === 0) {
              return null;
            }

            return (
              <div key={section.title}>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="mt-2 space-y-1">
                  {filteredLinks.map((link) => (
                    <SidebarLink key={link.href} link={link} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}