from playwright.sync_api import sync_playwright, Page, expect

def verify_dashboard_layout(page: Page):
    """
    Verifies the new responsive dashboard layout, including collapsible menus
    and the mobile hamburger menu.
    """
    # 1. Login as admin
    page.goto("http://localhost:3000/login")
    page.get_by_label("Correo Electrónico o Usuario").fill("admin")
    page.get_by_label("Contraseña").fill("adminpassword")
    page.get_by_role("button", name="Iniciar Sesión").click()
    expect(page).to_have_url("/dashboard", timeout=10000)

    # 2. Screenshot of the initial desktop layout
    page.screenshot(path="jules-scratch/verification/01_desktop_layout.png")
    print("Screenshot 1 (Desktop Layout) taken.")

    # 3. Interact with the collapsible menu
    # Click on the "Administración" menu button to expand it
    admin_menu_button = page.get_by_role("button", name="Administración")
    admin_menu_button.click()

    # Click on the "Gestión de Usuarios" link within the expanded menu
    user_management_link = page.get_by_role("link", name="Gestión de Usuarios")
    user_management_link.click()

    # 4. Assert navigation and take screenshot of the new content
    expect(page).to_have_url("/dashboard/usuarios", timeout=10000)
    # Check for a unique element on the user management page
    expect(page.get_by_role("heading", name="Gestionar Usuarios")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/02_user_management_view.png")
    print("Screenshot 2 (User Management View) taken.")

def verify_mobile_layout(page: Page):
    """
    Verifies the mobile layout, including the hamburger menu.
    """
    # 5. Login again (new context) and set mobile viewport
    page.goto("http://localhost:3000/login")
    page.get_by_label("Correo Electrónico o Usuario").fill("admin")
    page.get_by_label("Contraseña").fill("adminpassword")
    page.get_by_role("button", name="Iniciar Sesión").click()
    expect(page).to_have_url("/dashboard", timeout=10000)

    # 6. Click the hamburger menu button
    hamburger_button = page.get_by_label("Toggle menu")
    expect(hamburger_button).to_be_visible()
    hamburger_button.click()

    # 7. Assert that the sidebar is now visible and take a screenshot
    sidebar = page.locator("aside")
    expect(sidebar).to_be_visible()
    page.screenshot(path="jules-scratch/verification/03_mobile_sidebar_open.png")
    print("Screenshot 3 (Mobile Sidebar) taken.")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Desktop Test ---
        page_desktop = browser.new_page()
        verify_dashboard_layout(page_desktop)

        # --- Mobile Test ---
        page_mobile = browser.new_page(viewport={"width": 375, "height": 667})
        verify_mobile_layout(page_mobile)

        browser.close()

if __name__ == "__main__":
    main()