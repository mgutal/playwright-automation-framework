import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';

  private readonly pageTitle: Locator;
  private readonly items: Locator;
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;
  private readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  get titleLocator(): Locator {
    return this.pageTitle;
  }

  get itemsLocator(): Locator {
    return this.items;
  }

  get cartBadgeLocator(): Locator {
    return this.cartBadge;
  }

  async itemCount(): Promise<number> {
    return this.items.count();
  }

  /** @param slug e.g. "sauce-labs-backpack" */
  async addToCart(slug: string): Promise<void> {
    await this.click(this.page.getByTestId(`add-to-cart-${slug}`), `add ${slug} to cart`);
  }

  async removeFromCart(slug: string): Promise<void> {
    await this.click(this.page.getByTestId(`remove-${slug}`), `remove ${slug} from cart`);
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(value);
  }

  async itemNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async openCart(): Promise<void> {
    await this.click(this.cartLink, 'cart link');
  }
}
