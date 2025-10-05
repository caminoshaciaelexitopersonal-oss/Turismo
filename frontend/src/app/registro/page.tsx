'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData, Role } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/ui/FormField';
import { toast } from 'react-toastify';

type FormErrors = {
  [key: string]: string[];
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
      origen: '',
    },
  });

  const [success, setSuccess] = useState<string | null>(null);

  const role = watch('role');
  const origen = watch('origen');

  const onSubmit: SubmitHandler<RegisterData> = async (data) => {
    setSuccess(null);

    if (data.password1 !== data.password2) {
      setError('password2', {
        type: 'manual',
        message: 'Las contraseñas no coinciden.',
      });
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    try {
      await registerUser(data);
      // El toast de éxito ya se maneja en el AuthContext
      setSuccess('¡Registro exitoso! Serás redirigido para iniciar sesión.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const errorData = err as FormErrors;

      // El toast de error ya se maneja en el AuthContext.
      // Aquí solo nos encargamos de mostrar los errores en los campos del formulario.
      if (typeof errorData === 'object' && errorData !== null) {
        for (const key in errorData) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            const fieldName = key as keyof RegisterData;
            const message = Array.isArray(errorData[fieldName])
              ? errorData[fieldName]![0]
              : String(errorData[fieldName]);
            setError(fieldName, { type: 'manual', message });
          }
        }
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
            name="password1"
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
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Quiero registrarme como:
            </label>
            <select
              id="role"
              {...register('role')}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TURISTA">Turista</option>
              <option value="PRESTADOR">Prestador de Servicios Turísticos</option>
              <option value="ARTESANO">Artesano</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="FUNCIONARIO_DIRECTIVO">Funcionario Directivo</option>
              <option value="FUNCIONARIO_PROFESIONAL">Funcionario Profesional</option>
            </select>
          </div>

          {/* Campos para Turista */}
          {role === 'TURISTA' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información de Turista</h3>
              <div>
                <label htmlFor="origen" className="block text-sm font-medium text-gray-700">
                  ¿De dónde nos visitas?
                </label>
                <select
                  id="origen"
                  {...register('origen', { required: role === 'TURISTA' ? 'Este campo es obligatorio.' : false })}
                  className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${errors.origen ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona tu origen</option>
                  <option value="LOCAL">Soy de Puerto Gaitán</option>
                  <option value="REGIONAL">Vengo del Meta</option>
                  <option value="NACIONAL">Vengo de otro lugar de Colombia</option>
                  <option value="EXTRANJERO">Soy extranjero</option>
                </select>
                {errors.origen && <p className="mt-1 text-xs text-red-600">{errors.origen.message}</p>}
              </div>
              {origen === 'EXTRANJERO' && (
                <FormField name="pais_origen" label="País de Origen" register={register} errors={errors} required />
              )}
            </div>
          )}

          {/* Campos para Prestador */}
          {role === 'PRESTADOR' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información del Prestador</h3>
              <FormField name="nombre_establecimiento" label="Nombre del Establecimiento" register={register} errors={errors} required />
              <FormField name="rnt" label="Registro Nacional de Turismo (RNT)" register={register} errors={errors} required />
              <FormField name="tipo_servicio" label="Tipo de Servicio (ej: hotel, restaurante)" register={register} errors={errors} required />
            </div>
          )}

          {/* Campos para Artesano */}
          {role === 'ARTESANO' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información del Artesano</h3>
              <FormField name="nombre_taller" label="Nombre del Taller" register={register} errors={errors} required />
              <FormField name="tipo_artesania" label="Tipo de Artesanía" register={register} errors={errors} required />
              <FormField name="material_principal" label="Material Principal" register={register} errors={errors} required />
            </div>
          )}

          {/* Campos para Administrador */}
          {role === 'ADMINISTRADOR' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información del Administrador</h3>
              <FormField name="cargo" label="Cargo" register={register} errors={errors} required />
              <FormField name="dependencia_asignada" label="Dependencia Asignada" register={register} errors={errors} required />
              <FormField name="nivel_acceso" label="Nivel de Acceso" register={register} errors={errors} required />
            </div>
          )}

          {/* Campos para Funcionario Directivo */}
          {role === 'FUNCIONARIO_DIRECTIVO' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información del Funcionario Directivo</h3>
              <FormField name="dependencia" label="Dependencia" register={register} errors={errors} required />
              <FormField name="nivel_direccion" label="Nivel de Dirección" register={register} errors={errors} required />
              <FormField name="area_funcional" label="Área Funcional" register={register} errors={errors} required />
            </div>
          )}

          {/* Campos para Funcionario Profesional */}
          {role === 'FUNCIONARIO_PROFESIONAL' && (
            <div className="p-4 space-y-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-800">Información del Funcionario Profesional</h3>
              <FormField name="dependencia" label="Dependencia" register={register} errors={errors} required />
              <FormField name="profesion" label="Profesión" register={register} errors={errors} required />
              <FormField name="area_asignada" label="Área Asignada" register={register} errors={errors} required />
            </div>
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