import { Page } from '@playwright/test';
import { waitForPageReady } from '../utils/helpers';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(url: string) {
    await this.page.goto(url);
    await waitForPageReady(this.page);
  }

  async waitReady() {
    await waitForPageReady(this.page);
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png` });
  }
}
