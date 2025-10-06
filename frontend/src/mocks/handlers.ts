import { http, HttpResponse } from 'msw';

// URL base de la API para que coincida con la configuración de `api.ts`
const API_BASE_URL = 'http://localhost:8000/api';

// Datos simulados para el menú reorganizado
const mockMenuItems = [
    {
        "nombre": "Institucional", "url": "#", "parent": null, "children": [
            {"nombre": "Secretaría de Turismo", "url": "/institucional/secretaria-turismo", "parent": 1, "children": []},
            {"nombre": "Dirección de Turismo", "url": "/institucional/direccion-turismo", "parent": 1, "children": []},
            {"nombre": "Consejo Municipal de Turismo", "url": "/institucional/consejo-turismo", "parent": 1, "children": []},
        ]
    },
    {
        "nombre": "Descubre el Paraíso", "url": "#", "parent": null, "children": [
            {"nombre": "Rutas Turísticas", "url": "/descubre/rutas-turisticas", "parent": 2, "children": []},
            {"nombre": "Atractivos", "url": "/descubre/atractivos", "parent": 2, "children": []},
            {"nombre": "Historia", "url": "/descubre/historia", "parent": 2, "children": []},
        ]
    },
    {
        "nombre": "Directorio", "url": "#", "parent": null, "children": [
            {"nombre": "Prestadores de Servicios Turísticos", "url": "/directorio/prestadores", "parent": 3, "children": []},
            {"nombre": "Artesanos", "url": "/directorio/artesanos", "parent": 3, "children": []},
        ]
    }
];


// Función para generar un usuario simulado basado en el rol
const createMockUser = (role = 'TURISTA') => ({
  pk: Math.floor(Math.random() * 1000),
  username: `${role.toLowerCase()}_user`,
  email: `${role.toLowerCase()}@example.com`,
  role: role,
});

// Definimos los manejadores de las peticiones
export const handlers = [
  // Manejador para el login
  http.post(`${API_BASE_URL}/auth/login/`, async ({ request }) => {
    const body = await request.json();
    const role = body.username === 'admin' ? 'ADMIN' : 'TURISTA'; // Simplificación para pruebas
    return HttpResponse.json({
      key: `mock_token_for_${role}`,
      user: createMockUser(role)
    });
  }),

  // Manejador genérico para todos los registros
  http.post(`${API_BASE_URL}/auth/registration/*`, async () => {
    return new HttpResponse(null, { status: 201 });
  }),

  // Manejador para obtener los datos del usuario
  http.get(`${API_BASE_URL}/auth/user/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('mock_token_for_ADMIN')) {
      return HttpResponse.json(createMockUser('ADMIN'));
    }
    if (authHeader) {
      // Devolvemos un usuario turista por defecto para otros tokens
      return HttpResponse.json(createMockUser('TURISTA'));
    }
    return new HttpResponse(null, { status: 401 });
  }),

  // Manejador para obtener los items del menú
  http.get(`${API_BASE_URL}/config/menu-items/`, () => {
     return HttpResponse.json(mockMenuItems);
  }),
];