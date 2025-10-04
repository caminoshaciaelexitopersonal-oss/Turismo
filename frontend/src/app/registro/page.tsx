 'use client';

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('TURISTA');
  const [origen, setOrigen] = useState('');
  const [paisOrigen, setPaisOrigen] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Reset paisOrigen when origen changes and is not EXTRANJERO
  useEffect(() => {
    if (origen !== 'EXTRANJERO') {
      setPaisOrigen('');
    }
  }, [origen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // --- Validaciones del formulario ---
    if (role === 'TURISTA') {
      if (!origen) {
        setError('Por favor, selecciona tu origen.');
        return;
      }
      if (origen === 'EXTRANJERO' && !paisOrigen) {
        setError('Por favor, ingresa tu país de origen.');
        return;
      }
    }

    setLoading(true);

    const endpoint = role === 'TURISTA'
      ? `${API_BASE_URL}/auth/registration/turista/`
      : `${API_BASE_URL}/auth/registration/`;

    // --- Construcción del payload ---
    const payload: Record<string, any> = {
      username: email.split('@')[0] + `_${Math.floor(Math.random() * 10000)}`,
      email,
      password1: password,
      password2,
    };

    if (role === 'TURISTA') {
      payload.origen = origen;
      // El país de origen solo se añade si el origen es EXTRANJERO
      if (origen === 'EXTRANJERO') {
        payload.pais_origen = paisOrigen;
      }
    }

    try {
      await axios.post(endpoint, payload);
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      // Manejo seguro de errores Axios
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorData = err.response.data;
          const errorMessages = Object.keys(errorData)
            .map(key => `${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : String(errorData[key])}`)
            .join(' ');
          setError(`Error en el registro: ${errorMessages}`);
        } else if (err.request) {
          setError('No se pudo conectar con el servidor. Revisa tu red.');
        } else {
          setError(`Error inesperado: ${err.message}`);
        }
      } else {
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

        {success && <div className="p-4 text-green-800 bg-green-100 border border-green-200 rounded-md">{success}</div>}
        {error && <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
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
            <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
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
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Quiero registrarme como:</label>
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

          {role === 'TURISTA' && (
            <>
              <div>
                <label htmlFor="origen" className="block text-sm font-medium text-gray-700">¿De dónde nos visitas?</label>
                <select
                  id="origen"
                  name="origen"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona tu origen</option>
                  <option value="LOCAL">Soy de Puerto Gaitán</option>
                  <option value="REGIONAL">Vengo del Meta</option>
                  <option value="NACIONAL">Vengo de otro lugar de Colombia</option>
                  <option value="EXTRANJERO">Soy extranjero</option>
                </select>
              </div>

              {origen === 'EXTRANJERO' && (
                <div>
                  <label htmlFor="paisOrigen" className="block text-sm font-medium text-gray-700">País de Origen</label>
                  <input
                    id="paisOrigen"
                    name="paisOrigen"
                    type="text"
                    required
                    value={paisOrigen}
                    onChange={(e) => setPaisOrigen(e.target.value)}
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </>
          )}

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