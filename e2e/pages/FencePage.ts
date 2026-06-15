import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class FencePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get switches() {
    return this.page.locator('.ant-switch');
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  /** 第一个车辆数链接 */
  get firstVehicleCountLink() {
    return this.page.locator('table a').first();
  }

  /** 车辆配置页的"添加"按钮 */
  get addBtn() {
    return this.page.locator('button').filter({ hasText: '添加' }).first();
  }

  /** 添加车辆弹窗中的 Select */
  get vehicleSelect() {
    return this.page.locator('.ant-select');
  }
}
