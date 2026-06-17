import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3002',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'chromium',
      testDir: './e2e/specs',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
});
