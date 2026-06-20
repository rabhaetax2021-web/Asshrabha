import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: ({ url: 'http://localhost:3000', reuseExistingServer: true } as any),
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
