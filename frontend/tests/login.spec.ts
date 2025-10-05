import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {

  // Prerrequisito: Crear usuarios de prueba antes de ejecutar estos tests.
  // Esto se puede hacer manualmente o con un script de seeding en la base de datos.
  // Aquí asumimos que los usuarios ya existen con la contraseña 'ValidPassword123'.

  const users = {
    TURISTA: { user: 'turista_login_test', pass: 'ValidPassword123', url: '/mi-viaje' },
    PRESTADOR: { user: 'prestador_login_test', pass: 'ValidPassword123', url: '/dashboard/prestador' },
    ARTESANO: { user: 'artesano_login_test', pass: 'ValidPassword123', url: '/dashboard/artesano' },
    ADMINISTRADOR: { user: 'admin_login_test', pass: 'ValidPassword123', url: '/admin/panel' },
    FUNCIONARIO_DIRECTIVO: { user: 'directivo_login_test', pass: 'ValidPassword123', url: '/dashboard/directivo' },
    FUNCIONARIO_PROFESIONAL: { user: 'profesional_login_test', pass: 'ValidPassword123', url: '/dashboard/profesional' },
  };

  async function registerUser(page, role, username) {
    await page.goto('/registro');
    const email = `${username}@example.com`;
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Contraseña').fill(users[role].pass);
    await page.getByLabel('Confirmar Contraseña').fill(users[role].pass);
    await page.getByLabel('Quiero registrarme como:').selectOption(role);

    switch (role) {
        case 'TURISTA':
            await page.getByLabel('¿De dónde nos visitas?').selectOption('LOCAL');
            break;
        case 'PRESTADOR':
            await page.getByLabel('Nombre del Establecimiento').fill('Test Hotel');
            await page.getByLabel('Registro Nacional de Turismo (RNT)').fill('987654321');
            await page.getByLabel('Tipo de Servicio (ej: hotel, restaurante)').fill('Alojamiento');
            break;
        case 'ARTESANO':
            await page.getByLabel('Nombre del Taller').fill('Test Taller');
            await page.getByLabel('Tipo de Artesanía').fill('Cerámica');
            await page.getByLabel('Material Principal').fill('Arcilla');
            break;
        case 'ADMINISTRADOR':
            await page.getByLabel('Cargo').fill('Tester');
            await page.getByLabel('Dependencia Asignada').fill('QA');
            await page.getByLabel('Nivel de Acceso').fill('Pruebas');
            break;
        case 'FUNCIONARIO_DIRECTIVO':
            await page.getByLabel('Dependencia').fill('Testing');
            await page.getByLabel('Nivel de Dirección').fill('Jefe de Pruebas');
            await page.getByLabel('Área Funcional').fill('Automatización');
            break;
        case 'FUNCIONARIO_PROFESIONAL':
            await page.getByLabel('Dependencia').fill('Testing');
            await page.getByLabel('Profesión').fill('Ingeniero de Pruebas');
            await page.getByLabel('Área Asignada').fill('Ejecución');
            break;
    }

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();
    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
    await page.waitForURL('/login');
  }

  // Crear todos los usuarios de prueba antes de las pruebas de login
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    for (const role in users) {
        await registerUser(page, role, users[role].user);
    }
    await page.close();
  });

  test('Error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario o Correo Electrónico').fill('usuario_invalido');
    await page.getByLabel('Contraseña').fill('password_incorrecto');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // El mensaje de error exacto puede variar, pero esperamos un toast de error.
    await expect(page.locator('.Toastify__toast--error')).toBeVisible();
  });

  for (const role in users) {
    test(`Successful login and redirection for ${role}`, async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Usuario o Correo Electrónico').fill(users[role].user);
      await page.getByLabel('Contraseña').fill(users[role].pass);
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

      await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(users[role].url, { timeout: 10000 });
    });
  }
});