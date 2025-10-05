import { test, expect } from '@playwright/test';

test.describe('Flujo de Login para Diferentes Roles', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('debería permitir el login de un Super Admin', async ({ page }) => {
    await page.getByLabel('Correo Electrónico o Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('adminpassword');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    // Verificar que el botón de Cerrar Sesión está visible, confirmando el login
    await expect(page.getByRole('button', { name: /Cerrar Sesión/i })).toBeVisible();
  });

  test('debería permitir el login de un Funcionario Directivo', async ({ page }) => {
    await page.getByLabel('Correo Electrónico o Usuario').fill('directivo');
    await page.getByLabel('Contraseña').fill('directivopassword');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    // Verificar que el botón de Cerrar Sesión está visible
    await expect(page.getByRole('button', { name: /Cerrar Sesión/i })).toBeVisible();
  });

  test('debería permitir el login de un Funcionario Profesional', async ({ page }) => {
    await page.getByLabel('Correo Electrónico o Usuario').fill('profesional');
    await page.getByLabel('Contraseña').fill('profesionalpassword');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    // Verificar que el botón de Cerrar Sesión está visible
    await expect(page.getByRole('button', { name: /Cerrar Sesión/i })).toBeVisible();
  });

});