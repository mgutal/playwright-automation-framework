import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Runs once before the whole suite:
 *  1. cleans stale report folders (so Allure/HTML only show this run)
 *  2. logs in through the UI once and stores the session in .auth/user.json
 *     (authenticated UI specs reuse it via storageState and skip the login screen)
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  for (const dir of ['allure-results', 'test-results']) {
    fs.rmSync(path.resolve(dir), { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(env.authStatePath), { recursive: true });
  // Always leave a valid (empty) state file so projects using storageState can start.
  fs.writeFileSync(env.authStatePath, JSON.stringify({ cookies: [], origins: [] }));

  if (env.skipAuthSetup) {
    logger.info('SKIP_AUTH_SETUP=true: skipping UI login');
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL: env.uiBaseUrl });
    await page.goto('/');
    await page.getByTestId('username').fill(env.username);
    await page.getByTestId('password').fill(env.password);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/inventory/);
    await page.context().storageState({ path: env.authStatePath });
    logger.info(`Auth state saved to ${env.authStatePath}`);
  } catch (e) {
    logger.warn(`Global login failed, authenticated UI tests will fail: ${(e as Error).message}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
