import { test, expect } from '@playwright/test';

// --- Helper para generar datos únicos ---
const generateUniqueEmail = () => {
  const timestamp = Date.now();
  return `testuser_${timestamp}@example.com`;
};

const generateUniqueUsername = () => {
    const timestamp = Date.now();
    return `testuser_${timestamp}`;
}

const BASE_URL = 'http://localhost:3000';

test.describe('Flujo de Registro de Usuarios', () => {

  const password = 'password123';

  // --- Caso de Éxito: Registro de Turista ---
  test('debería registrar un Turista exitosamente', async ({ page }) => {
    const email = generateUniqueEmail();
    const username = generateUniqueUsername();

    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);

    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');

    // Rellenar campos de turista
    await page.getByLabel('¿De dónde nos visitas?').selectOption('NACIONAL');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    // Verificar el mensaje de éxito
    await expect(page.locator('text=¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });

    // Verificar redirección a la página de login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // --- Caso de Éxito: Registro de Prestador ---
  test('debería registrar un Prestador de Servicios exitosamente', async ({ page }) => {
    const email = generateUniqueEmail();
    const username = generateUniqueUsername();

    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);

    await page.getByLabel('Quiero registrarme como:').selectOption('PRESTADOR');

    // Rellenar campos de prestador
    await page.getByLabel('Nombre del Establecimiento').fill('Hotel Paraíso');
    await page.getByLabel('Registro Nacional de Turismo (RNT)').fill('1234567890');
    await page.getByLabel('Tipo de Servicio (Hotel, Restaurante, etc.)').fill('Hotel');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.locator('text=¡Registro exitoso!')).toBeVisible({ timeout: 10000 });
    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // --- Caso de Éxito: Registro de Artesano ---
  test('debería registrar un Artesano exitosamente', async ({ page }) => {
    const email = generateUniqueEmail();
    const username = generateUniqueUsername();

    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);

    await page.getByLabel('Quiero registrarme como:').selectOption('ARTESANO');

    // Rellenar campos de artesano
    await page.getByLabel('Nombre del Taller').fill('Manos Creativas');
    await page.getByLabel('Tipo de Artesanía').fill('Tejidos');
    await page.getByLabel('Material Principal').fill('Lana de oveja');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.locator('text=¡Registro exitoso!')).toBeVisible({ timeout: 10000 });
    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // --- Caso de Éxito: Registro de Administrador ---
  test('debería registrar un Administrador exitosamente', async ({ page }) => {
    const email = generateUniqueEmail();
    const username = generateUniqueUsername();

    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);

    await page.getByLabel('Quiero registrarme como:').selectOption('ADMINISTRADOR');

    // Rellenar campos de administrador
    await page.getByLabel('Cargo').fill('Admin Principal');
    await page.getByLabel('Dependencia Asignada').fill('Secretaría General');
    await page.getByLabel('Nivel de Acceso').fill('Total');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.locator('text=¡Registro exitoso!')).toBeVisible({ timeout: 10000 });
    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // --- Caso de Error: Contraseñas no coinciden ---
  test('debería mostrar un error si las contraseñas no coinciden', async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Correo Electrónico').fill(generateUniqueEmail());
    await page.getByLabel('Nombre de Usuario').fill(generateUniqueUsername());
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill('diferentePassword');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    // Verificar que el error se muestra en el campo y como toast
    await expect(page.locator('text=Las contraseñas no coinciden.')).toBeVisible();

    // Verificar que no se redirige
    await expect(page).toHaveURL(`${BASE_URL}/registro`);
  });

  // --- Caso de Error: Email duplicado ---
  test('debería mostrar un error si el email ya está en uso', async ({ page }) => {
    const sharedEmail = generateUniqueEmail();
    const username = generateUniqueUsername();

    // Primer registro (exitoso)
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(sharedEmail);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');
    await page.getByLabel('¿De dónde nos visitas?').selectOption('LOCAL');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await page.waitForURL(`${BASE_URL}/login`);

    // Segundo intento con el mismo email
    await page.goto(`${BASE_URL}/registro`);
    await page.getByLabel('Correo Electrónico').fill(sharedEmail);
    await page.getByLabel('Nombre de Usuario').fill(generateUniqueUsername()); // Diferente username
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');
    await page.getByLabel('¿De dónde nos visitas?').selectOption('LOCAL');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    // Verificar el toast de error del backend (el mensaje puede variar)
    await expect(page.locator('[class*="toast-error"]')).toBeVisible();
    await expect(page.locator('text=/email/i')).toBeVisible(); // Buscar un error que mencione "email"

    // Verificar que no se redirige
    await expect(page).toHaveURL(`${BASE_URL}/registro`);
  });
});