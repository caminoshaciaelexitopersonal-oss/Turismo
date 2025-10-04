"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Mientras se verifica la autenticación, se muestra un mensaje de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Verificando acceso...</p>
      </div>
    );
  }

  // Si no está autenticado, lo redirige al login
  if (!isAuthenticated) {
    router.push('/login');
    return null; // No renderizar nada mientras se redirige
  }

  // Si el usuario es un turista, no debería estar en el dashboard
  if (user?.role === 'TURISTA') {
    router.push('/mi-viaje'); // O a la página de inicio
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-xl text-gray-600">Acceso denegado. Redirigiendo...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  );
}