"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useForm, useFieldArray, UseFormRegister, FieldArrayWithId } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiSave, FiPlus, FiTrash2, FiMenu } from 'react-icons/fi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Interfaces
interface SiteConfig {
  direccion: string;
  horario_atencion: string;
  telefono_conmutador: string;
  correo_institucional: string;
  social_facebook: string;
  social_twitter: string;
  social_youtube: string;
  social_instagram: string;
}

interface MenuItem {
  id?: number;
  nombre: string;
  url: string;
  parent?: number | null;
  children: MenuItem[];
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// --- Componente para la Configuración General ---
const GeneralSettings = ({ token }: { token: string | null }) => {
    const { register, handleSubmit, reset } = useForm<SiteConfig>();

    useEffect(() => {
        apiClient.get('/config/site-config/', { headers: { 'Authorization': `Token ${token}` }})
            .then(res => reset(res.data))
            .catch(() => toast.error("Error al cargar la configuración."));
    }, [token, reset]);

    const onSubmit = async (data: SiteConfig) => {
        try {
            await apiClient.patch('/config/site-config/', data, { headers: { 'Authorization': `Token ${token}` }});
            toast.success("Configuración guardada con éxito.");
        } catch {
            toast.error("Error al guardar la configuración.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium">Dirección</label>
                    <input {...register('direccion')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Horario de Atención</label>
                    <input {...register('horario_atencion')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Teléfono</label>
                    <input {...register('telefono_conmutador')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" {...register('correo_institucional')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>
            <h3 className="text-lg font-semibold border-t pt-4">Redes Sociales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium">Facebook URL</label>
                    <input {...register('social_facebook')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Instagram URL</label>
                    <input {...register('social_instagram')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">YouTube URL</label>
                    <input {...register('social_youtube')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Twitter (X) URL</label>
                    <input {...register('social_twitter')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>
            <div className="flex justify-end">
                <button type="submit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">
                    <FiSave className="mr-2" /> Guardar Configuración
                </button>
            </div>
        </form>
    );
};

// --- Componente para la Gestión del Menú (Refactorizado con @dnd-kit) ---
interface SortableMenuItemProps {
    field: FieldArrayWithId<{ items: MenuItem[] }, "items", "id">;
    index: number;
    register: UseFormRegister<{ items: MenuItem[] }>;
    removeItem: (index: number, id?: number) => void;
}

const SortableMenuItem = ({ field, index, register, removeItem }: SortableMenuItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg border">
            <button type="button" {...listeners} className="cursor-grab touch-none p-2">
                <FiMenu className="text-gray-500" />
            </button>
            <input {...register(`items.${index}.nombre`)} placeholder="Nombre del enlace" className="flex-grow rounded-md border-gray-300 shadow-sm" />
            <input {...register(`items.${index}.url`)} placeholder="/ruta-o-url-completa" className="flex-grow rounded-md border-gray-300 shadow-sm" />
            <button type="button" onClick={() => removeItem(index, field.id)} className="text-red-500 hover:text-red-700 p-2">
                <FiTrash2 />
            </button>
        </div>
    );
};

const MenuSettings = ({ token }: { token: string | null }) => {
    const { control, register, handleSubmit, reset } = useForm<{ items: MenuItem[] }>({
        defaultValues: { items: [] }
    });
    const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchMenuItems = useCallback(() => {
        apiClient.get<{ results: MenuItem[] }>('/config/menu-items/')
            .then(res => reset({ items: res.data.results || res.data }))
            .catch(() => toast.error("Error al cargar el menú."));
    }, [reset]);

    useEffect(() => {
        fetchMenuItems();
    }, [fetchMenuItems]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex(field => field.id === active.id);
            const newIndex = fields.findIndex(field => field.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                move(oldIndex, newIndex);
            }
        }
    };

    const onSubmit = async (data: { items: MenuItem[] }) => {
        const payload = data.items.map((item, index) => ({ ...item, orden: index }));
        try {
            await Promise.all(payload.map(item => {
                const url = item.id ? `/config/menu-items/${item.id}/` : '/config/menu-items/';
                const method = item.id ? 'patch' : 'post';
                const itemData = { ...item, parent: item.parent || null };
                return apiClient({ method, url, data: itemData, headers: { 'Authorization': `Token ${token}` } });
            }));
            toast.success("Menú guardado con éxito.");
            fetchMenuItems();
        } catch {
            toast.error("Error al guardar el menú.");
        }
    };

    const removeItem = async (index: number, id?: number) => {
        if (id) {
            try {
                await apiClient.delete(`/config/menu-items/${id}/`, { headers: { 'Authorization': `Token ${token}` }});
                remove(index);
                toast.success("Elemento eliminado.");
            } catch {
                toast.error("Error al eliminar el elemento.");
            }
        } else {
            remove(index);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <SortableMenuItem
                                key={field.id}
                                field={field}
                                index={index}
                                register={register}
                                removeItem={removeItem}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="mt-6 flex justify-between">
                <button type="button" onClick={() => append({ nombre: '', url: '', children: [] }, { shouldFocus: false })} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                    <FiPlus className="mr-2" /> Añadir Enlace
                </button>
                <button type="submit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">
                    <FiSave className="mr-2" /> Guardar Menú
                </button>
            </div>
        </form>
    );
};

// --- Componente para la Página de Inicio ---
const HomePageSettings = () => {
    // Esta sección puede ser más compleja, por ahora es un placeholder
    return (
        <div>
            <p>Gestión de Componentes de la Página de Inicio (Banners, Sliders, etc.)</p>
            <p className="text-sm text-gray-500 mt-2">
                Esta funcionalidad requiere una interfaz más compleja para reordenar y editar componentes visuales.
                Se implementará en un futuro sprint. Por ahora, puede gestionarse desde el panel de admin de Django.
            </p>
        </div>
    );
};


// --- Componente Principal de la Página ---
export default function ConfiguracionPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings token={token} />;
      case 'menu':
        return <MenuSettings token={token} />;
      case 'homepage':
        return <HomePageSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configuración del Sitio</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('general')} className={`${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} py-4 px-1 border-b-2 font-medium text-sm`}>
            Información General
          </button>
          <button onClick={() => setActiveTab('menu')} className={`${activeTab === 'menu' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} py-4 px-1 border-b-2 font-medium text-sm`}>
            Menú de Navegación
          </button>
          <button onClick={() => setActiveTab('homepage')} className={`${activeTab === 'homepage' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} py-4 px-1 border-b-2 font-medium text-sm`}>
            Página de Inicio
          </button>
        </nav>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {renderContent()}
      </div>
    </div>
  );
}