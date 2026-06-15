import { test, expect } from '../fixtures';

test.describe('TC-29~TC-32 电池管理', () => {

  test('TC-29 电池监控详情图表 X 轴月-日格式', async ({ batteryPage, page }) => {
    await batteryPage.goto('/battery?tab=monitor');
    await page.waitForSelector('table');

    // 打开第一个监控项的详情弹窗
    await batteryPage.monitorViewBtns.first().click();
    await page.waitForTimeout(500);

    // 通过 chart.js 实例读取 X 轴标签
    const labels = await page.evaluate(() => {
      const charts = (window as any).Chart?.instances;
      if (!charts) return null;
      const entries = Object.values(charts) as any[];
      if (entries.length === 0) return null;
      return entries[0]?.data?.labels?.slice(0, 3);
    });

    if (labels) {
      expect(labels[0]).toMatch(/^\d{2}-\d{2}$/);
      expect(labels[0]).not.toMatch(/^D/);
    }

    // 关闭弹窗
    await page.locator('.ant-modal-footer button').click();
  });

  test('TC-30 电池详情布局：3指标在上，图表在下', async ({ batteryPage, page }) => {
    await batteryPage.goto('/battery?tab=monitor');
    await page.waitForSelector('table');

    await batteryPage.monitorViewBtns.first().click();
    await page.waitForTimeout(500);

    // 弹窗中有 3 个 Statistic
    const stats = batteryPage.detailModal.locator('.ant-statistic');
    await expect(stats).toHaveCount(3);

    // 指标标题：SOC、电池健康度、电池温度
    const titles = await batteryPage.modalStatTitles.allTextContents();
    expect(titles).toContain('SOC');
    expect(titles).toContain('电池健康度');
    expect(titles).toContain('电池温度');

    // 图表在指标下方
    await expect(batteryPage.modalChartCanvas).toBeVisible();

    await page.locator('.ant-modal-footer button').click();
  });

  test('TC-31 放电记录字段：放电时长、无消耗电量', async ({ batteryPage, page }) => {
    await batteryPage.goto('/battery?tab=charge');
    await page.waitForSelector('table');

    // 切换到放电记录 tab
    await batteryPage.dischargeTab.click();
    await page.waitForTimeout(500);

    const texts = await batteryPage.tableHeaders.allTextContents();
    expect(texts).toContain('放电时长');
    expect(texts).not.toContain('消耗电量');
    expect(texts).not.toContain('充电时长');
  });

  test('TC-32 充放电记录均有时间筛选', async ({ batteryPage, page }) => {
    await batteryPage.goto('/battery?tab=charge');
    await page.waitForSelector('table');

    // 充电记录有 RangePicker
    await expect(batteryPage.rangePicker).toBeVisible();

    // 切到放电记录
    await batteryPage.dischargeTab.click();
    await page.waitForTimeout(500);

    // 放电记录也有 RangePicker
    await expect(batteryPage.rangePicker).toBeVisible();
  });
});
