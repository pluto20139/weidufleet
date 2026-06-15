import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehiclesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** 车辆列表中的"查看"链接（第一行） */
  get firstViewDetail() {
    return this.page.locator('table a').filter({ hasText: '查看' }).first();
  }

  /** 详情页面包屑 */
  get breadcrumb() {
    return this.page.locator('.ant-breadcrumb').last();
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  /** "最后位置"列中的查看位置链接 */
  get viewLocationLinks() {
    return this.page.locator('td').filter({ hasText: '查看位置' });
  }

  /** 详情页 Descriptions 中的最后位置字段 */
  get detailLastLocation() {
    return this.page.locator('.ant-descriptions-item-content').filter({ hasText: '查看位置' });
  }
}
