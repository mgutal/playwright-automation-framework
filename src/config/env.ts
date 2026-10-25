import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  uiBaseUrl: process.env.UI_BASE_URL ?? 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com',
  uploadBaseUrl: process.env.UPLOAD_BASE_URL ?? 'https://httpbin.org',
  username: process.env.UI_USERNAME ?? 'standard_user',
  password: process.env.UI_PASSWORD ?? 'secret_sauce',
  apiToken: process.env.API_TOKEN ?? '',
  skipAuthSetup: process.env.SKIP_AUTH_SETUP === 'true',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  authStatePath: path.resolve(process.cwd(), '.auth', 'user.json'),
  testDataDir: path.resolve(process.cwd(), 'test-data'),
} as const;
