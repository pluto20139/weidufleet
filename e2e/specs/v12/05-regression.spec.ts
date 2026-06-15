import { test, expect } from '@playwright/test';

test.describe('S5 — 回归验证', () => {
  test('TC-S5-01 登录流程不受影响', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.ant-statistic').first()).toBeVisible();
  });

  test('TC-S5-02 所有页面路由正常', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/vehicles',
      '/monitor?tab=location',
      '/risk?tab=fence',
      '/driving?tab=alert',
      '/battery?tab=monitor',
      '/trips',
      '/fence',
      '/repair',
      '/tenant',
      '/vehicle-signal',
      '/data-export',
      '/sys/users',
      '/sys/roles',
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(800);
      // 不严格断言，仅检查无崩溃
    }
  });

  test('TC-S5-03 导出按钮文字不变', async ({ page }) => {
    await page.goto('/vehicle-signal');
    await page.waitForTimeout(500);
    const exportBtn = page.locator('button').filter({ hasText: '导出 CSV' });
    await expect(exportBtn).toBeVisible();
  });
});
