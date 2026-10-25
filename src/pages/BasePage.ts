import { expect, Locator, Page, test } from '@playwright/test';

/** Shared behaviour for every page object. Page objects expose actions and state, never assertions on business rules. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Relative path of the page, used by open(). */
  protected abstract readonly path: string;

  async open(): Promise<void> {
    await test.step(`Open ${this.path}`, async () => {
      await this.page.goto(this.path);
    });
  }

  protected async click(locator: Locator, description: string): Promise<void> {
    await test.step(`Click ${description}`, () => locator.click());
  }

  protected async fill(locator: Locator, value: string, description: string): Promise<void> {
    await test.step(`Fill ${description}`, () => locator.fill(value));
  }

  protected async textOf(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
