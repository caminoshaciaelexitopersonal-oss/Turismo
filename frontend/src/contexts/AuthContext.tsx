"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// La URL base de la API
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
    | 'ADMIN'
    | 'FUNCIONARIO_DIRECTIVO'
    | 'FUNCIONARIO_PROFESIONAL'
    | 'PRESTADOR'
    | 'ARTESANO'
    | 'TURISTA';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  mfaRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  const [loginCredentials, setLoginCredentials] = useState<{ email: string; password?: string; code?: string } | null>(null);
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
          config.headers.Authorization = `Token ${localToken}`;
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
    localStorage.removeItem('authToken');
    router.push('/');
  }, [router]);

  const fetchUserData = useCallback(async () => {
    try {
      const userResponse = await apiClient.get('/auth/user/');
      setUser(userResponse.data);

      if (userResponse.data.role === 'TURISTA') {
        const savedItemsResponse = await apiClient.get('/mi-viaje/');
        const itemMap: Map<string, number> = new Map(savedItemsResponse.data.results.map((item: SavedItem) => [`${item.content_type_name}_${item.object_id}`, item.id]));
        setSavedItemsMap(itemMap);
      }
    } catch (error) {
      console.error("Error fetching user data, logging out:", error);
      logout();
    }
  }, [logout, apiClient]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUserData().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  const completeLogin = async (key: string) => {
    setToken(key);
    localStorage.setItem('authToken', key);
    setMfaRequired(false);
    setLoginCredentials(null);

    const userResponse = await apiClient.get('/auth/user/', { headers: { Authorization: `Token ${key}` } });
    const userData: User = userResponse.data;
    setUser(userData);

    if (userData.role === 'TURISTA') {
      await fetchUserData();
      router.push('/mi-viaje');
    } else {
      router.push('/dashboard');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // ***** CORRECCIÓN FINAL Y DEFINITIVA *****
      // El endpoint correcto es /auth/login/ y con autenticación por email,
      // dj-rest-auth espera 'email' y 'password'.
      const response = await apiClient.post('/auth/login/', { email, password });

      if (response.data.key) {
        await completeLogin(response.data.key);
      } else {
        setMfaRequired(true);
        setLoginCredentials({ email, password });
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }
  };

  const verifyMfa = async (code: string) => {
    if (!loginCredentials) return;
    try {
      const response = await apiClient.post('/auth/login/', { ...loginCredentials, code });
      if (response.data.key) {
        await completeLogin(response.data.key);
      } else {
        alert('El código de verificación es incorrecto.');
      }
    } catch (error) {
      alert('Error al verificar el código. Inténtelo de nuevo.');
      throw error;
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
      await fetchUserData(token!);
    } catch(error) {
      console.error("Error al guardar/eliminar el elemento:", error);
      alert("Hubo un error al procesar tu solicitud.");
    }
  };

  const value = {
    isAuthenticated: !!token,
    user,
    token,
    mfaRequired,
    login,
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