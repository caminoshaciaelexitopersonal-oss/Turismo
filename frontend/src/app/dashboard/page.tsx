"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import AdminDashboard from '@/components/AdminDashboard';
import LLMKeysManager from '@/components/LLMKeysManager';

// Componente para el panel del prestador (Refactorizado)
const PrestadorDashboard = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Panel de Control del Prestador</h1>
      <p className="mt-2 text-lg text-gray-600">
        Gestiona la información de tu negocio y tus claves de API.
      </p>
    </div>
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      <ProfileForm />
      <LLMKeysManager />
    </div>
  </div>
);

// Componente para el panel de administración (Refactorizado)
const AdminPanel = () => <AdminDashboard />;

import ArtesanoProfileForm from '@/components/ArtesanoProfileForm';

// Componente para el panel del artesano (unificado y refactorizado)
const ArtesanoDashboard = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Panel de Control del Artesano</h1>
      <p className="mt-2 text-lg text-gray-600">
        Gestiona la información de tu taller y tus claves de API.
      </p>
    </div>
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      <ArtesanoProfileForm />
      <LLMKeysManager />
    </div>
  </div>
);


export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role.toUpperCase()) {
      case 'PRESTADOR':
        return <PrestadorDashboard />;
      case 'ARTESANO':
        return <ArtesanoDashboard />;
      case 'ADMIN':
      case 'FUNCIONARIO_DIRECTIVO':
      case 'FUNCIONARIO_PROFESIONAL':
        return <AdminPanel />;
      default:
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Acceso Denegado</h1>
            <p className="mt-2">Tu rol de usuario no permite el acceso a este panel.</p>
          </div>
        );
    }
  };

  const getHeaderTitle = () => {
    switch (user.role.toUpperCase()) {
      case 'PRESTADOR':
        return "Panel del Prestador";
      case 'ARTESANO':
        return "Panel del Artesano";
      case 'ADMIN':
      case 'FUNCIONARIO_DIRECTIVO':
      case 'FUNCIONARIO_PROFESIONAL':
        return "Panel de Administración";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-800">{getHeaderTitle()}</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}