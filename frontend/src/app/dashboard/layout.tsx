"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardProvider } from '@/contexts/DashboardContext'; // Importar el proveedor

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bloquear el scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Limpieza al desmontar el componente
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isSidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (user?.role === 'TURISTA') {
    router.push('/mi-viaje');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Acceso denegado. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* --- Sidebar --- */}
        {/* Sidebar para Desktop (visible y estático) */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Sidebar para Móvil (Drawer con transición) */}
        <div
          className={`lg:hidden fixed inset-0 z-50 transition-transform transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay oscuro */}
          <div
            className="fixed inset-0 bg-black/60"
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Contenido del Sidebar */}
          <div className="relative bg-white h-full w-64 shadow-xl">
            <Sidebar />
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 lg:overflow-x-hidden">
          <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          <main className="flex-1 relative z-0 focus:outline-none p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}