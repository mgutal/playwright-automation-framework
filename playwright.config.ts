import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  // Setup / teardown (runs once per test run)
  globalSetup: require.resolve('./src/global/global-setup'),
  globalTeardown: require.resolve('./src/global/global-teardown'),

  // Reporting: console list + HTML + Allure (+ JUnit on CI)
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }],
    ...(isCI ? ([['junit', { outputFile: 'test-results/junit.xml' }]] as const) : []),
  ],

  use: {
    testIdAttribute: 'data-test', // saucedemo uses data-test
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiBaseUrl },
    },
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.uiBaseUrl,
        // Session created once in global-setup; login specs override this.
        storageState: env.authStatePath,
      },
    },
    // Enable more browsers when needed:
    // { name: 'ui-firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'], baseURL: env.uiBaseUrl, storageState: env.authStatePath } },
  ],
});
