import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Registro de Turista', () => {
  const username = faker.internet.username().toLowerCase();
  const email = faker.internet.email().toLowerCase();
  const password = faker.internet.password();

  test('debería mostrar el formulario de registro correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/registro');

    await expect(page).toHaveTitle(/Turismo Puerto Gaitán/);

    await expect(page.getByRole('heading', { name: 'Crear una Cuenta' })).toBeVisible();
  });

  test('debería permitir el registro de un turista extranjero exitosamente', async ({ page }) => {
    await page.goto('http://localhost:3000/registro');

    await page.getByLabel('Nombre de Usuario').fill(username);
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByLabel('Confirmar Contraseña').fill(password);
    await page.getByLabel('Quiero registrarme como:').selectOption('TURISTA');

    const origenSelect = page.getByLabel('¿De dónde nos visitas?');
    await expect(origenSelect).toBeVisible();
    await origenSelect.selectOption('EXTRANJERO');

    // Añadir una espera explícita para que el campo condicional aparezca
    await page.waitForSelector('input[name="paisOrigen"]', { state: 'visible' });

    const paisOrigenInput = page.getByLabel('País de Origen');
    await paisOrigenInput.fill('Alemania');

    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // La lógica de la página redirige después de un tiempo, así que aumentamos el timeout
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });
});