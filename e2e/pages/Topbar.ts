import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class Topbar extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get langBtn() {
    return this.page.locator('.ant-layout-header button').filter({ hasText: /^(ZH|EN)$/ });
  }

  async switchLang() {
    await this.langBtn.click();
    await this.page.waitForTimeout(500);
  }

  async getCurrentLangFlag(): Promise<string> {
    return (await this.langBtn.textContent()) || '';
  }
}
