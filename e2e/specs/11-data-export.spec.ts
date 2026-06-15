import { test, expect } from '../fixtures';

test.describe('TC-44 数据导出记录', () => {

  test('TC-44 导出记录表无筛选条件摘要列', async ({ dataExportPage, page }) => {
    await dataExportPage.goto('/data-export');
    await page.waitForSelector('table');

    const texts = await dataExportPage.tableHeaders.allTextContents();
    expect(texts).not.toContain('筛选条件摘要');
    expect(texts).toContain('文件名');
    expect(texts).toContain('数据条数');
  });
});
