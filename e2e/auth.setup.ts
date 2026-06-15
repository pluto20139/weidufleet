import { test as setup } from '@playwright/test';

setup('authenticate via login form', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // 通过 placeholder 定位输入框（antd Input 的原始 placeholder）
  await page.getByPlaceholder('admin@weidu.cl').fill('admin@weidu.cl');
  await page.getByPlaceholder('12345678').fill('123');

  // 验证码固定填 123
  const captchaInput = page.locator('input').last();
  await captchaInput.fill('123');

  // 点击登录按钮（类型为 submit 的主按钮）
  await page.locator('button[type="submit"]').click();

  // 等待跳转到仪表盘
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 保存认证态
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
