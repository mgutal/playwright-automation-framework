import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  protected readonly path = '/';

  private readonly username: Locator;
  private readonly password: Locator;
  private readonly loginButton: Locator;
  private readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorBanner = page.getByTestId('error');
  }

  async login(user: string, pass: string): Promise<void> {
    await this.fill(this.username, user, 'username');
    await this.fill(this.password, pass, 'password');
    await this.click(this.loginButton, 'login button');
  }

  async errorMessage(): Promise<string> {
    await this.errorBanner.waitFor({ state: 'visible' });
    return this.textOf(this.errorBanner);
  }

  get errorLocator(): Locator {
    return this.errorBanner;
  }
}
