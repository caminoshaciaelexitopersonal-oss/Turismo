'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FiMenu, FiX } from 'react-icons/fi';

// Define la estructura de un enlace de navegación
interface NavLink {
  id: number;
  nombre: string;
  url: string;
  parent: number | null;
  children: NavLink[];
}

const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [navItems, setNavItems] = useState<NavLink[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Cargar los items del menú desde la API
    const fetchMenuItems = async () => {
      try {
        const response = await api.get('/config/menu-items/');
        const items = response.data.results || response.data || [];
        setNavItems(items);
      } catch (error) {
        // No hacer nada en caso de error para no romper la UI
      }
    };

    fetchMenuItems();
  }, []);

  const renderNavLinks = (items: NavLink[]) => {
    return items.map((item) => (
      <Link key={item.id} href={item.url} className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
        {item.nombre}
      </Link>
    ));
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo o Título del Sitio */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              SITYC
            </Link>
          </div>

          {/* Navegación para Escritorio */}
          <nav className="hidden md:flex md:space-x-8">
            {renderNavLinks(navItems)}
          </nav>

          {/* Botones de Autenticación */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                    Iniciar Sesión
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Botón de Menú Móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable para Móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {renderNavLinks(navItems)}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
             <div className="px-2 space-y-1">
                 {!isLoading && (
                  <>
                    {user ? (
                      <>
                        <Link href="/dashboard" className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium">
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left block bg-red-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-red-600"
                        >
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      <Link href="/login" className="block bg-blue-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600">
                        Iniciar Sesión
                      </Link>
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