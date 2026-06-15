import { test, expect } from '../fixtures';

test.describe('TC-45~TC-47 系统管理', () => {

  test('TC-45 用户/角色为独立菜单，无 tab 切换', async ({ page, sysUsersPage }) => {
    // 侧边栏中有"用户管理"和"角色管理"两个独立项
    const sidebar = page.locator('.ant-menu');
    await expect(sidebar.locator('a').filter({ hasText: '用户管理' })).toBeVisible();
    await expect(sidebar.locator('a').filter({ hasText: '角色管理' })).toBeVisible();

    // 不包含子菜单"系统管理"（旧 tab 切换方式）
    await expect(sidebar.locator('a').filter({ hasText: '系统设置' })).toBeHidden();

    // 点击用户管理 — 导航到 /sys/users
    await sidebar.locator('a').filter({ hasText: '用户管理' }).click();
    await page.waitForURL('**/sys/users');
    const userContent = page.locator('.ant-table');
    await expect(userContent).toBeVisible();

    // 确认没有 tab 切换按钮组
    await expect(page.locator('button').filter({ hasText: '用户列表' })).toBeHidden();

    // 点击角色管理 — 导航到 /sys/roles
    await sidebar.locator('a').filter({ hasText: '角色管理' }).click();
    await page.waitForURL('**/sys/roles');

    // 确认角色管理页面渲染（角色卡片）
    const roleCards = page.locator('.ant-card');
    await expect(roleCards.first()).toBeVisible();
  });

  test('TC-46 角色管理页面权限使用中文', async ({ page }) => {
    await page.goto('/sys/roles');
    await page.waitForSelector('.ant-card');

    // 权限列表项使用中文
    const permItems = page.locator('.ant-card ul li');
    const count = await permItems.count();
    for (let i = 0; i < count; i++) {
      const text = (await permItems.nth(i).textContent()) || '';
      // 不应以大写字母开头（英文权限名）
      expect(text).not.toMatch(/^[A-Z]/);
    }
  });

  test('TC-47 导出按钮文字为"导出 CSV"', async ({ vehicleSignalPage }) => {
    await vehicleSignalPage.goto('/vehicle-signal');

    await expect(vehicleSignalPage.exportBtn).toBeVisible();
    const btnText = await vehicleSignalPage.exportBtn.textContent();
    expect(btnText?.trim()).toBe('导出 CSV');
  });
});
