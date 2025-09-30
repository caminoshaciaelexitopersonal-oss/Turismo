"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = 'http://localhost:8000/api';

interface Image {
  id: number;
  imagen: string;
  alt_text: string;
}

interface ImageGalleryManagerProps {
  initialImages: Image[];
  onUpdate: () => void; // Función para refrescar los datos del perfil
}

export default function ImageGalleryManager({ initialImages, onUpdate }: ImageGalleryManagerProps) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, seleccione una imagen para subir.');
      return;
    }
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('alt_text', altText);

    try {
      await axios.post(`${API_BASE_URL}/galeria/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${token}`,
        },
      });
      // Refresca la lista de imágenes llamando a la función del padre
      onUpdate();
      setFile(null);
      setAltText('');
    } catch (err) {
      setError('Error al subir la imagen.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta imagen?')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/galeria/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      // Refresca la lista de imágenes
      onUpdate();
    } catch (err) {
      alert('Error al eliminar la imagen.');
      console.error(err);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-bold">Galería de Imágenes</h3>

      {/* Formulario de subida */}
      <form onSubmit={handleUpload} className="my-4 p-4 border rounded-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="imagen" className="block text-sm font-medium text-gray-700">Nueva Imagen</label>
            <input type="file" name="imagen" id="imagen" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
          </div>
          <div>
            <label htmlFor="alt_text" className="block text-sm font-medium text-gray-700">Texto Alternativo (Descripción)</label>
            <input type="text" name="alt_text" id="alt_text" value={altText} onChange={(e) => setAltText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button type="submit" disabled={isUploading} className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
          {isUploading ? 'Subiendo...' : 'Subir Imagen'}
        </button>
      </form>

      {/* Lista de imágenes */}
      <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
        {initialImages.map((image) => (
          <div key={image.id} className="relative group h-32 rounded-md overflow-hidden">
            <Image src={image.imagen} alt={image.alt_text} layout="fill" objectFit="cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDelete(image.id)} className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      {initialImages.length === 0 && <p className="text-sm text-gray-500">No hay imágenes en la galería.</p>}
    </div>
  );
}