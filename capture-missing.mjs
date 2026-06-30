import { chromium } from 'playwright';

const BASE = 'http://localhost:3002';
const OUT = '/Users/Zhuanz1/Desktop/AI文件夹/苇渡-智利车队管理/manual_screenshots';
const VIEWPORT = { width: 1600, height: 1000 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
  const page = await ctx.newPage();

  // 登录
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await wait(3000);
  const emailInput = page.locator('input[id*="email" i]').first();
  const passInput = page.locator('input[type="password"]').first();
  const captchaInput = page.locator('input[id*="captcha" i]').first();
  await emailInput.fill('admin@weidu.cl');
  await passInput.fill('Pass1234');
  const captchaText = await page.locator('text=/^[A-Z0-9]{4}$/').first().textContent();
  await captchaInput.fill(captchaText.trim());
  await page.click('button[type="submit"]');
  await wait(3000);

  // === 弹窗 3: 驾驶报告详情 ===
  console.log('\n=== 弹窗 3: 驾驶报告详情 ===');
  // 通过侧边栏进入
  await page.goto(`${BASE}/driving?tab=alert`, { waitUntil: 'domcontentloaded' });
  await wait(2000);
  // 展开 Driving 菜单
  await page.evaluate(() => {
    const submenus = document.querySelectorAll('.ant-menu-submenu-title');
    for (const s of submenus) {
      if (s.textContent?.includes('Driving')) { s.click(); return; }
    }
  });
  await wait(1500);
  // 点击 Driving Reports
  await page.evaluate(() => {
    const items = document.querySelectorAll('li.ant-menu-item');
    for (const item of items) {
      if (item.textContent?.trim() === 'Driving Reports') { item.click(); return; }
    }
  });
  await wait(3000);

  // 通过直接修改 store 数据让表格有数据
  await page.evaluate(() => {
    // 找到 Zustand store
    const w = window;
    let store = null;
    if (w.useAppStore || w.__APP_STORE__) {
      store = w.useAppStore || w.__APP_STORE__;
    }
    return store;
  });

  // 检查页面状态
  let bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 600));
  console.log('Driving Report page:', bodyText);

  // 等待数据加载,然后点击 Search
  console.log('\n点击 Search 按钮...');
  const searchClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.textContent?.trim() === 'Search' || b.textContent?.trim() === '查询') {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('Search clicked:', searchClicked);
  await wait(3000);

  bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 600));
  console.log('After search:', bodyText);

  // 尝试点击 Detail 按钮
  const detailClicked = await page.evaluate(() => {
    const details = Array.from(document.querySelectorAll('button, a'))
      .filter(el => el.textContent?.trim() === 'Detail' && el.offsetParent !== null);
    if (details.length > 0) {
      details[0].click();
      return { clicked: true, count: details.length };
    }
    return { clicked: false, count: 0 };
  });
  console.log('Detail:', detailClicked);
  await wait(3000);

  // 检查是否弹窗打开
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal-body');
    return modal?.innerText?.slice(0, 400) || 'no modal';
  });
  console.log('Modal content:', modalText);

  await page.screenshot({ path: `${OUT}/popup03_driving_report_detail.png`, fullPage: true });
  console.log('✓ popup03_driving_report_detail');

  // === 页面 10: 围栏管理 - 车辆配置页 ===
  console.log('\n=== 页面 10: 围栏管理 - 车辆配置 ===');
  await page.goto(`${BASE}/fence`, { waitUntil: 'domcontentloaded' });
  await wait(3000);

  // 列出页面中所有可点击的"使用车辆"链接
  const allLinks = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, span, div'))
      .filter(el => el.offsetParent !== null)
      .filter(el => /使用车辆|Config|Vehicles|config.*vehicle/i.test(el.textContent || ''))
      .slice(0, 15)
      .map(el => ({ tag: el.tagName, class: el.className?.toString().slice(0, 60), text: el.textContent?.trim().slice(0, 30) }));
    return items;
  });
  console.log('Links found:', JSON.stringify(allLinks, null, 2));

  // 找含"使用车辆"或 "Config" 文字的链接
  const configClicked = await page.evaluate(() => {
    // 尝试所有可见元素中匹配 "使用车辆" 的链接
    const all = Array.from(document.querySelectorAll('a, button, span'));
    for (const el of all) {
      if (el.offsetParent === null) continue;
      if (el.textContent?.trim() === '使用车辆' || el.textContent?.trim() === 'Config Vehicles') {
        el.click();
        return { clicked: true, text: el.textContent.trim() };
      }
    }
    // 也尝试匹配含"使用车辆"的
    for (const el of all) {
      if (el.offsetParent === null) continue;
      if ((el.textContent || '').includes('使用车辆') && (el.textContent || '').length < 50) {
        el.click();
        return { clicked: true, text: el.textContent.trim() };
      }
    }
    return { clicked: false };
  });
  console.log('Config clicked:', configClicked);
  await wait(3000);

  await page.screenshot({ path: `${OUT}/10_fence_vehicles.png`, fullPage: true });
  console.log('✓ 10_fence_vehicles');

  await browser.close();
  console.log('Done.');
})();
