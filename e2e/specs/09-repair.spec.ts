import { test, expect } from '../fixtures';

test.describe('TC-35~TC-37 维修管理', () => {

  test('TC-35 新建维修弹窗中维修描述为下拉选择', async ({ repairPage, page }) => {
    await repairPage.goto('/repair');
    await page.waitForSelector('table');

    // 打开新建维修弹窗
    await repairPage.newRepairBtn.click();
    await page.waitForTimeout(500);

    // 维修描述字段是 Select 不是 TextArea
    const formItem = repairPage.descFormItem;
    await expect(formItem.locator('.ant-select')).toBeVisible();
    await expect(formItem.locator('textarea')).toBeHidden();

    // 展开 Select 查看选项
    await formItem.locator('.ant-select').click();
    await page.waitForTimeout(300);
    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown).toBeVisible();
    const options = await dropdown.locator('.ant-select-item').allTextContents();
    expect(options.length).toBeGreaterThan(0);

    // 关闭弹窗
    await page.locator('.ant-modal-footer button').filter({ hasText: '取消' }).click();
  });

  test('TC-36 维修列表有时间筛选', async ({ repairPage }) => {
    await repairPage.goto('/repair');
    await expect(repairPage.rangePicker).toBeVisible();
  });

  test('TC-37 操作列有"完成维修"按钮', async ({ repairPage, page }) => {
    await repairPage.goto('/repair');
    await page.waitForSelector('table');

    // 存在"完成维修"按钮
    await expect(repairPage.completeBtns.first()).toBeVisible();
    // 按钮文字精确匹配
    const btnText = await repairPage.completeBtns.first().textContent();
    expect(btnText?.trim()).toBe('完成维修');
  });
});
