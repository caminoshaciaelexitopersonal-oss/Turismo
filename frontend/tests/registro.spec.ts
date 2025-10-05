import { test, expect } from '@playwright/test';

test.describe('Flujo de Registro de Usuarios', () => {
  const uniqueId = () => Date.now();

  const fillCommonFields = async (page, id) => {
    await page.getByLabel('Correo Electrónico').fill(`testuser_${id}@example.com`);
    await page.getByLabel('Nombre de Usuario').fill(`testuser_${id}`);
    await page.getByLabel('Contraseña').fill('ValidPassword123');
    await page.getByLabel('Confirmar Contraseña').fill('ValidPassword123');
  };

  test('Error: Passwords do not match', async ({ page }) => {
    await page.goto('/registro');
    await page.getByLabel('Correo Electrónico').fill('test_password_mismatch@example.com');
    await page.getByLabel('Nombre de Usuario').fill('mismatch_user');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByLabel('Confirmar Contraseña').fill('password456');
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await expect(page.locator('.Toastify__toast--error')).toBeVisible();
  });

  test('Registro exitoso de Turista Extranjero', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');

    await expect(page.getByText('Información de Turista')).toBeVisible();

    await page.getByLabel('¿De dónde nos visitas?').selectOption('EXTRANJERO');
    await page.getByLabel('País de Origen').fill('Wonderland');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('Registro exitoso de Prestador de Servicios', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('PRESTADOR');

    await expect(page.getByText('Información del Prestador')).toBeVisible();

    await page.getByLabel('Nombre del Establecimiento').fill('Hotel Paraiso');
    await page.getByLabel('Registro Nacional de Turismo (RNT)').fill('1234567890');
    await page.getByLabel('Tipo de Servicio (ej: hotel, restaurante)').fill('Hotel');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
  });

  test('Registro exitoso de Artesano', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('ARTESANO');

    await expect(page.getByText('Información del Artesano')).toBeVisible();

    await page.getByLabel('Nombre del Taller').fill('Manos Magicas');
    await page.getByLabel('Tipo de Artesanía').fill('Tejidos');
    await page.getByLabel('Material Principal').fill('Lana');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
  });

  test('Registro exitoso de Administrador', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('ADMINISTRADOR');

    await expect(page.getByText('Información del Administrador')).toBeVisible();

    await page.getByLabel('Cargo').fill('Admin Principal');
    await page.getByLabel('Dependencia Asignada').fill('Tecnologia');
    await page.getByLabel('Nivel de Acceso').fill('Total');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
  });

  test('Registro exitoso de Funcionario Directivo', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('FUNCIONARIO_DIRECTIVO');

    await expect(page.getByText('Información del Funcionario Directivo')).toBeVisible();

    await page.getByLabel('Dependencia').fill('Secretaria de Turismo');
    await page.getByLabel('Nivel de Dirección').fill('Director');
    await page.getByLabel('Área Funcional').fill('Planeacion');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
  });

  test('Registro exitoso de Funcionario Profesional', async ({ page }) => {
    const id = uniqueId();
    await page.goto('/registro');

    await fillCommonFields(page, id);
    await page.getByLabel('Quiero registrarme como:').selectOption('FUNCIONARIO_PROFESIONAL');

    await expect(page.getByText('Información del Funcionario Profesional')).toBeVisible();

    await page.getByLabel('Dependencia').fill('Oficina de Cultura');
    await page.getByLabel('Profesión').fill('Antropologo');
    await page.getByLabel('Área Asignada').fill('Investigacion');

    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    await expect(page.getByText('¡Registro exitoso! Serás redirigido para iniciar sesión.')).toBeVisible({ timeout: 10000 });
  });
});