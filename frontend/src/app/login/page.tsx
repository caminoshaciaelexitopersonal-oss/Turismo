"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, mfaRequired, verifyMfa } = useAuth();

  // --- Envío del formulario de login ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(identifier, password);
      // La redirección se maneja dentro del AuthContext
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Envío del formulario MFA ---
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await verifyMfa(code);
    } catch (err: any) {
      setError(err.message || 'Código incorrecto. Intenta nuevamente.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {!mfaRequired ? (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Acceso al Sistema
            </h2>

            {error && <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{error}</div>}

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico o Usuario
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
            <div className="text-sm text-center text-gray-600">
              <p>
                ¿No tienes una cuenta?{' '}
                <Link href="/registro" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Verificación de dos pasos
            </h2>
            <p className="text-sm text-center text-gray-600">
              Hemos enviado un código a su correo electrónico. Por favor, introdúzcalo a continuación.
            </p>

            {error && <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{error}</div>}

            <form className="space-y-6" onSubmit={handleMfaSubmit}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código de Verificación
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 mt-1 text-center tracking-[0.5em] placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Código'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}