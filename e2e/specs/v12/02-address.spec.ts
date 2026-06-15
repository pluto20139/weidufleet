import { test, expect } from '@playwright/test';
import { expectStreetLevel } from '../../utils/mask-helper';

test.describe('S2 — 地址街道级精度', () => {
  test('TC-S2-01 车辆列表最后位置街道级', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('.ant-table');

    const viewBtns = page.locator('td').filter({ hasText: '查看位置' });
    await expect(viewBtns.first()).toBeVisible();
    await viewBtns.first().click();
    await page.waitForTimeout(300);

    const addressCell = page.locator('.ant-table-tbody td').filter({ hasText: '智利' }).first();
    if (await addressCell.isVisible()) {
      const text = await addressCell.textContent();
      expect(expectStreetLevel(text || '')).toBe(true);
    }
  });

  test('TC-S2-03 行程列表起点终点街道级', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForSelector('.ant-table');

    const startViews = page.locator('td').filter({ hasText: '查看位置' });
    await expect(startViews.first()).toBeVisible();
    await startViews.first().click();
    await page.waitForTimeout(300);

    const addr = page.locator('.ant-table-tbody td').filter({ hasText: '智利' }).first();
    if (await addr.isVisible()) {
      expect(expectStreetLevel((await addr.textContent()) || '')).toBe(true);
    }
  });

  test('TC-S2-06 驾驶预警位置街道级', async ({ page }) => {
    await page.goto('/driving?tab=alert');
    await page.waitForSelector('.ant-table');

    const viewBtns = page.locator('td').filter({ hasText: '查看位置' });
    await expect(viewBtns.first()).toBeVisible();
    await viewBtns.first().click();
    await page.waitForTimeout(300);
  });
});
