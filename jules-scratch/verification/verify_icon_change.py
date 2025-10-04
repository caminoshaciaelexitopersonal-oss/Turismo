from playwright.sync_api import sync_playwright, Page, expect
import time

def run_verification(page: Page):
    """
    Verifies that the floating agent icon has been updated.
    """
    # Navigate to the homepage
    page.goto("http://localhost:3000")

    # Wait for the floating agent icon to be visible
    agent_button = page.get_by_label("Abrir asistente turístico")
    expect(agent_button).to_be_visible(timeout=15000)

    # Find the image inside the button
    agent_image = agent_button.get_by_role("img")
    expect(agent_image).to_be_visible()

    # The src attribute is handled by Next.js image optimization, so we
    # won't check it directly. The visual confirmation is what matters.

    # Take a screenshot of just the icon for a focused verification
    agent_button.screenshot(path="jules-scratch/verification/agent_icon_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()