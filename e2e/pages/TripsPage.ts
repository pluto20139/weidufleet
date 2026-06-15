import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TripsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get viewLocationLinks() {
    return this.page.locator('td').filter({ hasText: '查看位置' });
  }

  get firstViewDetail() {
    return this.page.locator('table a').filter({ hasText: '查看' }).first();
  }

  get detailDescriptions() {
    return this.page.locator('.ant-descriptions');
  }

  get alertCards() {
    return this.page.locator('.ant-card').filter({ hasText: '告警' });
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }
}
