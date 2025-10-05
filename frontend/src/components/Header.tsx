"use client";

import React from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();

  const getHeaderTitle = () => {
    if (!user) return "Dashboard";
    switch (user.role.toUpperCase()) {
      case 'PRESTADOR':
        return "Panel del Prestador";
      case 'ARTESANO':
        return "Panel del Artesano";
      case 'CONSEJO_CONSULTIVO_TURISMO':
        return "Panel del Consejo Consultivo";
      case 'ADMIN':
      case 'FUNCIONARIO_DIRECTIVO':
      case 'FUNCIONARIO_PROFESIONAL':
        return "Panel de Administración";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* Botón de Hamburguesa para móvil */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden mr-4 p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
          <h1 className="text-xl font-bold text-gray-800">{getHeaderTitle()}</h1>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}