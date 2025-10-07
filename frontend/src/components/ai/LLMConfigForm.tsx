'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import FormField from '@/components/ui/FormField';

interface LLMConfigData {
  provider: 'SYSTEM_DEFAULT' | 'GROQ' | 'PHI3_LOCAL';
  api_key: string;
}

interface LLMConfigResponse extends LLMConfigData {
  api_key_masked: string;
  updated_at: string;
}

const LLMConfigForm: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LLMConfigData>();
  const [maskedKey, setMaskedKey] = useState<string>('No configurada');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get<LLMConfigResponse>('/config/my-llm/');
        setValue('provider', data.provider);
        setMaskedKey(data.api_key_masked);
        if (data.updated_at) {
          setLastUpdated(new Date(data.updated_at).toLocaleString('es-CO'));
        }
      } catch (error) {
        toast.error('No se pudo cargar su configuración de IA.');
      }
    };
    fetchConfig();
  }, [setValue]);

  const onSubmit: SubmitHandler<LLMConfigData> = async (data) => {
    try {
      // Solo enviamos la api_key si el usuario ha escrito algo en el campo.
      // Si el campo está vacío, no se envía, y el backend mantendrá la clave existente.
      const payload: Partial<LLMConfigData> = { provider: data.provider };
      if (data.api_key) {
        payload.api_key = data.api_key;
      }

      const response = await api.put<LLMConfigResponse>('/config/my-llm/', payload);

      toast.success('¡Configuración guardada con éxito!');
      setMaskedKey(response.data.api_key_masked);
      if (response.data.updated_at) {
        setLastUpdated(new Date(response.data.updated_at).toLocaleString('es-CO'));
      }
      // Limpiar el campo de la API key del formulario después de guardar
      setValue('api_key', '');

    } catch (error) {
      toast.error('Ocurrió un error al guardar la configuración.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Configuración de Inteligencia Artificial</h2>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 ¿Quieres usar tu propio modelo Groq?</h3>
        <p className="text-sm text-blue-700">
          Puedes potenciar tu agente personal con tu propia cuenta de Groq para obtener respuestas más rápidas y avanzadas.
        </p>
        <ol className="list-decimal list-inside mt-2 text-sm text-gray-600 space-y-1">
          <li>Crea una cuenta gratuita en <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">console.groq.com</a>.</li>
          <li>Ve a la sección de "API Keys" y genera una nueva clave.</li>
          <li>Selecciona "Groq personalizado" como proveedor y pega la clave en el campo correspondiente.</li>
          <li>¡Guarda los cambios y tu agente usará tu modelo Groq!</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor de LLM
          </label>
          <select
            id="provider"
            {...register('provider')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="SYSTEM_DEFAULT">Usar configuración del sistema (Recomendado)</option>
            <option value="GROQ">Groq personalizado</option>
            <option value="PHI3_LOCAL">Modelo local Phi-3 Mini (Avanzado)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Elige qué modelo de lenguaje potenciará a tu agente personal.</p>
        </div>

        <div>
            <FormField
                name="api_key"
                label="Clave Groq personalizada"
                type="password"
                register={register}
                errors={errors}
                placeholder="Pega tu clave aquí para actualizarla"
            />
            <p className="text-xs text-gray-500 mt-1">
                Clave actual: <span className="font-mono bg-gray-100 p-1 rounded text-gray-600">{maskedKey}</span>
            </p>
        </div>

        <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            {lastUpdated && (
                <p className="text-xs text-gray-500">
                    Última actualización: {lastUpdated}
                </p>
            )}
        </div>
      </form>
    </div>
  );
};

export default LLMConfigForm;