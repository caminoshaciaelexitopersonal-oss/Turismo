"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useForm, UseFormRegister } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

// Interfaces
interface Opcion {
    id: number;
    texto_opcion: string;
}

interface Pregunta {
    id: number;
    texto_pregunta: string;
    tipo_pregunta: 'TEXTO_CORTO' | 'TEXTO_LARGO' | 'NUMERO' | 'FECHA' | 'SELECCION_UNICA' | 'SELECCION_MULTIPLE';
    es_requerida: boolean;
    opciones: Opcion[];
}

interface FormularioDetalle {
    id: number;
    titulo: string;
    descripcion: string;
    preguntas: Pregunta[];
}

interface RespuestaAPI {
    pregunta: number;
    respuesta: unknown;
}

type FormValues = Record<string, unknown>;

const ResponderFormularioPage = () => {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const formId = params.id as string;

    const [formulario, setFormulario] = useState<FormularioDetalle | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { register, handleSubmit, reset } = useForm<FormValues>();

    const apiClient = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
        headers: { Authorization: `Token ${token}` }
    });

    // Cargar la estructura del formulario y las respuestas existentes del usuario
    useEffect(() => {
        if (formId && token) {
            setIsLoading(true);
            Promise.all([
                apiClient.get<FormularioDetalle>(`/formularios/${formId}/`),
                apiClient.get<RespuestaAPI[]>(`/formularios/${formId}/respuestas/mias/`)
            ]).then(([formRes, answersRes]) => {
                setFormulario(formRes.data);

                const savedAnswers: FormValues = {};
                answersRes.data.forEach((ans) => {
                    savedAnswers[`pregunta_${ans.pregunta}`] = ans.respuesta;
                });
                reset(savedAnswers);

            }).catch(() => {
                toast.error("Error al cargar el formulario o tus respuestas.");
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [formId, token, reset, apiClient]);

    const onSubmit = async (data: FormValues) => {
        const toastId = toast.loading("Guardando respuestas...");

        const respuestasPayload: Record<number, unknown> = {};
        for (const key in data) {
            if (key.startsWith('pregunta_')) {
                const preguntaId = parseInt(key.replace('pregunta_', ''), 10);
                respuestasPayload[preguntaId] = data[key];
            }
        }

        try {
            await apiClient.post(`/formularios/${formId}/respuestas/`, { respuestas: respuestasPayload, formulario_id: formId });
            toast.update(toastId, { render: "Respuestas guardadas con éxito.", type: "success", isLoading: false, autoClose: 3000 });
            router.push('/dashboard/mis-formularios');
        } catch {
            toast.update(toastId, { render: "Error al guardar las respuestas.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    if (isLoading) return <p className="text-center p-8">Cargando formulario...</p>;
    if (!formulario) return <p className="text-center p-8 text-red-500">No se pudo cargar el formulario.</p>;

    return (
        <div className="container mx-auto">
            <ToastContainer />
             <Link href="/dashboard/mis-formularios" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                <FiArrowLeft className="mr-2" /> Volver a Mis Formularios
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{formulario.titulo}</h1>
            <p className="text-gray-600 mb-8 mt-2">{formulario.descripcion}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                {formulario.preguntas.map(pregunta => (
                    <div key={pregunta.id}>
                        <label className="block text-md font-medium text-gray-800">
                            {pregunta.texto_pregunta}
                            {pregunta.es_requerida && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderInput(pregunta, register)}
                    </div>
                ))}
                <div className="flex justify-end mt-8">
                    <button type="submit" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
                        <FiSave className="mr-2"/> Guardar Respuestas
                    </button>
                </div>
            </form>
        </div>
    );
};

// Función helper para renderizar el input correcto según el tipo de pregunta
const renderInput = (pregunta: Pregunta, register: UseFormRegister<FormValues>) => {
    const fieldName = `pregunta_${pregunta.id}`;
    const requiredRule = { required: pregunta.es_requerida ? 'Este campo es obligatorio' : false };

    switch (pregunta.tipo_pregunta) {
        case 'TEXTO_CORTO':
            return <input type="text" {...register(fieldName, requiredRule)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"/>;
        case 'TEXTO_LARGO':
            return <textarea {...register(fieldName, requiredRule)} rows={4} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"/>;
        case 'NUMERO':
            return <input type="number" {...register(fieldName, { valueAsNumber: true, ...requiredRule })} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"/>;
        case 'FECHA':
            return <input type="date" {...register(fieldName, requiredRule)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"/>;
        case 'SELECCION_UNICA':
            return (
                <div className="mt-2 space-y-2">
                    {pregunta.opciones.map(opcion => (
                        <label key={opcion.id} className="flex items-center">
                            <input type="radio" {...register(fieldName, requiredRule)} value={opcion.texto_opcion} className="h-4 w-4"/>
                            <span className="ml-3 text-sm text-gray-700">{opcion.texto_opcion}</span>
                        </label>
                    ))}
                </div>
            );
        case 'SELECCION_MULTIPLE':
             return (
                <div className="mt-2 space-y-2">
                    {pregunta.opciones.map(opcion => (
                        <label key={opcion.id} className="flex items-center">
                            <input type="checkbox" {...register(`${fieldName}.${opcion.texto_opcion}`)} className="h-4 w-4 rounded border-gray-300"/>
                            <span className="ml-3 text-sm text-gray-700">{opcion.texto_opcion}</span>
                        </label>
                    ))}
                </div>
            );
        default:
            return null;
    }
};

export default ResponderFormularioPage;