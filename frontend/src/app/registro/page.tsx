'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8000/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('TURISTA'); // 'TURISTA' o 'PRESTADOR'
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const endpoint = role === 'TURISTA'
      ? `${API_BASE_URL}/auth/registration/turista/`
      : `${API_BASE_URL}/auth/registration/`;

    const payload = {
      username: email.split('@')[0] + `_${Math.floor(Math.random() * 10000)}`,
      email,
      password1: password,
      password2: password2,
    };

    console.log('Enviando solicitud de registro a:', endpoint);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(endpoint, payload);
      console.log('Registro exitoso. Respuesta de la API:', JSON.stringify(response.data, null, 2));
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      const error = err as { response?: { data: Record<string, unknown>; status: number }; request?: unknown; message: string };
      console.error('--- ERROR DE REGISTRO ---');
      if (error.response) {
        console.error('Respuesta del servidor:', JSON.stringify(error.response.data, null, 2));
        console.error('Estado del servidor:', error.response.status);
        const errorData = error.response.data;
        const errorMessages = Object.keys(errorData)
          .map(key => `${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : String(errorData[key])}`)
          .join(' ');
        setError(`Error en el registro: ${errorMessages}`);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor. Error de red o CORS?');
        setError('No se pudo conectar con el servidor. Por favor, revisa tu conexión de red.');
      } else {
        console.error('Error inesperado al configurar la solicitud:', error.message);
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">Crear una Cuenta</h1>

        {success && (
          <div className="p-4 text-green-800 bg-green-100 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password2"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar Contraseña
            </label>
            <input
              id="password2"
              name="password2"
              type="password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Quiero registrarme como:
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TURISTA">Turista</option>
              <option value="PRESTADOR">Prestador de Servicios</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                ¿Ya tienes una cuenta? Inicia sesión
            </Link>
        </div>
      </div>
    </div>
  );
}