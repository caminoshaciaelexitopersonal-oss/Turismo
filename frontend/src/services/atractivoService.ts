import api from './api';

export interface Atractivo {
  id?: number;
  nombre: string;
  slug?: string;
  descripcion: string;
  como_llegar: string;
  ubicacion_mapa?: string;
  categoria_color: 'AMARILLO' | 'ROJO' | 'BLANCO';
  imagen_principal?: File | null;
  imagen_principal_url?: string;
  horario_funcionamiento?: string;
  tarifas?: string;
  recomendaciones?: string;
  accesibilidad?: string;
  informacion_contacto?: string;
  es_publicado?: boolean;
  autor_username?: string;
}

export const getMisAtractivos = async (): Promise<Atractivo[]> => {
  const response = await api.get('/atractivos/');
  return response.data;
};

export const getAtractivoDetalle = async (slug: string): Promise<Atractivo> => {
  const response = await api.get(`/atractivos/${slug}/`);
  return response.data;
};

export const createAtractivo = async (data: Atractivo): Promise<Atractivo> => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    const value = data[key as keyof Atractivo];
    if (value !== null && value !== undefined) {
      if (key === 'imagen_principal' && value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      } else if (typeof value === 'string' || typeof value === 'number') {
        formData.append(key, value as string);
      }
    }
  });
  const response = await api.post('/atractivos/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateAtractivo = async (slug: string, data: Atractivo): Promise<Atractivo> => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key as keyof Atractivo];
      if (value !== null && value !== undefined) {
        if (key === 'imagen_principal' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (typeof value === 'string' || typeof value === 'number') {
          formData.append(key, value as string);
        }
      }
    });

  const response = await api.patch(`/atractivos/${slug}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteAtractivo = async (slug: string): Promise<void> => {
  await api.delete(`/atractivos/${slug}/`);
};

export const approveAtractivo = async (slug: string): Promise<void> => {
    await api.post(`/atractivos/${slug}/approve/`);
};