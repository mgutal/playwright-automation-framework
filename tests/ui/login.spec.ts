import path from 'path';
import { test, expect } from '../../src/fixtures/test-fixtures';
import { env } from '../../src/config/env';
import { readExcel } from '../../src/utils/excelReader';

interface LoginRow {
  testCase: string;
  username?: string;
  password?: string;
  expected: 'success' | 'error';
  expectedMessage?: string;
}

// Excel rows -> JSON objects -> one generated test per row
const rows = readExcel<LoginRow & Record<string, unknown>>(path.join(env.testDataDir, 'testdata.xlsx'), 'LoginData');

// Login tests must start logged out, so drop the shared session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login (data-driven from Excel)', () => {
  for (const row of rows) {
    test(`${row.testCase} @smoke @ui`, async ({ loginPage, inventoryPage }) => {
      await loginPage.open();
      await loginPage.login(String(row.username ?? ''), String(row.password ?? ''));

      if (row.expected === 'success') {
        await expect(inventoryPage.titleLocator).toHaveText('Products');
        await loginPage.expectUrlContains('inventory');
      } else {
        await expect(loginPage.errorLocator).toContainText(String(row.expectedMessage));
      }
    });
  }
});
