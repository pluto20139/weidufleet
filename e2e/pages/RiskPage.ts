import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RiskPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** 围栏报警 tab 中第一个"查看"按钮 */
  get firstFenceViewBtn() {
    return this.page.locator('table button').filter({ hasText: '查看' }).first();
  }

  /** 围栏报警详情 Modal */
  get detailModal() {
    return this.page.locator('.ant-modal-content');
  }

  /** 详情弹窗中的信息列 */
  get detailLeftCol() {
    return this.detailModal.locator('.ant-descriptions');
  }

  /** 详情弹窗中的地图 */
  get detailMap() {
    return this.detailModal.locator('.leaflet-container');
  }

  get tableHeaders() {
    return this.page.locator('.ant-table-thead th');
  }

  /** 故障报警列表第4列（报警类型） */
  get faultTypeCells() {
    return this.page.locator('.ant-table-tbody td:nth-child(4)');
  }
}
