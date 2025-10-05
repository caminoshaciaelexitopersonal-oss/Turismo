import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Verificación de Notificaciones Toast de Error', () => {

  test('debería mostrar un toast con el error del backend al fallar el registro', async ({ page }) => {
    await page.goto('http://localhost:3000/registro');

    // Llenar el formulario con datos válidos, excepto por el email
    await page.getByLabel('Nombre de Usuario').fill(faker.internet.username().toLowerCase());
    await page.getByLabel('Correo Electrónico').fill('correo-invalido'); // Email inválido
    await page.getByLabel('Contraseña', { exact: true }).fill('password123');
    await page.getByLabel('Confirmar Contraseña').fill('password123');
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');

    // Enviar el formulario
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // Verificar que aparece un toast de error con el mensaje específico del backend
    // En un entorno de desarrollo, esperamos el mensaje técnico.
    const errorToast = page.locator('.Toastify__toast--error');
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    // El mensaje exacto puede variar, pero debe contener la causa del error.
    await expect(errorToast).toContainText(/email: Enter a valid email address/i);
  });

});