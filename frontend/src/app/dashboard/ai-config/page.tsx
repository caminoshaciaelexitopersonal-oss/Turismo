import React from 'react';
import LLMConfigForm from '@/components/ai/LLMConfigForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuración de IA | Dashboard',
  description: 'Gestiona la configuración de tu asistente de inteligencia artificial personal.',
};

const AIConfigPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Mi Asistente de IA
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          Personaliza el motor de inteligencia artificial que utiliza tu agente.
        </p>
      </header>

      <LLMConfigForm />
    </div>
  );
};

export default AIConfigPage;