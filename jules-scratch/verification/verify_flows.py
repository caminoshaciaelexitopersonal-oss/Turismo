import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # --- Parte 1: Verificación del Formulario de Registro Dinámico ---

        # Generar datos únicos para el nuevo usuario
        timestamp = asyncio.get_event_loop().time()
        email = f"prestador_{timestamp}@example.com"
        username = f"prestador_{timestamp}"
        password = "password123"

        # 1. Navegar a la página de registro
        await page.goto("http://localhost:3000/registro")

        # 2. Seleccionar el rol de Prestador
        await page.get_by_label('Quiero registrarme como:').select_option('PRESTADOR')

        # 3. Verificar que los campos específicos del Prestador son visibles
        await expect(page.get_by_label('Nombre del Establecimiento')).to_be_visible()
        await expect(page.get_by_label('Registro Nacional de Turismo (RNT)')).to_be_visible()
        await expect(page.get_by_label('Tipo de Servicio (Hotel, Restaurante, etc.)')).to_be_visible()

        # 4. Tomar la primera captura de pantalla
        await page.screenshot(path="jules-scratch/verification/01_registro_prestador_form.png")

        # 5. Completar el registro
        await page.get_by_label('Correo Electrónico').fill(email)
        await page.get_by_label('Nombre de Usuario').fill(username)
        await page.get_by_label('Contraseña', exact=True).fill(password)
        await page.get_by_label('Confirmar Contraseña').fill(password)
        await page.get_by_label('Nombre del Establecimiento').fill("Hotel Verificación")
        await page.get_by_label('Registro Nacional de Turismo (RNT)').fill("1234567890")
        await page.get_by_label('Tipo de Servicio (Hotel, Restaurante, etc.)').fill("Hotel")

        await page.get_by_role('button', name='Crear Cuenta').click()

        # 6. Verificar el mensaje de éxito y la redirección
        # CORRECCIÓN: Usar el texto exacto del mensaje de éxito que se muestra en la página
        await expect(page.locator('text=¡Registro exitoso! Serás redirigido para iniciar sesión.')).to_be_visible(timeout=10000)
        await page.wait_for_url("http://localhost:3000/login", timeout=5000)
        await expect(page).to_have_url("http://localhost:3000/login")

        # --- Parte 2: Verificación del Inicio de Sesión y Dashboard ---

        # 7. Iniciar sesión con el nuevo usuario
        await page.get_by_label('Correo Electrónico').fill(email)
        await page.get_by_label('Contraseña').fill(password)
        await page.get_by_role('button', name='Iniciar Sesión').click()

        # 8. Esperar la redirección al dashboard
        await page.wait_for_url("http://localhost:3000/dashboard", timeout=15000)
        await expect(page).to_have_url("http://localhost:3000/dashboard")

        # 9. Verificar que se muestra el panel correcto del Prestador
        prestador_header = page.locator('h2', { "has_text": 'Gestión de Prestadores de Servicios' })
        await expect(prestador_header).to_be_visible(timeout=10000)

        # 10. Tomar la segunda captura de pantalla
        await page.screenshot(path="jules-scratch/verification/02_dashboard_prestador.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())