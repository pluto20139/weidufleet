import { test, expect } from '../fixtures';

test.describe('TC-23~TC-28 驾驶行为', () => {

  test('TC-23 驾驶预警字段改名', async ({ page, drivingPage }) => {
    await drivingPage.goto('/driving?tab=alert');
    await page.waitForSelector('table');

    const texts = await drivingPage.tableHeaders.allTextContents();
    expect(texts).toContain('预警类型');
    expect(texts).toContain('预警位置');
    expect(texts).toContain('行车速度');

    // 旧字段不应出现
    expect(texts).not.toContain('风险事件');
  });

  test('TC-24 驾驶报告数据指标', async ({ drivingPage, page }) => {
    await drivingPage.goto('/driving?tab=report');
    await page.waitForSelector('table');

    // 打开第一个报告的详情弹窗
    await drivingPage.firstReportViewBtn.click();
    await page.waitForTimeout(500);

    const texts = await drivingPage.modalStatTitles.allTextContents();
    expect(texts).toContain('累计行驶里程');
    expect(texts).toContain('累计驾驶时长');
    expect(texts).toContain('平均车速');
    expect(texts).toContain('驾驶评分');

    // 关闭弹窗
    await page.locator('.ant-modal-footer button').click();
  });

  test('TC-25 驾驶报告图表名称', async ({ drivingPage, page }) => {
    await drivingPage.goto('/driving?tab=report');
    await drivingPage.firstReportViewBtn.click();
    await page.waitForTimeout(500);

    const texts = await drivingPage.modalCardTitles.allTextContents();
    expect(texts).toContain('行驶里程趋势');
    expect(texts).toContain('驾驶时间段占比');
    expect(texts).toContain('行驶区域分布');
    expect(texts).toContain('风险事件统计');
  });

  test('TC-26 行驶区域分布按智利城市展示', async ({ drivingPage, page }) => {
    await drivingPage.goto('/driving?tab=report');
    await drivingPage.firstReportViewBtn.click();
    await page.waitForTimeout(500);

    // 行驶区域分布卡片应包含城市名，不包含"高速"
    const areaCard = drivingPage.reportModal.locator('.ant-card').filter({ hasText: '行驶区域分布' });
    await expect(areaCard).toContainText('圣地亚哥');
    await expect(areaCard).not.toContainText('高速');
  });

  test('TC-27 风险事件统计为折线图', async ({ drivingPage, page }) => {
    await drivingPage.goto('/driving?tab=report');
    await drivingPage.firstReportViewBtn.click();
    await page.waitForTimeout(500);

    // 风险事件统计卡片中有 canvas
    const riskCard = drivingPage.reportModal.locator('.ant-card').filter({ hasText: '风险事件统计' });
    await expect(riskCard.locator('canvas')).toBeVisible();
  });

  test('TC-28 驾驶报告周报月报时间筛选', async ({ drivingPage, page }) => {
    await drivingPage.goto('/driving?tab=report');

    // 周报 — 周选择器可见
    await expect(drivingPage.weekPicker).toBeVisible();

    // 切换到月报 tab
    await drivingPage.monthTab.click();
    await page.waitForTimeout(500);

    // 月报 — 月选择器可见
    await expect(drivingPage.monthPicker).toBeVisible();
  });
});
