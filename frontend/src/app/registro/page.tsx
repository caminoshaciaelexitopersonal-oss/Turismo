'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/ui/FormField'; // Importar el componente reutilizable

type FormErrors = {
  [key in keyof RegisterData]?: string;
} & {
  general?: string;
};

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    defaultValues: {
      role: 'TURISTA',
    },
  });

  const [success, setSuccess] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const role = watch('role');
  const origen = watch('origen');

  const onSubmit: SubmitHandler<RegisterData> = async (data) => {
    setSuccess(null);
    setGeneralError(null);

    if (data.password !== data.password2) {
      setError('password2', {
        type: 'manual',
        message: 'Las contraseñas no coinciden.',
      });
      return;
    }

    try {
      await registerUser(data);
      setSuccess('¡Registro exitoso! Serás redirigido para iniciar sesión.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const errorData = err as FormErrors;
      let hasFieldErrors = false;

      if (typeof errorData === 'object' && errorData !== null) {
        for (const key in errorData) {
          const fieldName = key as keyof RegisterData;
          if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
            setError(fieldName, {
              type: 'manual',
              message: Array.isArray(errorData[fieldName])
                ? errorData[fieldName]![0]
                : String(errorData[fieldName]),
            });
            hasFieldErrors = true;
          }
        }

        if (errorData.non_field_errors) {
          setGeneralError(
            Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors.join(', ')
              : String(errorData.non_field_errors)
          );
        } else if (!hasFieldErrors) {
          setGeneralError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
        }
      } else {
        setGeneralError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
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
        {generalError && (
          <div className="p-4 text-red-800 bg-red-100 border border-red-200 rounded-md">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="email"
            label="Correo Electrónico"
            type="email"
            register={register}
            errors={errors}
            autoComplete="email"
            required
          />

          <FormField
            name="username"
            label="Nombre de Usuario"
            register={register}
            errors={errors}
            autoComplete="username"
            required
          />

          <FormField
            name="password"
            label="Contraseña"
            type="password"
            register={register}
            errors={errors}
            autoComplete="new-password"
            required
          />

          <FormField
            name="password2"
            label="Confirmar Contraseña"
            type="password"
            register={register}
            errors={errors}
            autoComplete="new-password"
            required
          />

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Quiero registrarme como:
            </label>
            <select
              id="role"
              {...register('role')}
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
                <label
                  htmlFor="origen"
                  className="block text-sm font-medium text-gray-700"
                >
                  ¿De dónde nos visitas?
                </label>
                <select
                  id="origen"
                  {...register('origen', {
                    required:
                      role === 'TURISTA'
                        ? 'Por favor, selecciona tu origen.'
                        : false,
                  })}
                  className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.origen ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona tu origen</option>
                  <option value="LOCAL">Soy de Puerto Gaitán</option>
                  <option value="REGIONAL">Vengo del Meta</option>
                  <option value="NACIONAL">Vengo de otro lugar de Colombia</option>
                  <option value="EXTRANJERO">Soy extranjero</option>
                </select>
                {errors.origen && (
                  <p className="mt-1 text-xs text-red-600">{errors.origen.message}</p>
                )}
              </div>

              {origen === 'EXTRANJERO' && (
                <FormField
                  name="paisOrigen"
                  label="País de Origen"
                  register={register}
                  errors={errors}
                  required={origen === 'EXTRANJERO'}
                />
              )}
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}