'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FiMenu, FiX, FiBell } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

// Interfaces de datos
interface NavLink {
  id: number;
  nombre: string;
  url: string;
  parent: number | null;
  children: NavLink[];
}

interface SiteConfig {
  logo_url: string;
  nombre_entidad_principal: string;
  nombre_entidad_secundaria: string;
  nombre_secretaria: string;
}

const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [navItems, setNavItems] = useState<NavLink[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResponse, configResponse] = await Promise.all([
          api.get('/config/menu-items/'),
          api.get('/config/site-config/')
        ]);

        const menuData = menuResponse.data.results || menuResponse.data || [];
        setNavItems(menuData);
        setSiteConfig(configResponse.data);

      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    fetchData();
  }, []);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const renderNavLinks = (items: NavLink[], isMobile: boolean = false) => {
    const baseClasses = "block text-gray-700 hover:bg-gray-100 rounded-md font-medium";
    const mobileClasses = `${baseClasses} px-3 py-2 text-base`;
    const desktopClasses = `${baseClasses} px-3 py-2 text-sm`;

    return items.map((item) => (
      <Link key={item.id} href={item.url} className={isMobile ? mobileClasses : desktopClasses}>
        {item.nombre}
      </Link>
    ));
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Sección Izquierda: Logo e Identificación Institucional */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              {siteConfig?.logo_url ? (
                <Image src={siteConfig.logo_url} alt="Logo Institucional" width={60} height={60} className="h-14 w-auto" />
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
              )}
            </Link>
            <div className="hidden md:block ml-4">
              <h2 className="text-sm font-bold text-gray-800">{siteConfig?.nombre_entidad_principal} {siteConfig?.nombre_entidad_secundaria}</h2>
              <p className="text-xs text-gray-600">{siteConfig?.nombre_secretaria}</p>
              <p className="text-xs font-light text-gray-500">Promoviendo las rutas turísticas</p>
            </div>
          </div>

          {/* Sección Derecha: Navegación y Acciones de Usuario */}
          <div className="flex items-center">
            {/* Navegación para Escritorio */}
            <nav className="hidden lg:flex lg:space-x-4 mr-6">
              {renderNavLinks(navItems)}
            </nav>

            {/* Acciones de Usuario para Escritorio */}
            <div className="hidden md:flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                <FiBell size={20} />
              </button>
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Salir
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Ingresar
                      </Link>
                      <Link href="/registro" className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                        Registrarse
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Botón de Menú Móvil */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú desplegable para Móvil y Tablet */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {renderNavLinks(navItems, true)}
          </nav>
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                <FiBell size={20} />
              </button>
              <span className="ml-2 text-sm text-gray-700">Notificaciones</span>
            </div>
             <div className="space-y-2">
                 {!isLoading && (
                  <>
                    {user ? (
                      <>
                        <Link href="/dashboard" className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                          Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                          Ingresar
                        </Link>
                        <Link href="/registro" className="block w-full text-center px-4 py-2 text-base font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                          Registrarse
                        </Link>
                      </>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;