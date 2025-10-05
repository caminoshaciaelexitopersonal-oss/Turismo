import { test, expect } from '@playwright/test';

// Test suite para el flujo completo del Dashboard
test.describe('Dashboard E2E Flow', () => {

  // Definir las credenciales de prueba
  const TEST_USER = {
    username: 'admin',
    password: 'adminpassword',
  };

  // Definir una estructura de menú de prueba para el mock de la API
  const MOCK_MENU_DATA = [
    {
      title: 'Principal',
      links: [
        { href: '/dashboard/analytics', label: 'Resumen', icon: 'FiHome', allowedRoles: ['ADMIN', 'PRESTADOR', 'ARTESANO'] },
        { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: 'FiBarChart2', allowedRoles: ['ADMIN'] },
      ],
    },
    {
      title: 'Gestión',
      links: [
        { href: '/dashboard/usuarios', label: 'Usuarios', icon: 'FiUsers', allowedRoles: ['ADMIN'] },
        { href: '/dashboard/publicaciones', label: 'Publicaciones', icon: 'FiFileText', allowedRoles: ['ADMIN'] },
      ],
    },
  ];

  // Antes de cada prueba, realizar el inicio de sesión
  test.beforeEach(async ({ page }) => {
    // 1. Mockear la respuesta de la API para el menú
    await page.route('**/api/config/menu-items/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MENU_DATA),
      });
    });

    // 2. Navegar a la página de login
    await page.goto('/login');

    // 3. Rellenar el formulario de inicio de sesión
    await page.getByLabel('Usuario o Email').fill(TEST_USER.username);
    await page.getByLabel('Contraseña').fill(TEST_USER.password);

    // 4. Hacer clic en el botón para iniciar sesión
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // 5. Esperar a que la URL cambie al dashboard, indicando un login exitoso
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  // Prueba principal: verificar la carga del menú y la navegación
  test('should load sidebar menu and navigate views', async ({ page }) => {
    // 1. Verificar que el Sidebar es visible y muestra el menú mockeado
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('Principal')).toBeVisible();
    await expect(sidebar.getByText('Gestión')).toBeVisible();

    // 2. Hacer clic en la sección "Gestión" para expandirla
    await sidebar.getByRole('button', { name: 'Gestión' }).click();

    // 3. Hacer clic en el botón "Publicaciones"
    // Usamos getByRole('button') porque nuestros enlaces de navegación son botones
    const publicationsButton = sidebar.getByRole('button', { name: 'Publicaciones' });
    await expect(publicationsButton).toBeVisible();
    await publicationsButton.click();

    // 4. Verificar que el contenido principal se ha actualizado
    // NO verificamos la URL, sino el contenido que se renderiza
    const mainContentHeader = page.getByRole('heading', { name: 'Gestión de Publicaciones' });
    await expect(mainContentHeader).toBeVisible();

    // 5. Tomar una captura de pantalla para verificación visual
    await page.screenshot({ path: 'test-results/dashboard-publications-view.png' });
  });

  // Prueba de responsividad: verificar que el menú hamburguesa funciona en móviles
  test('should show hamburger menu on mobile and allow view navigation', async ({ page }) => {
    // 1. Emular un viewport de móvil
    await page.setViewportSize({ width: 375, height: 812 });

    // 2. Encontrar y hacer clic en el botón de hamburguesa
    const hamburgerButton = page.getByLabel('Toggle menu');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();

    // 3. El sidebar móvil (drawer) ahora debería ser visible
    // Lo localizamos por su `role="dialog"` que añadimos por accesibilidad
    const mobileSidebar = page.getByRole('dialog');
    await expect(mobileSidebar).toBeVisible();
    await expect(mobileSidebar).toHaveClass(/translate-x-0/);

    // 4. Navegar a una vista desde el menú móvil
    await mobileSidebar.getByRole('button', { name: 'Gestión' }).click();
    await mobileSidebar.getByRole('button', { name: 'Usuarios' }).click();

    // 5. Verificar que el contenido principal se ha actualizado
    const mainContentHeader = page.getByRole('heading', { name: 'Gestión de Usuarios y Roles' });
    await expect(mainContentHeader).toBeVisible();

    // 6. El sidebar móvil debería cerrarse tras la navegación (o podemos cerrarlo manualmente)
    // En este caso, al hacer clic, el estado cambia y el drawer se cierra.
    // La clase de transformación debería volver a `-translate-x-full`.
    // Damos un pequeño tiempo para que la transición CSS ocurra.
    await expect(mobileSidebar).toHaveClass(/.*-translate-x-full/);

    // 7. Tomar una captura de la vista móvil para verificación
    await page.screenshot({ path: 'test-results/dashboard-mobile-users-view.png' });
  });
});