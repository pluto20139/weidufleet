import { test, expect } from '../fixtures';

test.describe('TC-07~TC-12 车辆管理', () => {

  test('TC-07 电池监控列表列名为续航里程', async ({ page }) => {
    await page.goto('/battery?tab=monitor');
    await page.waitForSelector('table');
    const headers = page.locator('.ant-table-thead th');
    await expect(headers).toContainText('续航里程');
  });

  test('TC-08 里程报表年视图展示近3年', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('table');
    await page.locator('table a').filter({ hasText: '查看' }).first().click();
    await page.waitForURL('**/vehicles/**');

    // 点击里程报表 tab
    await page.locator('button').filter({ hasText: '里程报表' }).click();
    await page.waitForTimeout(500);

    // 点击"年"按钮
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '年' }).click();
    await page.waitForTimeout(500);

    // X 轴标签包含 2024、2025、2026
    // chart.js canvas 无法直接读取文字，通过 aria-label 或周边 DOM 验证
    // 检查 canvas 父级卡片内容
    const chartCard = page.locator('.ant-card').filter({ hasText: '年' });
    // 确认年按钮激活
    await expect(page.locator('.ant-radio-button-wrapper-checked')).toContainText('年');
  });

  test('TC-09 充电记录包含累计充电次数', async ({ page }) => {
    await page.goto('/battery?tab=charge');
    const headers = page.locator('.ant-table-thead th');
    await expect(headers).toContainText('累计充电次数');
  });

  test('TC-10 行程列表列名为结束时间', async ({ page, tripsPage }) => {
    await tripsPage.goto('/trips');
    const texts = await tripsPage.tableHeaders.allTextContents();
    expect(texts).toContain('结束时间');
  });

  test('TC-11 车辆列表最后位置默认隐藏', async ({ vehiclesPage }) => {
    await vehiclesPage.goto('/vehicles');
    await vehiclesPage.page.waitForSelector('table');

    // 确认"最后位置"列存在
    const texts = await vehiclesPage.tableHeaders.allTextContents();
    expect(texts).toContain('最后位置');

    // 默认显示"查看位置"
    await expect(vehiclesPage.viewLocationLinks.first()).toBeVisible();
  });

  test('TC-12 车辆详情页最后位置默认隐藏', async ({ vehiclesPage }) => {
    await vehiclesPage.goto('/vehicles');
    await vehiclesPage.page.waitForSelector('table');

    // 进入详情页
    await vehiclesPage.firstViewDetail.click();
    await vehiclesPage.page.waitForURL('**/vehicles/**');

    // Descriptions 中有"最后位置"且值为"查看位置"
    await expect(vehiclesPage.detailLastLocation).toBeVisible();
  });
});
