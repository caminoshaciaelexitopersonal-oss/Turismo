"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define el tipo de vista que puede estar activa.
// Usaremos strings para que sea flexible y fácil de extender.
type ViewType = string;

// Define la forma del estado del contexto
interface DashboardContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

// Crea el contexto con un valor por defecto undefined
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Crea el componente proveedor
export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  // El estado 'activeView' determinará qué componente se muestra en el área principal.
  // 'inicio' será la vista por defecto al cargar el dashboard.
  const [activeView, setActiveView] = useState<ViewType>('inicio');

  const value = {
    activeView,
    setActiveView,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Crea un hook personalizado para un acceso fácil y seguro al contexto
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    // Este error asegura que el hook solo se use dentro de un DashboardProvider,
    // previniendo bugs por un uso incorrecto.
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};