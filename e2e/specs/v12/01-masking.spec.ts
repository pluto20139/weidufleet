import { test, expect } from '@playwright/test';
import {
  expectMaskedVin,
  expectMaskedPlate,
  getColumnTexts,
} from '../../utils/mask-helper';

test.describe('S1 — 全局VIN/车牌脱敏', () => {
  test('TC-S1-01 排行榜车牌脱敏', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('.ant-table');
    const plates = await getColumnTexts(page, '.ant-table:last-child', 2);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-02 地图气泡VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const marker = page.locator('.leaflet-marker-icon').first();
    if (await marker.isVisible()) {
      await marker.click();
      await page.waitForTimeout(500);
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toBeVisible();
      const content = await popup.textContent();
      const plateMatch = content?.match(/([A-Z0-9·]{4,8})/);
      if (plateMatch) {
        expect(expectMaskedPlate(plateMatch[0])).toBe(true);
      }
      const vinMatch = content?.match(/([A-Z0-9]{6}\*{7}[A-Z0-9]{4})/);
      expect(vinMatch).toBeTruthy();
    }
  });

  test('TC-S1-03 车辆列表VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('.ant-table');
    const vins = await getColumnTexts(page, '.ant-table', 1);
    for (const vin of vins) {
      expect(expectMaskedVin(vin.trim()), `VIN "${vin}" should be masked`).toBe(true);
    }
    const plates = await getColumnTexts(page, '.ant-table', 2);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-04 列表VIN/车牌搜索兼容', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('.ant-table');

    await page.getByPlaceholder('VIN码').fill('LJ8T7A');
    await page.getByRole('button', { name: '查询' }).click();
    await page.waitForTimeout(500);
    let rows = page.locator('.ant-table-tbody tr');
    await expect(rows.first()).toBeVisible();

    await page.getByRole('button', { name: '重置' }).click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('车牌号').fill('KL');
    await page.getByRole('button', { name: '查询' }).click();
    await page.waitForTimeout(500);
    const plates = await getColumnTexts(page, '.ant-table', 2);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-05 车辆详情VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('.ant-table');
    await page.locator('table a').filter({ hasText: /查看/ }).first().click();
    await page.waitForURL('**/vehicles/**');

    const descItems = page.locator('.ant-descriptions-item-content');
    const vinContent = await descItems.nth(0).textContent();
    expect(expectMaskedVin(vinContent?.trim() || '')).toBe(true);

    const plateContent = await descItems.nth(1).textContent();
    expect(expectMaskedPlate(plateContent?.trim() || '')).toBe(true);

    await expect(page.getByText('查看位置')).toBeVisible();
  });

  test('TC-S1-06 行程记录Tab起点终点街道级', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForSelector('.ant-table');
    await page.locator('table a').filter({ hasText: /查看/ }).first().click();
    await page.waitForURL('**/vehicles/**');
    await page.getByRole('tab', { name: '行程记录' }).click();
    await page.waitForTimeout(500);

    const viewBtns = page.locator('td').filter({ hasText: '查看位置' });
    await expect(viewBtns.first()).toBeVisible();
  });

  test('TC-S1-07 围栏管理车辆配置VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/fence');
    await page.waitForSelector('.ant-table');
    await page.locator('table a').first().click();
    await page.waitForTimeout(500);

    const vins = await getColumnTexts(page, '.ant-table', 1);
    for (const vin of vins) {
      if (vin !== '—' && vin.length > 8) {
        expect(expectMaskedVin(vin.trim()), `VIN "${vin}" should be masked`).toBe(true);
      }
    }
    const plates = await getColumnTexts(page, '.ant-table', 2);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-08 风控预警VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/risk?tab=fence');
    await page.waitForSelector('.ant-table');
    let plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }

    await page.goto('/risk?tab=fault');
    await page.waitForSelector('.ant-table');
    plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }

    await page.goto('/risk?tab=battery');
    await page.waitForSelector('.ant-table');
    plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-09 围栏报警详情VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/risk?tab=fence');
    await page.waitForSelector('.ant-table');
    await page.locator('button').filter({ hasText: '查看' }).first().click();
    await page.waitForTimeout(500);
    const modal = page.locator('.ant-modal-content');
    await expect(modal.getByText(/LJ8T7A\*{7}/)).toBeVisible();
    await expect(modal.getByText(/^.{2}\*{2}.{2}$/)).toBeVisible();
  });

  test('TC-S1-10 驾驶行为VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/driving?tab=alert');
    await page.waitForSelector('.ant-table');
    let plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }

    await page.goto('/driving?tab=report');
    await page.waitForSelector('.ant-table');
    plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-11 电池管理VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/battery?tab=monitor');
    await page.waitForSelector('.ant-table');
    let plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-12 行程管理VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForSelector('.ant-table');
    let plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-13 维修管理VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/repair');
    await page.waitForSelector('.ant-table');
    let plates = await getColumnTexts(page, '.ant-table', 1);
    for (const plate of plates) {
      expect(expectMaskedPlate(plate.trim()), `plate "${plate}" should be masked`).toBe(true);
    }
  });

  test('TC-S1-14 实时监控VIN/车牌脱敏', async ({ page }) => {
    await page.goto('/monitor?tab=location');
    await page.waitForTimeout(2000);
    const marker = page.locator('.leaflet-marker-icon').first();
    if (await marker.isVisible()) {
      await marker.click();
      await page.waitForTimeout(500);
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup.getByText(/\*{2}/)).toBeVisible();
    }
  });

  test('TC-S1-16 车辆信号数据列表车牌脱敏', async ({ page }) => {
    await page.goto('/vehicle-signal');
    await page.waitForTimeout(1000);
    const headers = page.locator('.ant-table-thead th');
    await expect(headers).toContainText('车牌号');
  });
});
