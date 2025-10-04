 "use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import AdminDashboard from '@/components/AdminDashboard';
import LLMKeysManager from '@/components/LLMKeysManager';
import FormList from '@/components/FormList';
import FormFiller from '@/components/FormFiller';
import { Formulario, getFormularioDetalle } from '@/services/formService';
import AtractivosManager from '@/components/AtractivosManager';
import FormManager from '@/components/FormManager';
import VerificacionManager from '@/components/VerificacionManager';
import CapacitacionesManager from '@/components/CapacitacionesManager';
import { getPrestadorProfile } from '@/services/prestadorService';

const PrestadorDashboard = () => {
  const [currentView, setCurrentView] = useState<'profile' | 'forms' | 'atractivos' | 'historial'>('profile');
  const [formToFill, setFormToFill] = useState<Formulario | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isGuia, setIsGuia] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkUserCategory = async () => {
      if (user?.role === 'PRESTADOR') {
        try {
          const profile = await getPrestadorProfile();
          if (profile.categoria?.slug === 'guias-de-turismo') {
            setIsGuia(true);
          }
        } catch (error) {
          console.error("Error fetching prestador profile", error);
        }
      }
    };
    checkUserCategory();
  }, [user]);

  const handleFillForm = async (formInfo: Formulario) => {
  if (!formInfo.id) return;
  setIsLoadingForm(true);
  try {
    // Inconsistencia subsanada: Obtenemos el detalle completo del formulario
    const formDetail = await getFormularioDetalle(formInfo.id);
    setFormToFill(formDetail);
  } catch (error) {
    console.error("Error fetching form details", error);
    // Opcional: mostrar un error al usuario
  } finally {
    setIsLoadingForm(false);
  }
};

const handleBackToList = () => setFormToFill(null);

const renderContent = () => {
  if (isLoadingForm) return <p>Cargando formulario...</p>;
  if (formToFill) {
    return <FormFiller form={formToFill} onBack={handleBackToList} />;
  }
  switch (currentView) {
    case 'profile':
      return <ProfileForm />;
    case 'forms':
      return <FormList onFillForm={handleFillForm} />;
    case 'historial':
      return <HistorialVerificaciones />;
    case 'atractivos':
      return isGuia ? <AtractivosManager /> : <p>Acceso denegado.</p>;
    default:
      return <ProfileForm />;
  }
};

return (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Panel del Prestador</h1>
    </div>
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => setCurrentView('profile')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            currentView === 'profile'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setCurrentView('forms')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            currentView === 'forms'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Formularios
        </button>
        <button
          onClick={() => setCurrentView('historial')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            currentView === 'historial'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Mi Historial
        </button>
        {isGuia && (
          <button
            onClick={() => setCurrentView('atractivos')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'atractivos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Atractivos
          </button>
        )}
      </nav>
    </div>
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      {renderContent()}
    </div>
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      <LLMKeysManager />
    </div>
  </div>
);
};

const AdminPanel = () => {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'formularios' | 'atractivos' | 'verificacion' | 'capacitaciones'
  >('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'formularios':
        return <FormManager />;
      case 'atractivos':
        return <AtractivosManager />;
      case 'verificacion':
        return <VerificacionManager />;
      case 'capacitaciones':
        return <CapacitacionesManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('formularios')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'formularios'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Formularios
          </button>
          <button
            onClick={() => setCurrentView('atractivos')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'atractivos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Atractivos
          </button>
          <button
            onClick={() => setCurrentView('verificacion')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'verificacion'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Verificación
          </button>
          <button
            onClick={() => setCurrentView('capacitaciones')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'capacitaciones'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Capacitaciones
          </button>
        </nav>
      </div>
      {renderContent()}
    </div>
  );
};

import ArtesanoProfileForm from '@/components/ArtesanoProfileForm';
import ConsejoConsultivoDashboard from '@/components/ConsejoConsultivoDashboard';
import HistorialVerificaciones from '@/components/HistorialVerificaciones';

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
      case 'CONSEJO_CONSULTIVO_TURISMO':
        return <ConsejoConsultivoDashboard />;
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