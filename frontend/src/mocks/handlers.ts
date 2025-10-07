import { http, HttpResponse } from 'msw';

// Usamos una URL relativa para que coincida con las llamadas de la API
const API_PREFIX = '/api';

export const handlers = [
  // --- Manejador para el endpoint de Login ---
  http.post(`${API_PREFIX}/auth/login/`, async ({ request }) => {
    const body = await request.json() as any;

    // Simular un login exitoso para el administrador
    if (body.username === 'admin' || body.email === 'admin@example.com') {
      return HttpResponse.json({ key: 'mock-auth-token-admin' });
    }

    // Simular un login exitoso para cualquier otro usuario
    if (body.username || body.email) {
      return HttpResponse.json({ key: `mock-auth-token-for-${body.username || body.email}` });
    }

    // Simular un error de credenciales incorrectas por defecto
    return HttpResponse.json(
      { non_field_errors: ['Unable to log in with provided credentials.'] },
      { status: 400 }
    );
  }),

  // --- Manejador genérico para todos los endpoints de Registro ---
  http.post(`${API_PREFIX}/auth/registration/*`, async ({ request }) => {
    const body = await request.json() as any;

    // Simular error si las contraseñas no coinciden
    if (body.password1 !== body.password2) {
      return HttpResponse.json(
        { password2: ['Las contraseñas no coinciden.'] },
        { status: 400 }
      );
    }

    // Simular un registro exitoso
    return HttpResponse.json(
      { detail: 'Registro exitoso.' },
      { status: 201 }
    );
  }),

  // --- Manejador para la configuración del sitio (Header) ---
  http.get(`${API_PREFIX}/config/site-config/`, () => {
    return HttpResponse.json({
      logo_url: '/img/logo_placeholder.png', // Usar una ruta relativa
      nombre_entidad_principal: 'Alcaldía de',
      nombre_entidad_secundaria: 'Puerto Gaitán (Mock)',
      nombre_secretaria: 'Secretaría de Turismo y Desarrollo Económico',
    });
  }),

  // --- Manejador para los items del menú (Header) ---
  http.get(`${API_PREFIX}/config/menu-items/`, () => {
    return HttpResponse.json([
        { id: 1, nombre: 'Inicio', url: '/', parent: null, children: [] },
        { id: 2, nombre: 'Descubre', url: '/descubre', parent: null, children: [] },
        { id: 3, nombre: 'Directorio', url: '/directorio', parent: null, children: [] },
    ]);
  }),

  // --- Manejador para los datos del usuario ---
  http.get(`${API_PREFIX}/auth/user/`, ({ cookies }) => {
    // Esta es una simulación muy básica. En un caso real, se basaría en el token.
    if (cookies['auth-token']) {
        return HttpResponse.json({
            pk: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'TURISTA', // Rol por defecto para las pruebas
        });
    }
    // Si no hay token, devolver un error de no autenticado
    return new HttpResponse(null, { status: 401 });
  }),
];