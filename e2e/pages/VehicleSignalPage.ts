import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehicleSignalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** 左侧树组件 */
  get tree() {
    return this.page.locator('.ant-tree');
  }

  get treeLeafNodes() {
    return this.tree.locator('.ant-tree-treenode .ant-tree-node-content-wrapper');
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  get exportBtn() {
    return this.page.locator('button').filter({ hasText: '导出 CSV' });
  }

  /** 选择时间标签 */
  get timeLabel() {
    return this.page.locator('text=选择时间');
  }

  /** 选择信号标签 */
  get signalLabel() {
    return this.page.locator('text=选择信号');
  }

  /** 信号 TreeSelect */
  get signalTreeSelect() {
    return this.page.locator('.ant-tree-select');
  }

  /** 全选按钮 */
  get selectAllBtn() {
    return this.page.locator('button').filter({ hasText: '全选' });
  }

  /** 上报时间列表头 */
  get timeHeader() {
    return this.page.locator('th').filter({ hasText: '上报时间' });
  }
}
