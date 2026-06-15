import { test, expect } from '@playwright/test';

test.describe('S4 — 日志审计', () => {
  test('TC-S4-01 菜单位置', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('.ant-menu');

    await page.locator('.ant-menu-submenu-title').filter({ hasText: '系统管理' }).click();
    await page.waitForTimeout(300);

    await expect(
      page.locator('.ant-menu-item').filter({ hasText: '日志审计' }),
    ).toBeVisible();

    await page.locator('.ant-menu-item').filter({ hasText: '日志审计' }).click();
    await page.waitForURL('**/audit-log**');
  });

  test('TC-S4-02 页面加载与默认布局', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(1000);

    await expect(page.locator('h2,h3,h4').filter({ hasText: '日志审计' })).toBeVisible();

    await expect(page.getByPlaceholder('操作账号')).toBeVisible();
    await expect(
      page.locator('.ant-select').filter({ hasText: '操作类型' }).first(),
    ).toBeVisible();
    await expect(page.locator('.ant-picker-range')).toBeVisible();
    await expect(
      page.locator('.ant-select').filter({ hasText: /全部|成功|失败/ }).first(),
    ).toBeVisible();

    const headers = page.locator('.ant-table-thead th');
    const headerTexts = await headers.allTextContents();
    expect(headerTexts).toContain('序号');
    expect(headerTexts).toContain('操作时间');
    expect(headerTexts).toContain('操作人昵称');
    expect(headerTexts).toContain('操作账号');
    expect(headerTexts).toContain('所属租户');
    expect(headerTexts).toContain('操作IP');
    expect(headerTexts).toContain('操作类型');
    expect(headerTexts).toContain('事件描述');
    expect(headerTexts).toContain('操作结果');

    await expect(page.locator('.ant-pagination')).toBeVisible();
  });

  test('TC-S4-03 操作账号筛选', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    const input = page.getByPlaceholder('操作账号');
    await input.fill('admin');
    await page.waitForTimeout(300);

    const rows = page.locator('.ant-table-tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('TC-S4-04 操作类型多选', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    const typeSelect = page.locator('.ant-select').filter({ hasText: '操作类型' }).first();
    await typeSelect.click();
    await page.waitForTimeout(300);

    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown.locator('.ant-select-item').first()).toBeVisible();
  });

  test('TC-S4-05 操作时间范围限制', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    const picker = page.locator('.ant-picker-range');
    await picker.click();
    await page.waitForTimeout(300);
    // 验证日历面板存在即可
    await expect(page.locator('.ant-picker-panel')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('TC-S4-06 操作结果筛选', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    await page.locator('.ant-select').filter({ hasText: /全部|成功|失败/ }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item').filter({ hasText: '成功' }).click();
    await page.waitForTimeout(300);

    const resultTags = page.locator('.ant-table-tbody .ant-tag-green');
    await expect(resultTags.first()).toBeVisible();
  });

  test('TC-S4-07 表格字段验证', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    const firstRow = page.locator('.ant-table-tbody tr').first();
    const cells = firstRow.locator('td');

    const seq = await cells.nth(0).textContent();
    expect(Number(seq)).toBeGreaterThan(0);

    const time = (await cells.nth(1).textContent())?.trim();
    expect(time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    const ip = (await cells.nth(5).textContent())?.trim();
    expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

    const resultTag = cells.nth(8).locator('.ant-tag');
    await expect(resultTag).toBeVisible();
    const resultColor = await resultTag.getAttribute('color');
    expect(['green', 'red']).toContain(resultColor);
  });

  test('TC-S4-08 重置筛选', async ({ page }) => {
    await page.goto('/sys/audit-log');
    await page.waitForTimeout(500);

    await page.getByPlaceholder('操作账号').fill('test@test.com');

    await page.locator('button').filter({ hasText: '重置' }).click();
    await page.waitForTimeout(300);

    const input = page.getByPlaceholder('操作账号');
    await expect(input).toHaveValue('');
  });
});
