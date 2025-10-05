import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Detailed Error Toast Verification', () => {

  test('should show toast with detailed backend error on registration failure', async ({ page }) => {
    await page.goto('http://localhost:3000/registro');

    // Llenar el formulario con datos válidos, excepto por el email
    await page.getByLabel('Nombre de Usuario').fill(faker.internet.username().toLowerCase());
    await page.getByLabel('Correo Electrónico').fill('correo-invalido'); // Email inválido a propósito
    await page.getByLabel('Contraseña', { exact: true }).fill('password123');
    await page.getByLabel('Confirmar Contraseña').fill('password123');
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');

    // Enviar el formulario para provocar el error
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // Verificar que aparece un toast de error
    const errorToast = page.locator('.Toastify__toast--error');
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    // Verificar que el toast contiene el mensaje de error técnico del backend
    // Esto confirma que la lógica para el entorno de desarrollo funciona.
    await expect(errorToast).toContainText(/email: Enter a valid email address/i);
  });

});