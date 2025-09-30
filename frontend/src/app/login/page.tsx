"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, mfaRequired, verifyMfa } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      // Si el login es exitoso y no requiere MFA, la redirección es automática.
      // Si requiere MFA, el estado mfaRequired se actualizará.
    } catch {
      // El error (ej: contraseña incorrecta) ya se muestra con una alerta en el contexto.
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyMfa(code);
      // Si la verificación es exitosa, la redirección es automática.
    } catch {
      // El error (ej: código incorrecto) ya se muestra con una alerta en el contexto.
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
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
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
            <form className="space-y-6" onSubmit={handleMfaSubmit}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código de Verificación</label>
                <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} disabled={isLoading} className="block w-full px-3 py-2 mt-1 text-center tracking-[0.5em] placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
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