import { test, expect } from '../../src/fixtures/test-fixtures';

// Uses the session saved by global-setup, so no login step here.
test.describe('Inventory (authenticated session)', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('shows the product list @smoke @ui', async ({ inventoryPage }) => {
    await expect(inventoryPage.titleLocator).toHaveText('Products');
    expect(await inventoryPage.itemCount()).toBe(6);
  });

  test('adds and removes an item from the cart @ui', async ({ inventoryPage }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadgeLocator).toHaveText('1');

    await inventoryPage.removeFromCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadgeLocator).toHaveCount(0);
  });

  test('sorts products Z to A @ui', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.itemNames();
    expect(names).toEqual([...names].sort().reverse());
  });
});
