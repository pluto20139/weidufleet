import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get statCards() {
    return this.page.locator('.ant-statistic');
  }

  get statTitles() {
    return this.page.locator('.ant-statistic-title');
  }

  get rankingTable() {
    return this.page.locator('.ant-table').last();
  }

  get rankingHeaders() {
    return this.rankingTable.locator('.ant-table-thead th');
  }
}
