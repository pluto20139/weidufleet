import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BatteryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get monitorViewBtns() {
    return this.page.locator('table button').filter({ hasText: '查看' });
  }

  /** 监控详情 Modal */
  get detailModal() {
    return this.page.locator('.ant-modal-content');
  }

  get modalStatTitles() {
    return this.detailModal.locator('.ant-statistic-title');
  }

  get modalChartCanvas() {
    return this.detailModal.locator('canvas');
  }

  /** 放电记录 tab */
  get dischargeTab() {
    return this.page.locator('button').filter({ hasText: '放电记录' });
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  get rangePicker() {
    return this.page.locator('.ant-picker-range').first();
  }
}
