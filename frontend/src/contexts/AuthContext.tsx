'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/lib/api'; // Importar la instancia centralizada de Axios
import axios from 'axios'; // Importar axios solo para el type guard isAxiosError

interface SavedItem {
  id: number;
  content_type_name: string;
  object_id: number;
}

interface User {
  pk: number;
  username: string;
  email: string;
  role:
    | 'ADMIN'
    | 'FUNCIONARIO_DIRECTIVO'
    | 'FUNCIONARIO_PROFESIONAL'
    | 'PRESTADOR'
    | 'ARTESANO'
    | 'TURISTA';
}

export interface RegisterData {
  // Campos comunes
  username?: string;
  email: string;
  password1: string;
  password2:string;
  role:
    | 'TURISTA'
    | 'PRESTADOR'
    | 'ARTESANO'
    | 'ADMINISTRADOR'
    | 'FUNCIONARIO_DIRECTIVO'
    | 'FUNCIONARIO_PROFESIONAL';

  // Campos para Turista
  origen?: 'LOCAL' | 'REGIONAL' | 'NACIONAL' | 'EXTRANJERO' | '';
  pais_origen?: string;

  // Campos para Prestador
  nombre_establecimiento?: string;
  rnt?: string;
  tipo_servicio?: string;

  // Campos para Artesano
  nombre_taller?: string;
  tipo_artesania?: string;
  material_principal?: string;

  // Campos para Administrador
  cargo?: string;
  dependencia_asignada?: string;
  nivel_acceso?: string;

  // Campos para Funcionario Directivo
  dependencia?: string;
  nivel_direccion?: string;
  area_funcional?: string;

  // Campos para Funcionario Profesional
  // 'dependencia' ya está definido
  profesion?: string;
  area_asignada?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  mfaRequired: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isItemSaved: (contentType: string, objectId: number) => boolean;
  toggleSaveItem: (contentType: string, objectId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{ identifier: string; password?: string; code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedItemsMap, setSavedItemsMap] = useState<Map<string, number>>(new Map());
  const router = useRouter();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setMfaRequired(false);
    setLoginCredentials(null);
    setSavedItemsMap(new Map());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    // La redirección se manejará en las páginas o layouts que lo requieran.
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const userResponse = await api.get<User>('/auth/user/');
      const userData = userResponse.data;
      setUser(userData);

      if (userData.role === 'TURISTA') {
        const savedItemsResponse = await api.get<{ results: SavedItem[] }>('/mi-viaje/');
        const itemMap = new Map(
          savedItemsResponse.data.results.map((item) => [
            `${item.content_type_name}_${item.object_id}`,
            item.id,
          ])
        );
        setSavedItemsMap(itemMap);
      } else {
        setSavedItemsMap(new Map());
      }
      return userData; // Devolver los datos del usuario para uso inmediato
    } catch (error) {
      logout();
      return null; // Devolver null en caso de error
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (storedToken) {
      setToken(storedToken);
      fetchUserData().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  const completeLogin = (key: string, userData: User) => {
    setToken(key);
    setUser(userData); // Establecer el usuario directamente
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', key);
    }
    setMfaRequired(false);
    setLoginCredentials(null);

    toast.success(`¡Bienvenido, ${userData.username}!`);

    // Redirección por rol, como se especifica en los requisitos.
    switch (userData.role) {
      case 'TURISTA':
        router.push('/mi-viaje');
        break;
      case 'PRESTADOR':
        router.push('/dashboard');
        break;
      case 'ARTESANO':
        router.push('/dashboard');
        break;
      case 'ADMIN':
        router.push('/dashboard');
        break;
      case 'FUNCIONARIO_DIRECTIVO':
        router.push('/dashboard');
        break;
      case 'FUNCIONARIO_PROFESIONAL':
        router.push('/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const payload = {
        username: identifier,
        password,
      };
      const response = await api.post('/auth/login/', payload);

      // La respuesta ahora debe contener la clave (token) y el objeto de usuario
      if (response.data?.key && response.data?.user) {
        completeLogin(response.data.key, response.data.user);
      } else {
        // Lógica de MFA (si aplica) o manejo de errores
        setMfaRequired(true);
        setLoginCredentials({ identifier, password });
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'production') {
        toast.error("Ocurrió un error. Por favor verifica tus datos e intenta nuevamente.");
      } else {
        if (axios.isAxiosError(err) && err.response) {
          const errorMsg = err.response.data?.non_field_errors?.[0] || 'El usuario o la contraseña son incorrectos.';
          toast.error(`Error de Login (dev): ${errorMsg}`);
        } else {
          toast.error("Error de conexión (dev).");
        }
      }
      throw err;
    }
  };

  const verifyMfa = async (code: string) => {
    if (!loginCredentials?.identifier) {
      throw new Error('No se encontraron credenciales para la verificación MFA.');
    }
    try {
      const payload = {
        username: loginCredentials.identifier,
        password: loginCredentials.password,
        code,
      };
      const response = await api.post('/auth/login/', payload);
      if (response.data?.key) {
        await completeLogin(response.data.key);
      } else {
        throw new Error('Respuesta inesperada del servidor durante la verificación MFA.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMsg = err.response.data?.non_field_errors?.[0] || 'El código de verificación es incorrecto.';
        throw new Error(errorMsg);
      }
      throw new Error('Error al verificar el código. Inténtelo de nuevo.');
    }
  };

  const isItemSaved = (contentType: string, objectId: number): boolean => {
    return savedItemsMap.has(`${contentType}_${objectId}`);
  };

  const toggleSaveItem = async (contentType: string, objectId: number) => {
    if (!user || user.role !== 'TURISTA') {
      toast.warn("Necesitas iniciar sesión como turista para guardar favoritos.");
      router.push('/login');
      return;
    }
    const itemKey = `${contentType}_${objectId}`;
    const savedItemId = savedItemsMap.get(itemKey);
    try {
      if (savedItemId) {
        await api.delete(`/mi-viaje/${savedItemId}/`);
        toast.success("Elemento eliminado de tu viaje.");
      } else {
        await api.post('/mi-viaje/', { content_type: contentType, object_id: objectId });
        toast.success("Elemento añadido a tu viaje.");
      }
      // Volver a cargar los datos del usuario para actualizar la lista de guardados
      await fetchUserData();
    } catch (error) {
      toast.error("Hubo un error al procesar tu solicitud.");
    }
  };

  const register = async (data: RegisterData) => {
    // Determinar el endpoint correcto usando una estructura switch para mayor robustez.
    let endpoint = '';
    switch (data.role) {
      case 'TURISTA':
        endpoint = '/auth/registration/turista/';
        break;
      case 'PRESTADOR':
        endpoint = '/auth/registration/prestador/';
        break;
      case 'ARTESANO':
        endpoint = '/auth/registration/artesano/';
        break;
      case 'ADMINISTRADOR':
        endpoint = '/auth/registration/administrador/';
        break;
      case 'FUNCIONARIO_DIRECTIVO':
        endpoint = '/auth/registration/funcionario_directivo/';
        break;
      case 'FUNCIONARIO_PROFESIONAL':
        endpoint = '/auth/registration/funcionario_profesional/';
        break;
      default:
        // Lanzar un error si el rol no es válido para evitar enviar a un endpoint vacío.
        toast.error(`Error: Rol de registro no válido: ${data.role}`);
        throw new Error(`Rol de registro no válido: ${data.role}`);
    }

    // Construir el payload base con campos comunes
    const payload: { [key: string]: any } = {
      username: data.username || `${data.email.split('@')[0]}${Math.floor(Math.random() * 10000)}`,
      email: data.email,
      password1: data.password1,
      password2: data.password2,
      role: data.role, // Enviar siempre el rol
    };

    // Añadir campos específicos del rol al payload
    switch (data.role) {
      case 'TURISTA':
        payload.origen = data.origen;
        if (data.origen === 'EXTRANJERO') {
          payload.pais_origen = data.pais_origen;
        }
        break;
      case 'PRESTADOR':
        payload.nombre_establecimiento = data.nombre_establecimiento;
        payload.rnt = data.rnt;
        payload.tipo_servicio = data.tipo_servicio;
        break;
      case 'ARTESANO':
        payload.nombre_taller = data.nombre_taller;
        payload.tipo_artesania = data.tipo_artesania;
        payload.material_principal = data.material_principal;
        break;
      case 'ADMINISTRADOR':
        payload.cargo = data.cargo;
        payload.dependencia_asignada = data.dependencia_asignada;
        payload.nivel_acceso = data.nivel_acceso;
        break;
      case 'FUNCIONARIO_DIRECTIVO':
        payload.dependencia = data.dependencia;
        payload.nivel_direccion = data.nivel_direccion;
        payload.area_funcional = data.area_funcional;
        break;
      case 'FUNCIONARIO_PROFESIONAL':
        payload.dependencia = data.dependencia;
        payload.profesion = data.profesion;
        payload.area_asignada = data.area_asignada;
        break;
    }

    try {
      await api.post(endpoint, payload);
      // Mensaje de éxito unificado y amigable para el usuario, como se solicitó.
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'production') {
        toast.error("Ocurrió un error. Por favor verifica tus datos e intenta nuevamente.");
      } else {
        if (axios.isAxiosError(err) && err.response?.data) {
          const errors = err.response.data;
          const errorMessages = Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
          toast.error(`Error de Registro (dev): ${errorMessages.join(' ')}`, { autoClose: 10000 });
        } else {
          toast.error("Error de conexión o respuesta inesperada (dev).");
        }
      }
      throw err;
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    user,
    token,
    mfaRequired,
    login,
    register,
    verifyMfa,
    logout,
    isLoading,
    isItemSaved,
    toggleSaveItem,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
