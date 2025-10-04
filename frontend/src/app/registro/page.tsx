'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Interfaz para el estado de errores del formulario, permitiendo un error por campo.
interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
  origen?: string;
  paisOrigen?: string;
  general?: string; // Para errores no asociados a un campo específico
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('TURISTA');
  const [origen, setOrigen] = useState('');
  const [paisOrigen, setPaisOrigen] = useState('');

  // El estado de error ahora es un objeto para manejar errores por campo.
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Resetea paisOrigen cuando el origen del turista cambia y no es EXTRANJERO.
  useEffect(() => {
    if (origen !== 'EXTRANJERO') {
      setPaisOrigen('');
    }
  }, [origen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpiar errores y mensaje de éxito en cada envío para una UI limpia.
    setErrors({});
    setSuccess(null);

    // --- Validaciones del lado del cliente ---
    // Se realizan validaciones básicas antes de enviar la petición a la API.
    let clientErrors: FormErrors = {};
    if (!username) {
        clientErrors.username = 'El nombre de usuario es obligatorio.';
    }
    if (password !== password2) {
      clientErrors.password2 = 'Las contraseñas no coinciden.';
    }
    if (role === 'TURISTA') {
      if (!origen) {
        clientErrors.origen = 'Por favor, selecciona tu origen.';
      }
      if (origen === 'EXTRANJERO' && !paisOrigen) {
        clientErrors.paisOrigen = 'Por favor, ingresa tu país de origen.';
      }
    }

    if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        return;
    }

    setLoading(true);

    // --- Selección de Endpoint ---
    // Se selecciona el endpoint de registro correcto basado en el rol del usuario.
    let endpoint = `${API_BASE_URL}/auth/registration/`; // Default para Prestador
    if (role === 'TURISTA') {
      endpoint = `${API_BASE_URL}/auth/registration/turista/`;
    } else if (role === 'ARTESANO') {
      endpoint = `${API_BASE_URL}/auth/registration/artesano/`;
    }

    // --- Construcción del Payload ---
    // Se construye el payload con los campos que el backend de Django (dj-rest-auth) espera.
    const payload: Record<string, any> = {
      username,
      email,
      password,
      password2,
    };

    // Se añaden campos adicionales solo si el rol es Turista.
    if (role === 'TURISTA') {
      payload.origen = origen;
      if (origen === 'EXTRANJERO') {
        payload.pais_origen = paisOrigen;
      }
    }

    try {
      await axios.post(endpoint, payload);
      setSuccess('¡Registro exitoso! Serás redirigido para iniciar sesión.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      // --- Manejo de Errores del Backend ---
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Si el backend devuelve errores de validación de campos (ej. email ya existe).
          const errorData = err.response.data as FormErrors;
          const backendErrors: FormErrors = {};
          for (const key in errorData) {
            // Asignamos el error al campo correspondiente.
            // @ts-ignore
            backendErrors[key] = Array.isArray(errorData[key]) ? errorData[key].join(', ') : String(errorData[key]);
          }
          // Si hay errores no asociados a un campo específico (non_field_errors), se muestran en un mensaje general.
          if (backendErrors.non_field_errors) {
              backendErrors.general = backendErrors.non_field_errors;
          }
          setErrors(backendErrors);
        } else if (err.request) {
          // Error de red (no se pudo conectar).
          setErrors({ general: 'No se pudo conectar con el servidor. Revisa tu red.' });
        } else {
          // Otro tipo de error de Axios.
          setErrors({ general: `Error inesperado: ${err.message}` });
        }
      } else {
        // Error genérico no relacionado con Axios.
        setErrors({ general: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">Crear una Cuenta</h1>

        {/* Mensajes de éxito y error general */}
        {success && <div className="p-4 text-green-800 bg-green-100 border border-green-200 rounded-md">{success}</div>}
        {errors.general && <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
            <input
              id="password2"
              name="password2"
              type="password"
              autoComplete="new-password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.password2 ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password2 && <p className="mt-1 text-xs text-red-600">{errors.password2}</p>}
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
              <option value="ARTESANO">Artesano</option>
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
                  className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.origen ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona tu origen</option>
                  <option value="LOCAL">Soy de Puerto Gaitán</option>
                  <option value="REGIONAL">Vengo del Meta</option>
                  <option value="NACIONAL">Vengo de otro lugar de Colombia</option>
                  <option value="EXTRANJERO">Soy extranjero</option>
                </select>
                {errors.origen && <p className="mt-1 text-xs text-red-600">{errors.origen}</p>}
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
                    className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.paisOrigen ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.paisOrigen && <p className="mt-1 text-xs text-red-600">{errors.paisOrigen}</p>}
                </div>
              )}
            </>
          )}

          <div className="pt-2">
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