import { test, expect } from '../fixtures';

test.describe('TC-33~TC-34 行程管理', () => {

  test('TC-33 行程列表起终点默认隐藏', async ({ tripsPage, page }) => {
    await tripsPage.goto('/trips');
    await page.waitForSelector('table');

    // 默认显示"查看位置"
    await expect(tripsPage.viewLocationLinks.first()).toBeVisible();

    // 点击后显示地址
    await tripsPage.viewLocationLinks.first().click();
    await expect(page.locator('text=智利').first()).toBeVisible();
  });

  test('TC-34 行程详情页无开始时间/到达时间/预警次数', async ({ tripsPage, page }) => {
    await tripsPage.goto('/trips');
    await page.waitForSelector('table');

    // 进入详情页
    await tripsPage.firstViewDetail.click();
    await page.waitForTimeout(500);

    // 详情页中无这些字段
    const descText = await tripsPage.detailDescriptions.textContent();
    expect(descText).not.toContain('开始时间');
    expect(descText).not.toContain('到达时间');
    expect(descText).not.toContain('预警次数');

    // 起点终点使用"查看位置"
    await expect(page.locator('.ant-descriptions-item-content').filter({ hasText: '查看位置' }).first()).toBeVisible();

    // 无预警信息框
    await expect(tripsPage.alertCards).toBeHidden();
  });
});
