import { test, expect } from '../fixtures';

test.describe('TC-38~TC-43 车辆信号数据', () => {

  test('TC-38 树状结构仅2个租户层级，展示车牌号', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(1000);

    // 树可见
    await expect(vehicleSignalPage.tree).toBeVisible();

    // 叶子节点只显示车牌号（无长 VIN 串）
    const leafCount = await vehicleSignalPage.treeLeafNodes.count();
    for (let i = 0; i < leafCount; i++) {
      const text = (await vehicleSignalPage.treeLeafNodes.nth(i).textContent()) || '';
      // 不应包含长 VIN 码
      expect(text).not.toMatch(/[A-Z0-9]{10,}/);
    }

    // 租户层级存在
    await expect(vehicleSignalPage.tree).toContainText('智利物流集团');
    await expect(vehicleSignalPage.tree).toContainText('Santiago Transport');
  });

  test('TC-39 右侧列表有车牌号列', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(500);
    const texts = await vehicleSignalPage.tableHeaders.allTextContents();
    expect(texts).toContain('车牌号');
  });

  test('TC-40 导出按钮在页面右上方', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(500);

    // 导出按钮可见
    await expect(vehicleSignalPage.exportBtn).toBeVisible();

    // 确认它在第一个 Card（筛选区域）中而非底部
    const firstCard = page.locator('.ant-card').first();
    const inFirstCard = await firstCard.locator('button').filter({ hasText: '导出 CSV' }).isVisible();
    expect(inFirstCard).toBe(true);
  });

  test('TC-41 上报时间无排序', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(500);

    // 上报时间列头没有排序图标
    const sorter = vehicleSignalPage.timeHeader.locator('.ant-table-column-sorter');
    await expect(sorter).toBeHidden();
  });

  test('TC-42 筛选项有标签名称', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(500);

    await expect(vehicleSignalPage.timeLabel).toBeVisible();
    await expect(vehicleSignalPage.signalLabel).toBeVisible();
  });

  test('TC-43 信号分组选择与全选', async ({ vehicleSignalPage, page }) => {
    await vehicleSignalPage.goto('/vehicle-signal');
    await page.waitForTimeout(500);

    // 打开信号 TreeSelect
    await vehicleSignalPage.signalTreeSelect.click();
    await page.waitForTimeout(300);

    // 下拉中有分组标题
    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown.locator('text=电池监控')).toBeVisible();
    await expect(dropdown.locator('text=充电记录')).toBeVisible();
    await expect(dropdown.locator('text=行程记录')).toBeVisible();

    // 全选按钮存在
    await expect(vehicleSignalPage.selectAllBtn).toBeVisible();

    // 关闭下拉
    await page.keyboard.press('Escape');
  });
});
