import { test, expect } from '../fixtures';

test.describe('TC-21~TC-22 风控预警', () => {

  test('TC-21 围栏报警详情页布局（左信息右地图，无报警类型）', async ({ riskPage, page }) => {
    await riskPage.goto('/risk?tab=fence');
    await page.waitForSelector('table');

    // 点击查看
    await riskPage.firstFenceViewBtn.click();
    await page.waitForTimeout(500);

    // 弹窗中无"报警类型"文字
    await expect(riskPage.detailModal).not.toContainText('报警类型');

    // 左侧信息列存在
    await expect(riskPage.detailLeftCol).toBeVisible();

    // 右侧地图存在
    await expect(riskPage.detailMap).toBeVisible();

    // 关闭弹窗
    await page.locator('.ant-modal-footer button').click();
  });

  test('TC-22 故障报警类型枚举值为 VDC/CDCU/BDCU/ADAS 故障', async ({ riskPage, page }) => {
    await riskPage.goto('/risk?tab=fault');
    await page.waitForSelector('table');

    const count = await riskPage.faultTypeCells.count();
    expect(count).toBeGreaterThan(0);

    const validTypes = ['VDC故障', 'CDCU故障', 'BDCU故障', 'ADAS故障'];
    for (let i = 0; i < count; i++) {
      const text = (await riskPage.faultTypeCells.nth(i).textContent())?.trim() || '';
      expect(validTypes).toContain(text);
    }
  });
});
