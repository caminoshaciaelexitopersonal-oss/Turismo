import axios from 'axios';

// 1. Definir la URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// 2. Crear una instancia de Axios con la configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials es útil para la gestión de cookies CSRF si el backend lo requiere
  withCredentials: true,
});

// 3. Configurar un interceptor para añadir dinámicamente el token de autenticación
api.interceptors.request.use(
  (config) => {
    // Asegurarnos de que este código solo se ejecute en el cliente
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Si el token existe, lo añadimos al header de autorización
        if (!config.headers) config.headers = {};
        (config.headers as Record<string, string>).Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => {
    // Manejar errores en la configuración de la petición
    return Promise.reject(error);
  }
);

// 4. Exportar la instancia configurada para ser usada en toda la aplicación
export default api;