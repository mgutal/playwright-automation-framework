import { test as base, expect } from '@playwright/test';
import { env } from '../config/env';
import { PostsService } from '../api/PostsService';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { HttpUtils } from '../utils/httpUtils';
import { logger } from '../utils/logger';

type CleanupFn = () => Promise<void>;

interface Fixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  /** HTTP client bound to API_BASE_URL (JSON APIs). */
  http: HttpUtils;
  /** HTTP client bound to UPLOAD_BASE_URL (multipart / echo service). */
  uploadHttp: HttpUtils;
  postsService: PostsService;
  /** Register a function that runs after the test (per-test teardown, runs in reverse order). */
  addCleanup: (fn: CleanupFn) => void;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  http: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(HttpUtils.fromContext(ctx, { authToken: env.apiToken }));
    await ctx.dispose();
  },

  uploadHttp: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: env.uploadBaseUrl });
    await use(HttpUtils.fromContext(ctx));
    await ctx.dispose();
  },

  postsService: async ({ http }, use) => {
    await use(new PostsService(http));
  },

  // Per-test setup/teardown: everything before `use` is setup, everything after is teardown.
  addCleanup: async ({}, use, testInfo) => {
    const fns: CleanupFn[] = [];
    await use((fn) => fns.push(fn));
    for (const fn of fns.reverse()) {
      try {
        await fn();
      } catch (e) {
        logger.warn(`Cleanup failed in "${testInfo.title}": ${(e as Error).message}`);
      }
    }
  },
});

export { expect };
