import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SysUsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get title() {
    return this.page.locator('h2');
  }

  /** 确认页面渲染了用户列表 */
  get userTable() {
    return this.page.locator('.ant-table');
  }
}
