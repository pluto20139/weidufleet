import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DataExportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }
}
