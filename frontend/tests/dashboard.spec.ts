import { test, expect } from '@playwright/test';

// Test suite para el flujo completo del Dashboard
test.describe('Dashboard E2E Flow', () => {

  // Definir las credenciales de prueba
  const TEST_USER = {
    username: 'admin',
    password: 'adminpassword',
  };

  // Antes de cada prueba, realizar el inicio de sesión
  test.beforeEach(async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto('/login');

    // 2. Rellenar el formulario de inicio de sesión
    await page.getByLabel('Usuario o Email').fill(TEST_USER.username);
    await page.getByLabel('Contraseña').fill(TEST_USER.password);

    // 3. Hacer clic en el botón para iniciar sesión
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 4. Esperar a que la URL cambie al dashboard, indicando un login exitoso
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  // Prueba principal: verificar la carga del menú y la navegación
  test('should load sidebar menu and navigate to a page', async ({ page }) => {
    // 1. Verificar que el Sidebar es visible después de iniciar sesión
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 2. Verificar que el esqueleto de carga desaparece y el menú real aparece
    // Esperamos a que aparezca un elemento que solo se renderiza con datos reales.
    await expect(sidebar.getByText('SITYC')).toBeVisible({ timeout: 15000 }); // El título del Sidebar
    await expect(sidebar.getByText('Principal')).toBeVisible(); // Una sección del menú

    // 3. Hacer clic en la sección "Administración" para expandirla
    await sidebar.getByRole('button', { name: 'Administración' }).click();

    // 4. Hacer clic en el enlace "Gestión de Formularios"
    const formManagementLink = sidebar.getByRole('link', { name: 'Gestión de Formularios' });
    await expect(formManagementLink).toBeVisible();
    await formManagementLink.click();

    // 5. Verificar que la navegación a la página de formularios fue exitosa
    await expect(page).toHaveURL('/dashboard/formularios');

    // 6. Verificar que el contenido de la página de destino se ha cargado correctamente
    // Buscamos el encabezado principal de la página de gestión de formularios.
    const mainContentHeader = page.getByRole('heading', { name: 'Gestión de Formularios' });
    await expect(mainContentHeader).toBeVisible();

    // 7. (Opcional) Tomar una captura de pantalla para verificación visual
    await page.screenshot({ path: 'test-results/dashboard-formularios-page.png' });
  });

  // Prueba de responsividad: verificar que el menú hamburguesa funciona en móviles
  test('should show hamburger menu on mobile and allow navigation', async ({ page }) => {
    // 1. Emular un viewport de móvil
    await page.setViewportSize({ width: 375, height: 812 });

    // 2. El sidebar principal no debería ser visible directamente
    const desktopSidebar = page.locator('aside.hidden.lg\\:flex');
    await expect(desktopSidebar).not.toBeVisible();

    // 3. Encontrar y hacer clic en el botón de hamburguesa usando su aria-label
    const hamburgerButton = page.getByLabel('Toggle menu');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();

    // 4. El sidebar móvil (drawer) ahora debería ser visible
    const mobileSidebar = page.locator('div.lg\\:hidden.fixed.inset-0.z-50');
    await expect(mobileSidebar).toBeVisible();

    // 5. Navegar a una página desde el menú móvil
    // Asegurarse de que la sección "Administración" es visible y hacer clic
    const adminSection = mobileSidebar.getByRole('button', { name: 'Administración' });
    await expect(adminSection).toBeVisible();
    await adminSection.click();

    // Hacer clic en el enlace "Gestión de Usuarios" que ahora está visible
    const userManagementLink = mobileSidebar.getByRole('link', { name: 'Gestión de Usuarios' });
    await expect(userManagementLink).toBeVisible();
    await userManagementLink.click();

    // 6. Verificar la navegación exitosa a la página correcta
    await expect(page).toHaveURL('/dashboard/usuarios');
    await expect(page.getByRole('heading', { name: 'Gestión de Usuarios' })).toBeVisible();

    // 7. (Opcional) Tomar una captura de la vista móvil para verificación
    await page.screenshot({ path: 'test-results/dashboard-mobile-navigation.png' });
  });
});