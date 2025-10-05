import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT || 3000;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  webServer: [
    {
      command: 'cd ../backend && python manage.py runserver 8000',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: baseURL,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});