import { http, HttpResponse } from 'msw';

// URL base de la API, debe coincidir con la configuración del cliente
const API_BASE_URL = 'http://localhost:8000/api';

// Simulación de "base de datos" en memoria para usuarios y configuraciones
const users = new Map();
const llmConfig = {
  provider: 'local',
  apiKey: '',
};

export const handlers = [
  // --- MANEJADOR DE LOGIN MEJORADO ---
  // Simula la respuesta para diferentes roles basados en el username
  // Devuelve el token y el objeto de usuario en la misma respuesta.
  http.post(`${API_BASE_URL}/auth/login/`, async ({ request }) => {
    const body = await request.json() as any;
    const username = body.username || body.email;

    const userProfiles = {
      admin: { role: 'ADMINISTRADOR', pk: 1, token: 'mock-token-admin' },
      prestador: { role: 'PRESTADOR', pk: 2, token: 'mock-token-prestador' },
      artesano: { role: 'ARTESANO', pk: 3, token: 'mock-token-artesano' },
      turista: { role: 'TURISTA', pk: 4, token: 'mock-token-turista' },
      directivo: { role: 'FUNCIONARIO_DIRECTIVO', pk: 5, token: 'mock-token-directivo' },
      profesional: { role: 'FUNCIONARIO_PROFESIONAL', pk: 6, token: 'mock-token-profesional' },
    };

    const profile = userProfiles[username];

    if (profile) {
      return HttpResponse.json({
        key: profile.token,
        user: {
          pk: profile.pk,
          username: username,
          email: `${username}@example.com`,
          role: profile.role,
        },
      });
    }

    return HttpResponse.json(
      { non_field_errors: ['Credenciales inválidas.'] },
      { status: 400 }
    );
  }),

  // --- MANEJADORES DE REGISTRO POR ROL ---
  // Se crea un manejador para cada endpoint de registro específico
  ...[
    'turista',
    'prestador',
    'artesano',
    'administrador',
    'funcionario_directivo',
    'funcionario_profesional',
  ].map((role) =>
    http.post(`${API_BASE_URL}/auth/registration/${role}/`, async ({ request }) => {
      const body = (await request.json()) as any;

      if (body.password1 !== body.password2) {
        return HttpResponse.json(
          { password2: ['Las contraseñas no coinciden.'] },
          { status: 400 }
        );
      }
      if (users.has(body.email)) {
        return HttpResponse.json(
          { email: ['Este correo ya está en uso.'] },
          { status: 400 }
        );
      }

      users.set(body.email, { ...body, role: role.toUpperCase() });
      return HttpResponse.json(
        { detail: `Registro de ${role} exitoso.` },
        { status: 201 }
      );
    })
  ),

  // --- MANEJADOR DE CONFIGURACIÓN DEL MENÚ (HEADER) ---
  http.get(`${API_BASE_URL}/config/menu-items/`, () => {
    return HttpResponse.json([
      { id: 1, title: 'Inicio', url: '/', children: [] },
      { id: 2, title: 'Descubre', url: '/descubre', children: [] },
      {
        id: 3,
        title: 'Directorio',
        url: '/directorio',
        children: [
          { id: 4, title: 'Prestadores', url: '/directorio/prestadores' },
          { id: 5, title: 'Artesanos', url: '/directorio/artesanos' },
        ],
      },
      { id: 6, title: 'Institucional', url: '/institucional', children: [] },
    ]);
  }),

  // --- MANEJADORES PARA LA CONFIGURACIÓN DE IA (LLM) ---
  http.get(`${API_BASE_URL}/config/my-llm/`, () => {
    return HttpResponse.json(llmConfig);
  }),

  http.post(`${API_BASE_URL}/config/my-llm/`, async ({ request }) => {
    const newConfig = (await request.json()) as any;
    llmConfig.provider = newConfig.provider || llmConfig.provider;
    llmConfig.apiKey = newConfig.apiKey || llmConfig.apiKey;
    return HttpResponse.json(llmConfig, { status: 200 });
  }),

  // --- MANEJADOR DE DATOS DE USUARIO AUTENTICADO ---
  // Devuelve datos de usuario basados en el token de autorización
  http.get(`${API_BASE_URL}/auth/user/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Token mock-token-')) {
      const token = authHeader.substring('Token '.length);
      const roleKey = token.replace('mock-token-', '');

      const roleMap = {
        admin: 'ADMINISTRADOR',
        prestador: 'PRESTADOR',
        artesano: 'ARTESANO',
        turista: 'TURISTA',
        directivo: 'FUNCIONARIO_DIRECTIVO',
        profesional: 'FUNCIONARIO_PROFESIONAL',
      };

      const userRole = roleMap[roleKey] || 'TURISTA';

      return HttpResponse.json({
        pk: 1,
        username: roleKey,
        email: `${roleKey}@example.com`,
        role: userRole,
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),
];