"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';

// Interfaz para los elementos del menú, coincidiendo con el serializador de la API
interface MenuItem {
  id: number;
  nombre: string;
  url: string;
  children: MenuItem[];
}

// Componente Recursivo para el Menú de Escritorio (Niveles 2 y 3)
const DesktopMenuItem = ({ item }: { item: MenuItem }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  // Si no tiene hijos, es un simple enlace.
  if (!hasChildren) {
    return (
      <Link
        href={item.url}
        className="block w-full text-left px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      >
        {item.nombre}
      </Link>
    );
  }

  // Si tiene hijos, es un submenú lateral (fly-out).
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsSubMenuOpen(true)}
      onMouseLeave={() => setIsSubMenuOpen(false)}
    >
      {/* Contenedor del elemento de 2º nivel que abre el 3º */}
      <div className="flex items-center justify-between w-full px-4 py-2 rounded-md hover:bg-blue-50 cursor-pointer">
        <Link href={item.url} className="text-sm text-gray-700 flex-grow">
          {item.nombre}
        </Link>
        <FiChevronRight className="h-4 w-4 ml-2 text-gray-400" />
      </div>

      {/* El submenú de 3er nivel que aparece al lado */}
      {isSubMenuOpen && (
        <div className="absolute top-0 left-full ml-1 w-64 bg-white rounded-md shadow-lg z-30">
          <div className="p-2">
            {/* Llamada recursiva para los elementos del 3er nivel */}
            {item.children.map((child) => (
              <DesktopMenuItem key={child.id} item={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Componente Principal para la Barra de Navegación de Escritorio
const NavLink = ({ item }: { item: MenuItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  // Si no tiene hijos, es un enlace simple en la barra principal.
  if (!hasChildren) {
    return (
      <Link href={item.url} className="py-2 text-gray-700 hover:text-blue-600 font-semibold">
        {item.nombre}
      </Link>
    );
  }

  // Si tiene hijos, es un menú desplegable principal (Nivel 1)
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center py-2 text-gray-700 hover:text-blue-600 font-semibold">
        <span>{item.nombre}</span>
        <FiChevronDown className="ml-1 h-5 w-5" />
      </button>

      {/* El submenú se renderiza condicionalmente */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg z-20">
          <div className="p-2">
            {item.children.map((child) => (
              <DesktopMenuItem key={child.id} item={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Recursivo para el Menú Móvil (Soporta N Niveles)
const MobileMenuItem = ({ item, level = 0 }: { item: MenuItem; level?: number }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  // Si no tiene hijos, es un simple enlace.
  if (!item.children || item.children.length === 0) {
    return (
      <Link href={item.url} className="block py-2 text-base font-medium text-gray-600 hover:text-blue-600" style={{ paddingLeft: `${1 + level * 1}rem` }}>
        {item.nombre}
      </Link>
    );
  }

  // Si tiene hijos, es un submenú desplegable (acordeón).
  return (
    <div>
      <button
        onClick={toggleSubMenu}
        className="w-full flex justify-between items-center py-3 text-lg font-medium text-gray-800 hover:text-blue-600"
        style={{ paddingLeft: `${1 + level * 1}rem` }}
      >
        <span>{item.nombre}</span>
        <FiChevronDown className={`h-5 w-5 transition-transform duration-300 ${isSubMenuOpen ? 'rotate-180' : ''}`} />
      </button>
      {isSubMenuOpen && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <MobileMenuItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/config/menu-items/');
        if (!response.ok) {
          throw new Error('Error al cargar el menú');
        }
        const data = await response.json();
        // La API devuelve un objeto paginado, los resultados están en la clave 'results'
        setMenuItems(data.results || []);
      } catch (error) {
        console.error("No se pudieron obtener los elementos del menú:", error);
        // Opcional: Cargar un menú por defecto en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <header className="sticky top-0 z-50 font-sans bg-white shadow-md">
      {/* --- Barra Superior --- */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-3">
                {/* Espacio para el logo de la alcaldía */}
                <div className="h-12 w-12 flex items-center justify-center">
                   <Image src="/logo.svg" alt="Logo Alcaldía de Puerto Gaitán" width={48} height={48} />
                </div>
                <div>
                    <span className="text-xl font-bold text-gray-800">Alcaldía de</span>
                    <span className="block text-lg font-semibold text-blue-600">Puerto Gaitán</span>
                </div>
              </Link>
            </div>

            {/* Título Central */}
            <div className="hidden lg:flex flex-col items-center flex-grow px-4">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight text-center">
                    Secretaría de Turismo y desarrollo económico
                </h1>
                <p className="text-sm text-gray-600">
                    Dirección de Turismo
                </p>
            </div>

            {/* Botones de Acción para Desktop */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              <Link href="/registro" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                Regístrese
              </Link>
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Ingreso
              </Link>
            </div>

            {/* Botón de Menú para Móvil */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
                aria-label="Abrir menú principal"
              >
                {isMenuOpen ? <FiX className="h-7 w-7" /> : <FiMenu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Barra de Navegación Principal --- */}
      <nav className="hidden lg:flex max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-14 items-center justify-center space-x-8">
        {isLoading ? (
          <p className="text-gray-500">Cargando menú...</p>
        ) : (
          menuItems.map((item) => <NavLink key={item.id} item={item} />)
        )}
      </nav>

      {/* Menú desplegable para Móvil */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {isLoading ? (
              <p className="text-gray-500 text-center">Cargando...</p>
            ) : (
              menuItems.map((item) => <MobileMenuItem key={item.id} item={item} />)
            )}
            <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
              <Link href="/registro" className="block w-full text-center px-5 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                Regístrese
              </Link>
              <Link href="/login" className="block w-full text-center px-5 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Ingreso
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}