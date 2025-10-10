import asyncio
from playwright.async_api import async_playwright

async def main():
    """
    Toma una captura de pantalla de la página de inicio para verificar su estado.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            print("Navegando a http://localhost:3000...")
            await page.goto("http://localhost:3000", timeout=30000)

            print("Esperando a que la red esté inactiva para asegurar que todo ha cargado...")
            await page.wait_for_load_state('networkidle', timeout=15000)

            screenshot_path = "jules-scratch/fase2_frontend_screenshot.png"
            print(f"Tomando captura de pantalla y guardando en {screenshot_path}...")
            await page.screenshot(path=screenshot_path)
            print("Captura de pantalla tomada exitosamente.")

        except Exception as e:
            print(f"Ocurrió un error: {e}")
        finally:
            await browser.close()
            print("Navegador cerrado.")

if __name__ == "__main__":
    asyncio.run(main())