import asyncio
from playwright.async_api import async_playwright

# --- Configuración de Roles y Credenciales ---
# La contraseña es la misma para todos, según las instrucciones.
COMMON_PASSWORD = "password123"
BASE_URL = "http://localhost:3000"

ROLES_A_PROBAR = {
    "Turista": {
        "user": "turista",
        "expected_url": f"{BASE_URL}/mi-viaje",
        "success": False
    },
    "Prestador": {
        "user": "prestador",
        "expected_url": f"{BASE_URL}/dashboard",
        "success": False
    },
    "Artesano": {
        "user": "artesano",
        "expected_url": f"{BASE_URL}/dashboard",
        "success": False
    },
    "Administrador": {
        "user": "admin",
        "expected_url": f"{BASE_URL}/dashboard",
        "success": False
    },
    "Funcionario Directivo": {
        "user": "directivo",
        "expected_url": f"{BASE_URL}/dashboard",
        "success": False
    },
    "Funcionario Profesional": {
        "user": "profesional",
        "expected_url": f"{BASE_URL}/dashboard",
        "success": False
    },
}

async def verificar_rol(page, rol, datos):
    """Función para verificar el login y redirección de un rol específico."""
    print(f"--- Verificando rol: {rol} ---")
    try:
        await page.goto(f"{BASE_URL}/login", timeout=30000)

        # Llenar formulario de login
        await page.get_by_label("Correo Electrónico").fill(datos["user"])
        await page.get_by_label("Contraseña").fill(COMMON_PASSWORD)

        # Hacer clic en el botón de iniciar sesión
        await page.get_by_role("button", name="Iniciar Sesión").click()

        # Esperar a la redirección
        await page.wait_for_url(datos["expected_url"], timeout=15000)

        print(f"URL actual: {page.url}")
        print(f"URL esperada: {datos['expected_url']}")

        # Verificar que la URL final es la correcta
        if page.url == datos["expected_url"]:
            print(f"✅ ÉXITO: Redirección correcta para {rol}.")
            datos["success"] = True
        else:
            print(f"❌ FALLO: Redirección incorrecta para {rol}.")
            print(f"  - Se esperaba: {datos['expected_url']}")
            print(f"  - Se obtuvo: {page.url}")

    except Exception as e:
        print(f"❌ ERROR durante la verificación de {rol}: {e}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        for rol, datos in ROLES_A_PROBAR.items():
            await verificar_rol(page, rol, datos)
            print("-" * 25)

        await browser.close()

        # Imprimir resumen final
        print("\n--- RESUMEN DE VERIFICACIÓN DE ROLES ---")
        for rol, datos in ROLES_A_PROBAR.items():
            estado = "✅ Éxito" if datos["success"] else "❌ Fallo"
            print(f"- {rol}: {estado}")
        print("-" * 35)

if __name__ == "__main__":
    asyncio.run(main())