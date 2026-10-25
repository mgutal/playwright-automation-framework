import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/** Runs once after the whole suite: remove the saved session and point at the reports. */
async function globalTeardown(_config: FullConfig): Promise<void> {
  fs.rmSync(path.resolve('.auth'), { recursive: true, force: true });
  logger.info('Reports: "npm run report:html" (Playwright HTML) or "npm run report:allure" (Allure)');
}

export default globalTeardown;
