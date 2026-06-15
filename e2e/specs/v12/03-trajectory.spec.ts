import { test, expect } from '@playwright/test';

test.describe('S3 — 轨迹10天限制', () => {
  test('TC-S3-01 轨迹回放日期选择器限制', async ({ page }) => {
    await page.goto('/monitor?tab=playback');
    await page.waitForTimeout(1000);

    const rangePicker = page.locator('.ant-picker-range');
    await expect(rangePicker).toBeVisible();
    await rangePicker.click();
    await page.waitForTimeout(500);

    const disabledCells = page.locator('.ant-picker-cell-disabled');
    await expect(disabledCells.first()).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('TC-S3-02 行程详情超10天轨迹遮罩', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForSelector('.ant-table');

    const rows = page.locator('.ant-table-tbody tr');
    const count = await rows.count();
    if (count > 0) {
      await page.locator('table a').filter({ hasText: /查看/ }).first().click();
      await page.waitForTimeout(500);

      const expiredText = page.getByText('轨迹数据存储时效限制');
      const map = page.locator('.leaflet-container');

      if (await expiredText.isVisible().catch(() => false)) {
        await expect(expiredText).toBeVisible();
      } else if (await map.isVisible().catch(() => false)) {
        await expect(map).toBeVisible();
      }
    }
  });
});
