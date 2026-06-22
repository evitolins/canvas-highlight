import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  webServer: {
    command: 'npm run dev',
    port: 5200,
    reuseExistingServer: !process.env['CI'],
    env: { BROWSER: 'none' }, // suppress Vite's auto-open when started by Playwright
  },
  use: {
    baseURL: 'http://localhost:5200',
    viewport: { width: 1280, height: 900 },
  },
});
