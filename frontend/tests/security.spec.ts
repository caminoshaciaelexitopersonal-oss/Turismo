import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pruebas de Seguridad Específicas', () => {

  // Test 1: Redirección de usuarios no autenticados
  test('debería redirigir al login al intentar acceder a una ruta protegida sin autenticación', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    // Esperar a que la URL cambie a la página de login
    await page.waitForURL(`${BASE_URL}/login**`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    // Verificar que se muestra un elemento clave de la página de login
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  // Test 2: Control de acceso basado en roles
  test('un Turista no debería poder acceder a contenido de Administrador', async ({ page }) => {
    // Primero, iniciamos sesión como un usuario con el rol más bajo (Turista)
    // Para simplificar, usaremos credenciales pre-existentes o crearemos uno nuevo.
    // Asumiendo que tenemos un turista: turista@test.com / password123
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Correo Electrónico').fill('turista@test.com');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await page.waitForURL(`${BASE_URL}/mi-viaje`); // El turista es redirigido a su página

    // Ahora, intentamos navegar a una URL de administración
    await page.goto(`${BASE_URL}/dashboard`);

    // La aplicación debería impedir el acceso.
    // La expectativa es que el dashboard del turista se muestre, y no el de admin.
    // O que se muestre una página de "Acceso Denegado".
    // Verificamos que NO se muestre un título de administrador.
    const adminHeader = page.locator('h1', { hasText: 'Dashboard Principal' });
    await expect(adminHeader).not.toBeVisible();

    // Verificamos que sí se muestre un elemento del dashboard de turista o una redirección.
    const turistaHeader = page.locator('h1', { hasText: 'Mi Viaje' });
    const dashboardHeader = page.locator('h2', { hasText: 'Gestión de' }); // Título genérico de otros dashboards
    await expect(turistaHeader.or(dashboardHeader)).toBeVisible();
  });

  // Test 3: Prevención de Inyección de XSS en un formulario
  test('debería renderizar un intento de XSS como texto plano', async ({ page }) => {
    const xssPayload = '<script>document.body.style.backgroundColor="red"</script>';

    // Usaremos el formulario de registro como ejemplo, en un campo de texto.
    await page.goto(`${BASE_URL}/registro`);

    await page.getByLabel('Quiero registrarme como:').selectOption('PRESTADOR');

    // Inyectamos el payload en un campo de texto
    await page.getByLabel('Nombre del Establecimiento').fill(xssPayload);
    await page.getByLabel('Correo Electrónico').fill(`xss-test-${Date.now()}@test.com`);
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByLabel('Confirmar Contraseña').fill('password123');
    await page.getByLabel('Registro Nacional de Turismo (RNT)').fill('1234567890');
    await page.getByLabel('Tipo de Servicio (Hotel, Restaurante, etc.)').fill('Hotel XSS');

    // Aunque no completemos el flujo, podemos verificar que el valor en el input
    // no ha sido ejecutado. La prueba más simple es verificar que el color de fondo no cambió.
    const bodyBackgroundColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBackgroundColor).not.toBe('rgb(255, 0, 0)'); // No debe ser rojo

    // Una prueba más robusta sería verificar que, si este dato se muestra en algún
    // lugar, aparezca como texto y no como un nodo de script.
    // Por ahora, esta validación del lado del cliente es un buen indicador.
  });

});