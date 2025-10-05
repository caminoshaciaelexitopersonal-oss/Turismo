'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    | 'ADMINISTRADOR'
    | 'FUNCIONARIO_DIRECTIVO'
    | 'FUNCIONARIO_PROFESIONAL'
    | 'PRESTADOR'
    | 'ARTESANO'
    | 'TURISTA';
}

export type Role =
  | 'TURISTA'
  | 'PRESTADOR'
  | 'ARTESANO'
  | 'ADMINISTRADOR'
  | 'FUNCIONARIO_DIRECTIVO'
  | 'FUNCIONARIO_PROFESIONAL';

export interface RegisterData {
  username?: string;
  email: string;
  password1: string;
  password2: string;
  role: Role;
  // Turista
  origen?: 'LOCAL' | 'REGIONAL' | 'NACIONAL' | 'EXTRANJERO' | '';
  pais_origen?: string;
  // Prestador
  nombre_establecimiento?: string;
  rnt?: string;
  tipo_servicio?: string;
  // Artesano
  nombre_taller?: string;
  tipo_artesania?: string;
  material_principal?: string;
  // Administrador
  cargo?: string;
  dependencia_asignada?: string;
  nivel_acceso?: string;
  // Funcionario Directivo
  dependencia?: string;
  nivel_direccion?: string;
  area_funcional?: string;
  // Funcionario Profesional
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

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  apiClient.interceptors.request.use(
    (config) => {
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("authToken");
        if (localToken) {
          if (!config.headers) config.headers = {};
          (config.headers as Record<string, string>).Authorization = `Token ${localToken}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setMfaRequired(false);
    setLoginCredentials(null);
    setSavedItemsMap(new Map());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    router.push('/');
  }, [router]);

  const fetchUserData = useCallback(async () => {
    try {
      const userResponse = await apiClient.get('/auth/user/');
      setUser(userResponse.data);
      if (userResponse.data.role === 'TURISTA') {
        const savedItemsResponse = await apiClient.get('/mi-viaje/');
        const itemMap: Map<string, number> = new Map(
          savedItemsResponse.data.results.map((item: SavedItem) => [
            `${item.content_type_name}_${item.object_id}`,
            item.id,
          ])
        );
        setSavedItemsMap(itemMap);
      } else {
        setSavedItemsMap(new Map());
      }
    } catch (error) {
      console.error("Error fetching user data, logging out:", error);
      logout();
    }
  }, [apiClient, logout]);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (storedToken) {
      setToken(storedToken);
      fetchUserData().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  const completeLogin = async (key: string) => {
    setToken(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', key);
    }
    setMfaRequired(false);
    setLoginCredentials(null);

    try {
      const userResponse = await apiClient.get('/auth/user/');
      const userData: User = userResponse.data;
      setUser(userData);
      toast.success(`¡Bienvenido, ${userData.username}!`);
      if (userData.role === 'TURISTA') {
        await fetchUserData();
        router.push('/mi-viaje');
      } else if (userData.role === 'ADMINISTRADOR') {
        router.push('/admin/panel');
      } else if (userData.role === 'PRESTADOR') {
        router.push('/dashboard/prestador');
      } else if (userData.role === 'ARTESANO') {
        router.push('/dashboard/artesano');
      } else if (userData.role === 'FUNCIONARIO_DIRECTIVO') {
        router.push('/dashboard/directivo');
      } else if (userData.role === 'FUNCIONARIO_PROFESIONAL') {
        router.push('/dashboard/profesional');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Error al completar login:", err);
      logout();
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const isEmail = identifier.includes('@');
      const payload = {
        password,
        ...(isEmail ? { email: identifier } : { username: identifier }),
      };
      const response = await apiClient.post('/auth/login/', payload);
      if (response.data?.key) {
        await completeLogin(response.data.key);
      } else {
        setMfaRequired(true);
        setLoginCredentials({ identifier, password });
      }
    } catch (err: unknown) {
      console.error("Login failed:", err);
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
      const response = await apiClient.post('/auth/login/', payload);
      if (response.data?.key) {
        await completeLogin(response.data.key);
      } else {
        throw new Error('Respuesta inesperada del servidor durante la verificación MFA.');
      }
    } catch (err: unknown) {
      console.error("MFA verification failed:", err);
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
      alert("Necesitas iniciar sesión como turista para guardar favoritos.");
      router.push('/login');
      return;
    }
    const itemKey = `${contentType}_${objectId}`;
    const savedItemId = savedItemsMap.get(itemKey);
    try {
      if (savedItemId) {
        await apiClient.delete(`/mi-viaje/${savedItemId}/`);
      } else {
        await apiClient.post('/mi-viaje/', { content_type: contentType, object_id: objectId });
      }
      await fetchUserData();
    } catch (error) {
      console.error("Error al guardar/eliminar el elemento:", error);
      alert("Hubo un error al procesar tu solicitud.");
    }
  };

  const register = async (data: RegisterData) => {
    const roleEndpointMap: Record<Role, string> = {
      TURISTA: '/auth/registration/turista/',
      PRESTADOR: '/auth/registration/prestador/',
      ARTESANO: '/auth/registration/artesano/',
      ADMINISTRADOR: '/auth/registration/administrador/',
      FUNCIONARIO_DIRECTIVO: '/auth/registration/funcionario_directivo/',
      FUNCIONARIO_PROFESIONAL: '/auth/registration/funcionario_profesional/',
    };

    const endpoint = roleEndpointMap[data.role] || '/auth/registration/';

    const basePayload = {
      username: data.username || `${data.email.split('@')[0]}${Math.floor(Math.random() * 10000)}`,
      email: data.email,
      password1: data.password1,
      password2: data.password2,
      role: data.role,
    };

    const roleSpecificPayloads: Partial<RegisterData> = {};
    switch (data.role) {
      case 'TURISTA':
        Object.assign(roleSpecificPayloads, { origen: data.origen, pais_origen: data.pais_origen });
        break;
      case 'PRESTADOR':
        Object.assign(roleSpecificPayloads, { nombre_establecimiento: data.nombre_establecimiento, rnt: data.rnt, tipo_servicio: data.tipo_servicio });
        break;
      case 'ARTESANO':
        Object.assign(roleSpecificPayloads, { nombre_taller: data.nombre_taller, tipo_artesania: data.tipo_artesania, material_principal: data.material_principal });
        break;
      case 'ADMINISTRADOR':
        Object.assign(roleSpecificPayloads, { cargo: data.cargo, dependencia_asignada: data.dependencia_asignada, nivel_acceso: data.nivel_acceso });
        break;
      case 'FUNCIONARIO_DIRECTIVO':
        Object.assign(roleSpecificPayloads, { dependencia: data.dependencia, nivel_direccion: data.nivel_direccion, area_funcional: data.area_funcional });
        break;
      case 'FUNCIONARIO_PROFESIONAL':
        Object.assign(roleSpecificPayloads, { dependencia: data.dependencia, profesion: data.profesion, area_asignada: data.area_asignada });
        break;
    }

    const payload = { ...basePayload, ...roleSpecificPayloads };

    try {
      await apiClient.post(endpoint, payload);
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
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
