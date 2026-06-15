import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RepairPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get newRepairBtn() {
    return this.page.locator('button').filter({ hasText: '新建维修' });
  }

  /** 创建弹窗 */
  get modal() {
    return this.page.locator('.ant-modal-content');
  }

  /** 维修描述字段区域 */
  get descFormItem() {
    return this.modal.locator('.ant-form-item').filter({ hasText: '维修描述' });
  }

  get completeBtns() {
    return this.page.locator('button').filter({ hasText: '完成维修' });
  }

  get rangePicker() {
    return this.page.locator('.ant-picker-range').first();
  }
}
