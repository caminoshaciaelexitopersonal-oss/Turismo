"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

interface GalleryImage {
  id: number;
  imagen: string;
  alt_text?: string;
}

const MiGaleriaPage = () => {
  const { user, token } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: { 'Authorization': `Token ${token}` },
  });

  const getApiEndpoints = useCallback(() => {
    if (!user) return null;
    const base = user.role === 'PRESTADOR' ? 'galeria/prestador' : 'galeria/artesano';
    return {
      listCreate: `/${base}/`,
      delete: (id: number) => `/${base}/${id}/`,
    };
  }, [user]);

  const fetchImages = useCallback(async () => {
    const endpoints = getApiEndpoints();
    if (!endpoints) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(endpoints.listCreate);
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("No se pudieron cargar las imágenes de la galería.");
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, getApiEndpoints]);

  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token, fetchImages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    const endpoints = getApiEndpoints();
    if (!selectedFile || !endpoints) return;

    const formData = new FormData();
    formData.append('imagen', selectedFile);
    formData.append('alt_text', `Imagen de ${user?.username}`);

    setIsUploading(true);
    const toastId = toast.loading("Subiendo imagen...");
    try {
      await apiClient.post(endpoints.listCreate, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.update(toastId, { render: "Imagen subida con éxito", type: "success", isLoading: false, autoClose: 3000 });
      setSelectedFile(null);
      fetchImages(); // Recargar la galería
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.update(toastId, { render: "Error al subir la imagen", type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const endpoints = getApiEndpoints();
    if (!endpoints) return;

    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      const toastId = toast.loading("Eliminando imagen...");
      try {
        await apiClient.delete(endpoints.delete(id));
        toast.update(toastId, { render: "Imagen eliminada", type: "success", isLoading: false, autoClose: 3000 });
        setImages(images.filter(img => img.id !== id));
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.update(toastId, { render: "Error al eliminar la imagen", type: "error", isLoading: false, autoClose: 5000 });
      }
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestionar Mi Galería</h1>

      {/* Formulario de subida */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Subir Nueva Imagen</h2>
        <div className="flex items-center space-x-4">
          <input type="file" onChange={handleFileChange} accept="image/*" className="flex-grow text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          <button onClick={handleUpload} disabled={!selectedFile || isUploading} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
            <FiUpload className="mr-2" />
            {isUploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>

      {/* Galería de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <p>Cargando galería...</p>
        ) : images.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Tu galería está vacía.</p>
        ) : (
          images.map(image => (
            <div key={image.id} className="relative group rounded-lg overflow-hidden">
              <Image src={image.imagen} alt={image.alt_text || 'Imagen de galería'} width={300} height={300} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <button onClick={() => handleDelete(image.id)} className="p-3 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MiGaleriaPage;