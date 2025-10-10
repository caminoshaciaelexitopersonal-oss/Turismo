import { test, expect } from '@playwright/test';

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

test.describe('Flujo de Inicio de Sesión para Todos los Roles', () => {

  // --- Test para Administrador (usa credenciales preexistentes) ---
  test('debería iniciar sesión como Administrador y ser redirigido al dashboard de admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico').fill('admin');
    await page.getByLabel('Contraseña').fill('adminpassword');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });

    // La redirección final puede ser a /dashboard o /dashboard/admin, ambas son válidas
    // Lo importante es que el contenido del dashboard de admin esté visible.
    const adminHeader = page.locator('h1', { hasText: 'Panel de Administración' });
    await expect(adminHeader).toBeVisible({ timeout: 10000 });
  });

  // --- Test para Turista (registra y luego inicia sesión) ---
  test('debería registrar y luego iniciar sesión como Turista', async ({ page }) => {
    const { email, username, password } = generateUniqueData();

    // 1. Registrar usuario
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');
    await page.getByLabel('¿De dónde nos visitas?').selectOption('NACIONAL');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // 2. Iniciar sesión
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Verificar redirección y contenido
    await page.waitForURL(`${BASE_URL}/mi-viaje`);
    await expect(page).toHaveURL(`${BASE_URL}/mi-viaje`);
    const turistaHeader = page.locator('h1', { hasText: 'Mi Viaje' });
    await expect(turistaHeader).toBeVisible();
  });

  // --- Test para Prestador de Servicios (registra y luego inicia sesión) ---
  test('debería registrar y luego iniciar sesión como Prestador de Servicios', async ({ page }) => {
    const { email, username, password } = generateUniqueData();

    // 1. Registrar usuario
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('PRESTADOR');
    await page.getByLabel('Nombre del Establecimiento').fill('Test Hotel');
    await page.getByLabel('Registro Nacional de Turismo (RNT)').fill('0987654321');
    await page.getByLabel('Tipo de Servicio (Hotel, Restaurante, etc.)').fill('Hotel');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // 2. Iniciar sesión
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Verificar redirección y contenido
    await page.waitForURL(`${BASE_URL}/dashboard/prestador`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/prestador`);
    const prestadorHeader = page.locator('h2', { hasText: 'Perfil del Prestador' });
    await expect(prestadorHeader).toBeVisible({ timeout: 10000 });
  });

  // --- Test para Artesano (registra y luego inicia sesión) ---
  test('debería registrar y luego iniciar sesión como Artesano', async ({ page }) => {
    const { email, username, password } = generateUniqueData();

    // 1. Registrar usuario
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('ARTESANO');
    await page.getByLabel('Nombre del Taller').fill('Taller de Prueba');
    await page.getByLabel('Tipo de Artesanía').fill('Cerámica');
    await page.getByLabel('Material Principal').fill('Arcilla');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // 2. Iniciar sesión
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Verificar redirección y contenido
    await page.waitForURL(`${BASE_URL}/dashboard/artesano`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/artesano`);
    const artesanoHeader = page.locator('h2', { hasText: 'Perfil del Artesano' });
    await expect(artesanoHeader).toBeVisible({ timeout: 10000 });
  });

  // --- Test para Funcionario Directivo (registra y luego inicia sesión) ---
  test('debería registrar y luego iniciar sesión como Funcionario Directivo', async ({ page }) => {
    const { email, username, password } = generateUniqueData();

    // 1. Registrar usuario
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('FUNCIONARIO_DIRECTIVO');
    await page.getByLabel('Dependencia').fill('Planeación');
    await page.getByLabel('Nivel de Dirección').fill('Director de Área');
    await page.getByLabel('Área Funcional').fill('Proyectos Estratégicos');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // 2. Iniciar sesión
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Verificar redirección y contenido
    await page.waitForURL(`${BASE_URL}/dashboard/directivo`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/directivo`);
    const header = page.locator('h1', { hasText: 'Panel de Funcionario' });
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  // --- Test para Funcionario Profesional (registra y luego inicia sesión) ---
  test('debería registrar y luego iniciar sesión como Funcionario Profesional', async ({ page }) => {
    const { email, username, password } = generateUniqueData();

    // 1. Registrar usuario
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('FUNCIONARIO_PROFESIONAL');
    await page.getByLabel('Dependencia').fill('Tecnología');
    await page.getByLabel('Profesión').fill('Ingeniero de Software');
    await page.getByLabel('Área Asignada').fill('Desarrollo');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // 2. Iniciar sesión
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 3. Verificar redirección y contenido
    await page.waitForURL(`${BASE_URL}/dashboard/profesional`);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/profesional`);
    const header = page.locator('h1', { hasText: 'Panel de Funcionario' });
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  // --- Test de Error: Credenciales incorrectas ---
  test('debería mostrar un error con credenciales incorrectas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico').fill('usuario_inexistente@test.com');
    await page.getByLabel('Contraseña').fill('password_incorrecto');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Verificar que aparece el toast de error
    const errorToast = page.locator('[class*="toast-error"]');
    await expect(errorToast).toBeVisible();

    // Verificar que la URL no ha cambiado
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });
});