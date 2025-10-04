"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { FiFileText, FiEdit, FiCheckSquare } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces
interface FormularioAsignado {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: number;
}

interface UserProfile {
    categoria?: number; // Para Prestador
    rubro?: number; // Para Artesano
}

const MisFormulariosPage = () => {
    const { user, token } = useAuth();
    const [formularios, setFormularios] = useState<FormularioAsignado[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const apiClient = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
        headers: { Authorization: `Token ${token}` },
    });

    const fetchData = useCallback(async () => {
        if (!user || !token) return;
        setIsLoading(true);
        try {
            // 1. Obtener el perfil del usuario para saber su categoría
            const profileEndpoint = user.role === 'PRESTADOR' ? '/profile/prestador/' : '/profile/artesano/';
            const profileRes = await apiClient.get(profileEndpoint);
            setUserProfile(profileRes.data);
            const userCategoryId = profileRes.data.categoria;

            // 2. Obtener todos los formularios públicos
            const formsRes = await apiClient.get('/formularios/');
            const allForms = formsRes.data.results || formsRes.data;

            // 3. Filtrar formularios que son para la categoría del usuario o son generales (sin categoría)
            const assignedForms = allForms.filter((form: FormularioAsignado) =>
                form.categoria === null || form.categoria === userCategoryId
            );
            setFormularios(assignedForms);

        } catch (error) {
            toast.error("Error al cargar los formularios asignados.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user, token, apiClient]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="text-center p-8">Cargando tus formularios...</div>;
    }

    return (
        <div className="container mx-auto">
            <ToastContainer />
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Formularios de Caracterización</h1>
            <p className="text-gray-600 mb-8">
                Completa estos formularios para ayudarnos a entender mejor tus servicios y mejorar tu visibilidad en la plataforma.
            </p>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="space-y-4">
                    {formularios.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No tienes formularios asignados en este momento.</p>
                    ) : (
                        formularios.map(form => (
                            <div key={form.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{form.titulo}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{form.descripcion}</p>
                                </div>
                                <Link href={`/dashboard/mis-formularios/${form.id}`} legacyBehavior>
                                    <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                                        <FiEdit className="mr-2"/> Responder
                                    </a>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MisFormulariosPage;