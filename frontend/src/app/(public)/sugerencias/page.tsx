"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api'; // Usamos la instancia api exportada por defecto
import { FiSend } from 'react-icons/fi';

const SugerenciasPage = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nombre_remitente: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    email_remitente: user?.email || '',
    tipo_mensaje: 'SUGERENCIA',
    mensaje: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/sugerencias/', formData);
      setSuccess('¡Gracias! Tu mensaje ha sido enviado correctamente.');
      // Reset form
      setFormData({
        nombre_remitente: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
        email_remitente: user?.email || '',
        tipo_mensaje: 'SUGERENCIA',
        mensaje: '',
      });
    } catch (err) {
      setError('Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Buzón de <span className="text-blue-600">Sugerencias</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Tu opinión es muy importante para nosotros. Ayúdanos a mejorar.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre_remitente" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                type="text"
                name="nombre_remitente"
                id="nombre_remitente"
                value={formData.nombre_remitente}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!user}
              />
            </div>
            <div>
              <label htmlFor="email_remitente" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input
                type="email"
                name="email_remitente"
                id="email_remitente"
                value={formData.email_remitente}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!user}
              />
            </div>
            <div>
              <label htmlFor="tipo_mensaje" className="block text-sm font-medium text-gray-700">Tipo de Mensaje</label>
              <select
                name="tipo_mensaje"
                id="tipo_mensaje"
                value={formData.tipo_mensaje}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="SUGERENCIA">Sugerencia</option>
                <option value="FELICITACION">Felicitación</option>
                <option value="QUEJA">Queja</option>
              </select>
            </div>
            <div>
              <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700">Mensaje</label>
              <textarea
                name="mensaje"
                id="mensaje"
                rows={5}
                value={formData.mensaje}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                <FiSend className="mr-2 h-5 w-5"/>
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-center text-red-500">{error}</p>}
          {success && <p className="mt-4 text-center text-green-500">{success}</p>}
        </div>
      </main>
    </div>
  );
};

export default SugerenciasPage;