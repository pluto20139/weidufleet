import { test, expect } from '../fixtures';

test.describe('TC-13~TC-20 围栏管理', () => {

  test('TC-13 Switch 无文字', async ({ fencePage }) => {
    await fencePage.goto('/fence');
    const switchBtn = fencePage.switches.first();
    const innerText = await switchBtn.textContent();
    expect(innerText?.trim()).toBe('');
  });

  test('TC-14~19 围栏列名验证', async ({ fencePage }) => {
    await fencePage.goto('/fence');
    const texts = await fencePage.tableHeaders.allTextContents();

    expect(texts).toContain('围栏类型');
    expect(texts).toContain('使用车辆');
    expect(texts).toContain('预警类型');
    expect(texts).toContain('围栏地址');
    expect(texts).toContain('操作人');
    expect(texts).toContain('添加时间');

    // 旧列名不应出现
    expect(texts).not.toContain('创建时间');
    expect(texts).not.toContain('关联车辆');
  });

  test('TC-20 添加车辆弹窗支持搜索', async ({ fencePage, page }) => {
    await fencePage.goto('/fence');

    // 点击车辆数链接进入配置页
    await fencePage.firstVehicleCountLink.click();
    await page.waitForTimeout(500);

    // 点击"添加"按钮
    await fencePage.addBtn.click();
    await page.waitForTimeout(500);

    // 弹窗标题为"选择车辆"
    await expect(page.locator('.ant-modal-title')).toContainText('选择车辆');

    // 存在 Select 搜索框
    const select = page.locator('.ant-select');
    await expect(select.first()).toBeVisible();
  });
});
