import { chromium } from 'playwright';

const BASE = 'http://localhost:3002';
const OUT = '/Users/Zhuanz1/Desktop/AI文件夹/苇渡-智利车队管理/manual_screenshots';
const VIEWPORT = { width: 1600, height: 1000 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('✓', name);
}

async function go(page, url, waitMs = 3000) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await wait(waitMs);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[ERR]', msg.text().slice(0, 150));
  });
  page.on('pageerror', (err) => console.log('[PAGE ERR]', err.message.slice(0, 150)));

  // 登录页
  await go(page, '/login', 4000);
  await shot(page, '01_login');

  // 登录
  const emailInput = await page.locator('input[id*="email" i]').first();
  const passInput = await page.locator('input[type="password"]').first();
  const captchaInput = await page.locator('input[id*="captcha" i]').first();
  await emailInput.fill('admin@weidu.cl');
  await passInput.fill('Pass1234');
  const captchaText = await page.locator('text=/^[A-Z0-9]{4}$/').first().textContent();
  await captchaInput.fill(captchaText.trim());
  await page.click('button[type="submit"]');
  await wait(3000);

  // 仪表盘
  await go(page, '/dashboard', 4000);
  await shot(page, '02_dashboard');

  // 车辆列表
  await go(page, '/vehicles', 4000);
  await shot(page, '03_vehicles_list');

  // 弹窗 1: 导入车辆
  try {
    await page.locator('button:has-text("Import")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup01_import');
    await page.keyboard.press('Escape');
    await wait(1000);
  } catch (e) { console.log('popup01 skipped'); }

  // 车辆详情 - 通过点击"Detail"
  try {
    await go(page, '/vehicles', 3000);
    await page.locator('button:has-text("Detail")').first().click({ timeout: 5000 });
    await wait(3000);
    await shot(page, '04_vehicle_detail_main');
    const tabs = ['Drive', 'Battery', 'Charge', 'Trip', 'Repair', 'Mileage'];
    for (const t of tabs) {
      try {
        await page.locator(`.ant-tabs-tab:has-text("${t}"), [role="tab"]:has-text("${t}")`).first().click({ timeout: 2000 });
        await wait(2000);
        await shot(page, `04_vehicle_detail_${t}`);
      } catch (e) { console.log(`tab ${t} skipped`); }
    }
  } catch (e) { console.log('vehicle detail skipped'); }

  // 实时监控
  await go(page, '/monitor?tab=location', 4000);
  await shot(page, '05_monitor_location');
  await go(page, '/monitor?tab=playback', 4000);
  await shot(page, '05_monitor_playback');

  // 风控预警
  for (const t of ['fence', 'fault', 'battery']) {
    await go(page, `/risk?tab=${t}`, 3000);
    await shot(page, `06_risk_${t}`);
  }

  // 弹窗 2: 围栏预警详情 - 按钮文本是 "View"
  try {
    await go(page, '/risk?tab=fence', 3000);
    await page.locator('button:has-text("View")').first().click({ timeout: 5000 });
    await wait(3000);
    await shot(page, 'popup02_fence_alert_detail');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup02 skipped'); }

  // 驾驶行为
  await go(page, '/driving?tab=alert', 3000);
  await shot(page, '07_driving_alerts');
  await go(page, '/driving?tab=report', 3000);
  await shot(page, '07_driving_report_weekly');
  // 切换到月报 - 在Report子tab内
  try {
    await page.locator('.ant-tabs-tab:has-text("Monthly"), [role="tab"]:has-text("Monthly")').first().click({ timeout: 2000 });
    await wait(2000);
    await shot(page, '07_driving_report_monthly');
  } catch (e) { console.log('monthly tab skipped'); }

  // 弹窗 3: 驾驶报告详情 - 报告子tab的Detail
  try {
    await go(page, '/driving?tab=report', 4000);
    await wait(2000);
    // 找到Report内的Detail按钮(子tab中的)
    const detailBtn = page.locator('.ant-tabs-tabpane-active button:has-text("Detail"), .ant-tabs-tabpane-active a:has-text("Detail")').first();
    await detailBtn.click({ timeout: 5000 });
    await wait(3000);
    await shot(page, 'popup03_driving_report_detail');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup03 skipped'); }

  // 电池管理
  await go(page, '/battery?tab=monitor', 3000);
  await shot(page, '08_battery_monitor');
  await go(page, '/battery?tab=charge', 3000);
  await shot(page, '08_battery_charge');

  // 弹窗 4: 电池监控详情
  try {
    await go(page, '/battery?tab=monitor', 3000);
    await page.locator('button:has-text("Detail")').first().click({ timeout: 5000 });
    await wait(3000);
    await shot(page, 'popup04_battery_detail');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup04 skipped'); }

  // 行程记录
  await go(page, '/trips', 3000);
  await shot(page, '09_trips_list');
  try {
    await page.locator('button:has-text("Detail")').first().click({ timeout: 5000 });
    await wait(3000);
    await shot(page, '09_trips_detail');
  } catch (e) { console.log('trip detail skipped'); }

  // 围栏管理
  await go(page, '/fence', 3000);
  await shot(page, '10_fence_list');
  try {
    await page.locator('button:has-text("New Fence"), button:has-text("Create")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup10_fence_create');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('fence create popup skipped'); }

  // 维修管理
  await go(page, '/repair', 3000);
  await shot(page, '11_repair_list');
  try {
    await page.locator('button:has-text("New Repair")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup05_repair_create');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup05 skipped'); }

  // 租户管理
  await go(page, '/tenant', 3000);
  await shot(page, '12_tenant_list');
  try {
    await page.locator('button:has-text("New Tenant")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup06_tenant_create');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup06 skipped'); }

  try {
    await page.locator('button:has-text("Edit")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup06b_tenant_edit');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup06b skipped'); }

  try {
    await page.locator('button:has-text("Open Account")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup07_tenant_setup_admin');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup07 skipped'); }

  // 业务管理
  for (const t of ['permission', 'info', 'assets', 'users', 'roles']) {
    await go(page, `/biz?tab=${t}`, 3000);
    await shot(page, `13_biz_${t}`);
  }

  // 系统管理
  for (const url of ['/sys/users', '/sys/roles', '/sys/audit-log']) {
    await go(page, url, 3000);
    await shot(page, `14_sys_${url.split('/').pop()}`);
  }

  // 弹窗 8: 创建系统用户 (中文按钮)
  try {
    await go(page, '/sys/users', 3000);
    await page.locator('button:has-text("+ 新增用户"), button:has-text("新增用户")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup08_user_create_step1');
    await page.locator('input[id*="nickname" i], input[placeholder*="昵称"]').first().fill('测试用户').catch(() => {});
    await page.locator('input[id*="email" i], input[placeholder*="邮箱"]').first().fill('test@test.com').catch(() => {});
    await page.locator('button:has-text("下一步")').first().click({ timeout: 2000 }).catch(() => {});
    await wait(2000);
    await shot(page, 'popup08_user_create_step2');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup08 skipped'); }

  // 弹窗 9: 编辑系统用户
  try {
    await go(page, '/sys/users', 3000);
    await page.locator('button:has-text("编辑")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup09_user_edit');
    await page.keyboard.press('Escape');
  } catch (e) { console.log('popup09 skipped'); }

  // 弹窗 10: 重置密码
  try {
    await go(page, '/sys/users', 3000);
    await page.locator('button:has-text("重置密码")').first().click({ timeout: 5000 });
    await wait(2000);
    await shot(page, 'popup10_reset_password_confirm');
    await page.locator('.ant-modal button.ant-btn-primary:has-text("确定")').first().click({ timeout: 2000 }).catch(() => {});
    await wait(2000);
    await shot(page, 'popup10_reset_password_result');
  } catch (e) { console.log('popup10 skipped'); }

  // 车辆数据
  await go(page, '/vehicle-signal', 4000);
  await shot(page, '15_vehicle_signal');
  await go(page, '/data-export', 3000);
  await shot(page, '15_data_export');

  await browser.close();
  console.log('All done.');
})();
