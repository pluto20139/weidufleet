import { test, expect } from '../fixtures';

test.describe('TC-01~TC-04 全局', () => {

  test('TC-01 语言切换仅支持中文/英文', async ({ page, topbar }) => {
    await topbar.goto('/dashboard');

    // 获取当前语言按钮文字
    const btnText = await topbar.getCurrentLangFlag();
    expect(['ZH', 'EN']).toContain(btnText);

    // 点击切换
    await topbar.switchLang();
    const newText = await topbar.getCurrentLangFlag();
    expect(newText).not.toBe(btnText);
    expect(['ZH', 'EN']).toContain(newText);

    // 验证界面语言变化：首页指标标题
    const firstTitle = await page.locator('.ant-statistic-title').first().textContent();
    if (newText === 'ZH') {
      expect(firstTitle).toContain('车辆总数');
    } else {
      expect(firstTitle).toContain('Total');
    }

    // 确认 localStorage 中没有 es
    const lang = await page.evaluate(() => {
      const raw = localStorage.getItem('weidu-fleet-storage');
      return raw ? JSON.parse(raw).state?.lang : '';
    });
    expect(lang).not.toBe('es');
  });

  test('TC-02 所有位置信息默认隐藏', async ({ page, vehiclesPage, tripsPage }) => {
    // 1) 车辆列表
    await vehiclesPage.goto('/vehicles');
    await page.waitForSelector('table');
    await expect(vehiclesPage.viewLocationLinks.first()).toBeVisible();
    await expect(page.locator('text=智利圣地亚哥').first()).toBeHidden();

    // 点击"查看位置"展示地址
    await vehiclesPage.viewLocationLinks.first().click();
    await expect(page.locator('text=智利圣地亚哥').first()).toBeVisible();

    // 2) 行程列表
    await tripsPage.goto('/trips');
    await page.waitForSelector('table');
    await expect(tripsPage.viewLocationLinks.first()).toBeVisible();

    // 3) 围栏报警列表
    await page.goto('/risk?tab=fence');
    await page.waitForSelector('table');
    await expect(page.locator('td').filter({ hasText: '查看位置' }).first()).toBeVisible();

    // 4) 驾驶预警列表
    await page.goto('/driving?tab=alert');
    await page.waitForSelector('table');
    await expect(page.locator('td').filter({ hasText: '查看位置' }).first()).toBeVisible();
  });

  test('TC-03 登录无强制修改密码弹窗', async ({ page }) => {
    // 访问登录页
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 填写登录表单（admin 账号原本会触发强制改密码）
    await page.getByPlaceholder('admin@weidu.cl').fill('admin@weidu.cl');
    await page.getByPlaceholder('12345678').fill('12345678');

    // 读取验证码
    const captchaText = await page.locator('.ant-input-group-addon span').last().textContent();
    if (captchaText) {
      await page.locator('input').last().fill(captchaText.trim());
    }

    // 提交登录
    await page.locator('button[type="submit"]').click();

    // 应该直接跳转到 dashboard，没有弹窗
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 确认没有"强制修改密码"弹窗
    await expect(page.locator('text=强制修改初始密码')).toBeHidden();
    await expect(page.locator('text=检测到您使用的是初始密码')).toBeHidden();
  });

  test('TC-04 详情页标题格式为"**详情页"', async ({ page, batteryPage }) => {
    // 1) 车辆管理详情页 — 面包屑不含车牌号
    await page.goto('/vehicles');
    await page.waitForSelector('table');
    await page.locator('table a').filter({ hasText: '查看' }).first().click();
    await page.waitForURL('**/vehicles/**');

    // 确认不显示车牌号
    await expect(page.locator('.ant-breadcrumb')).not.toContainText(/京[A-Z]/);
    await expect(page.locator('text=详情页')).toBeVisible();

    // 2) 电池监控详情弹窗
    await page.goto('/battery?tab=monitor');
    await page.waitForSelector('table');
    await batteryPage.monitorViewBtns.first().click();
    await expect(page.locator('.ant-modal-title')).toContainText('详情页');
    await page.locator('.ant-modal-footer button').filter({ hasText: '关闭' }).click();

    // 3) 行程详情页
    await page.goto('/trips');
    await page.waitForSelector('table');
    await page.locator('table a').filter({ hasText: '查看' }).first().click();
    await expect(page.locator('h2')).toContainText('详情页');
  });
});
