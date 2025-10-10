import asyncio
from playwright.async_api import async_playwright

async def main():
    """
    Verifica el login del rol de Administrador y toma una captura de pantalla
    de la página resultante para una inspección visual.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("--- Verificando el login del Administrador ---")
        try:
            await page.goto("http://localhost:3000/login", timeout=30000)

            await page.get_by_label("Correo Electrónico").fill("admin")
            await page.get_by_label("Contraseña").fill("password123")

            await page.get_by_role("button", name="Iniciar Sesión").click()

            # Esperar un tiempo fijo para que la redirección ocurra
            print("Esperando 5 segundos para la redirección...")
            await page.wait_for_timeout(5000)

            screenshot_path = "jules-scratch/fase3_admin_login_result.png"
            print(f"Tomando captura de pantalla de la página de resultado en {screenshot_path}")
            await page.screenshot(path=screenshot_path)

            print(f"Captura de pantalla guardada. URL final: {page.url}")

        except Exception as e:
            print(f"❌ Ocurrió un error durante la verificación: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())