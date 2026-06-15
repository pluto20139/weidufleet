import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DrivingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  /** 驾驶报告列表第一个"查看"按钮 */
  get firstReportViewBtn() {
    return this.page.locator('table a').filter({ hasText: '查看' }).first();
  }

  /** 报告详情弹窗 */
  get reportModal() {
    return this.page.locator('.ant-modal-content');
  }

  /** 弹窗中 Statistic 标题 */
  get modalStatTitles() {
    return this.reportModal.locator('.ant-statistic-title');
  }

  /** 弹窗中卡片标题 */
  get modalCardTitles() {
    return this.reportModal.locator('.ant-card-head-title');
  }

  /** 周报 tab */
  get weekTab() {
    return this.page.locator('button').filter({ hasText: '周报' });
  }

  /** 月报 tab */
  get monthTab() {
    return this.page.locator('button').filter({ hasText: '月报' });
  }

  /** 周选择器 */
  get weekPicker() {
    return this.page.locator('.ant-picker').filter({ hasText: '选择周' });
  }

  /** 月选择器 */
  get monthPicker() {
    return this.page.locator('.ant-picker').filter({ hasText: '选择月' });
  }
}
