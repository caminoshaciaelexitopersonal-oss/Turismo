import { test, expect } from './test-setup';

// --- Helpers ---
const generateUniqueData = () => {
  const timestamp = Date.now();
  return {
    email: `testuser_${timestamp}@example.com`,
    username: `testuser_${timestamp}`,
    password: 'password123',
  };
};

const BASE_URL = 'http://localhost:3000';

// Función reutilizable para registrar un usuario a través de la UI
async function registerUser(page: any, role: string, fields: Record<string, string> = {}) {
  const { email, username, password } = generateUniqueData();

  await page.goto(`${BASE_URL}/registro`);
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Nombre de Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Confirmar Contraseña').fill(password);
  await page.getByLabel('Quiero registrarme como:').selectOption(role);

  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }

  await page.getByRole('button', { name: 'Crear Cuenta' }).click();
  await page.waitForURL(`${BASE_URL}/login`);

  return { email, password };
}


test.describe('Flujo de Inicio de Sesión para Todos los Roles', () => {

  // Test para Administrador (usa credenciales preexistentes)
  test('debería iniciar sesión como Administrador y redirigir al panel de admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('adminpassword');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Corregido: La redirección para ADMIN debe ser a /admin/panel
    await page.waitForURL(`${BASE_URL}/admin/panel`, { timeout: 15000 });
    await expect(page).toHaveURL(`${BASE_URL}/admin/panel`);
  });

  // Test para Turista
  test('debería registrar y luego iniciar sesión como Turista', async ({ page }) => {
    const { email, password } = await registerUser(page, 'TURISTA');

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/mi-viaje`);
    await expect(page).toHaveURL(`${BASE_URL}/mi-viaje`);
  });

  // Test para Prestador de Servicios
  test('debería registrar y luego iniciar sesión como Prestador de Servicios', async ({ page }) => {
    const { email, password } = await registerUser(page, 'PRESTADOR', {
      'Nombre del Establecimiento': 'Test Hotel',
      'Registro Nacional de Turismo (RNT)': '0987654321',
      'Tipo de Servicio (Hotel, Restaurante, etc.)': 'Hotel',
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  // Test para Artesano
  test('debería registrar y luego iniciar sesión como Artesano', async ({ page }) => {
    const { email, password } = await registerUser(page, 'ARTESANO', {
      'Nombre del Taller': 'Taller de Prueba',
      'Tipo de Artesanía': 'Cerámica',
      'Material Principal': 'Arcilla',
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  // Test para Funcionario Directivo
  test('debería registrar y luego iniciar sesión como Funcionario Directivo', async ({ page }) => {
    const { email, password } = await registerUser(page, 'FUNCIONARIO_DIRECTIVO', {
      'Dependencia': 'Planeación Municipal',
      'Nivel de Dirección': 'Director de Área',
      'Área Funcional': 'Desarrollo Urbano',
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  // Test para Funcionario Profesional
  test('debería registrar y luego iniciar sesión como Funcionario Profesional', async ({ page }) => {
    const { email, password } = await registerUser(page, 'FUNCIONARIO_PROFESIONAL', {
      'Dependencia': 'Secretaría de Cultura',
      'Profesión': 'Arquitecto',
      'Área Asignada': 'Patrimonio Histórico',
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  // Test de Error: Credenciales incorrectas
  test('debería mostrar un error con credenciales incorrectas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico o Usuario').fill('usuario_inexistente@test.com');
    await page.getByLabel('Contraseña').fill('password_incorrecto');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    const errorToast = page.locator('.Toastify__toast--error');
    await expect(errorToast).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });
});