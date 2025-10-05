import React from 'react';
import { FieldValues, UseFormRegister, FieldErrors, Path, RegisterOptions } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  validation?: RegisterOptions<T, Path<T>>;
}

const FormField = <T extends FieldValues>({
  name,
  label,
  register,
  errors,
  type = 'text',
  required,
  validation = {},
  ...props
}: FormFieldProps<T>) => {
  const error = errors[name];

  const registerOptions: RegisterOptions<T, Path<T>> = {
    ...validation,
  };

  if (required) {
    registerOptions.required = 'Este campo es obligatorio';
  }

  if (type === 'email') {
    registerOptions.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Por favor, introduce una dirección de correo electrónico válida',
    };
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, registerOptions)}
        {...props}
        className={`block w-full px-3 py-2 mt-1 placeholder-gray-400 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
};

export default FormField;