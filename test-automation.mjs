/**
 * 苇渡-智利车队管理 自动化测试脚本
 * 使用 Puppeteer 进行全菜单点击测试 & 错误监控
 */
import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3002';
const REPORT = {
  totalPages: 0,
  errors: [],
  successes: [],
  consoleErrors: [],
  networkFailures: [],
  pageStates: [],
};

let pageIndex = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Filter out known harmless warnings
function isHarmlessWarning(text) {
  const harmless = [
    'addonAfter is deprecated',
    '[@ant-design/icons]',
    'You are using a whole package of antd',
  ];
  return harmless.some(h => text.includes(h));
}

async function navigateAndCheck(page, pathname, label, storeSetupFn) {
  pageIndex++;
  const stepNum = pageIndex;
  REPORT.totalPages++;

  console.log(`\n[${stepNum}] 正在访问: ${label} (${pathname})`);

  let pageError = null;
  const pageConsoleErrors = [];
  const pageNetworkFailures = [];

  // Listen for console messages on this page
  const consoleHandler = (msg) => {
    const text = msg.text();
    const type = msg.type();
    // Skip harmless warnings
    if (isHarmlessWarning(text)) return;
    if (type === 'error' || type === 'warning' || text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) {
      const stack = msg.stackTrace ? msg.stackTrace().map(s => s.url + ':' + s.lineNumber).join('\n') : '';
      pageConsoleErrors.push({ type, text, stack });
    }
  };
  page.on('console', consoleHandler);

  // Listen for request failures
  const requestFailHandler = (req) => {
    const resp = req.response();
    if (resp) {
      const status = resp.status();
      if (status >= 400) {
        pageNetworkFailures.push({
          url: req.url(),
          method: req.method(),
          status,
          failure: req.failure()?.errorText || '',
        });
      }
    }
  };
  page.on('requestfailed', requestFailHandler);

  try {
    // Run any store setup before navigation (e.g., set page state to bypass auth)
    if (storeSetupFn) {
      await page.evaluate(storeSetupFn);
    }

    await page.goto(BASE_URL + pathname, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(2000); // wait 2 sec for rendering

    // Take a state snapshot
    const state = await page.evaluate(() => {
      const bodyText = document.body?.innerText?.substring(0, 300) || 'empty';
      const url = window.location.href;
      const title = document.title;
      return { url, title, bodyPreview: bodyText };
    });
    REPORT.pageStates.push({ label, pathname, state });

    if (pageConsoleErrors.length > 0) {
      REPORT.consoleErrors.push({ label, pathname, errors: pageConsoleErrors });
    }
    if (pageNetworkFailures.length > 0) {
      REPORT.networkFailures.push({ label, pathname, failures: pageNetworkFailures });
    }
    if (pageConsoleErrors.length === 0 && pageNetworkFailures.length === 0) {
      REPORT.successes.push({ label, pathname });
      console.log(`  ✅ ${label} - 加载正常`);
    } else {
      console.log(`  ⚠️ ${label} - 发现 ${pageConsoleErrors.length} 个控制台错误, ${pageNetworkFailures.length} 个网络失败`);
    }
  } catch (err) {
    pageError = err.message;
    REPORT.errors.push({ label, pathname, error: err.message, stack: err.stack });
    console.log(`  ❌ ${label} - 异常: ${err.message}`);
  } finally {
    page.off('console', consoleHandler);
    page.off('requestfailed', requestFailHandler);
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    dumpio: false,
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Collect all console errors globally
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const stack = msg.stackTrace ? msg.stackTrace().map(s => s.url + ':' + s.lineNumber).join('\n') : '';
      console.log(`[CONSOLE ERROR] ${msg.text()}\n${stack}`);
    }
  });

  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // ==============================
  // 1. 登录
  // ==============================
  console.log('\n========== 登录流程 ==========');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(1000);

  // Fill login form
  // Email is pre-filled, captcha is auto-generated visible text
  const captchaText = await page.evaluate(() => {
    // Get the captcha text from the span inside the addonAfter
    const captchaSpan = document.querySelector('.ant-input-group-addon span');
    return captchaSpan ? captchaSpan.textContent.trim() : '';
  });
  console.log(`检测到验证码: "${captchaText}"`);

  // Click the submit button
  await page.evaluate(() => {
    const btn = document.querySelector('.ant-btn-primary');
    if (btn) btn.click();
  });

  await sleep(2000);

  // Check if login succeeded (redirected to dashboard)
  const currentUrl = page.url();
  console.log(`登录后 URL: ${currentUrl}`);

  // ==============================
  // 2. 遍历所有页面/菜单
  // ==============================
  console.log('\n========== 页面遍历测试 ==========');

  // Helper to set app store auth state before navigating
  const setAuthState = `() => {
    // Access Zustand store from React internals
    // Use localStorage to set the persisted state
    const data = { user: 'admin', token: 'mock-token-12345', lang: 'zh' };
    localStorage.setItem('weidu-fleet-storage', JSON.stringify({ state: data, version: 0 }));
    // We also need to update the in-memory store
    // Find React root and trigger state update via dispatchEvent
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: data }));
  }`;

  // Set store to authenticated state and force reload
  await page.evaluate(setAuthState);
  // Navigate directly and wait
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);

  // Check if login redirect happened - if so, try alternative auth bypass
  const afterNavUrl = page.url();
  console.log(`导航到 /dashboard 后 URL: ${afterNavUrl}`);
  
  // If still on login, we need a different approach: directly set localStorage AND navigate programmatically
  if (afterNavUrl.includes('/login')) {
    console.log('Auth state not recognized by store. Trying direct store injection...');
    
    // The AppLayout checks page !== 'login'. The store persists to localStorage.
    // We need to set the zustand store's persisted state AND the in-memory state.
    await page.evaluate(() => {
      // Set localStorage first
      const persistData = {
        state: { user: 'admin', token: 'mock-token-12345', lang: 'zh' },
        version: 0
      };
      localStorage.setItem('weidu-fleet-storage', JSON.stringify(persistData));
      
      // Also try to directly modify the store by finding React's internal state
      // The store is created with Zustand persist middleware
      // We need to reinitialize the page so the store reads from localStorage
    });
    
    // Reload page so React/i18n re-reads localStorage
    await page.reload({ waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(1000);
    
    // Now try navigating again
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(2000);
    console.log(`导航到 /dashboard (第二次尝试) 后 URL: ${page.url()}`);
  }

  // Now define all routes to test
  const routes = [
    { path: '/dashboard', label: '仪表盘 (Dashboard)' },
    { path: '/vehicles', label: '车辆列表 (Vehicles)' },
    { path: '/monitor', label: '实时监控 - 位置 (Monitor/Location)' },
    { path: '/risk', label: '风险告警 (Risk)' },
    { path: '/driving', label: '驾驶行为 (Driving)' },
    { path: '/battery', label: '电池管理 (Battery)' },
    { path: '/trips', label: '行程记录 (Trips)' },
    { path: '/fence', label: '电子围栏 (Fence)' },
    { path: '/repair', label: '维修记录 (Repair)' },
    { path: '/tenant', label: '租户管理 (Tenant)' },
    { path: '/biz', label: '业务管理 (Biz)' },
    { path: '/sys', label: '系统设置 (Sys)' },
  ];

  for (const route of routes) {
    await navigateAndCheck(page, route.path, route.label, null);
  }

  // ==============================
  // 3. 关闭浏览器 & 输出报告
  // ==============================
  await browser.close();

  printReport();
}

function printReport() {
  console.log('\n\n');
  console.log('================================================================');
  console.log('           苇渡-智利车队管理 自动化测试与Bug排查报告');
  console.log('================================================================');
  console.log('');
  console.log('【测试概述】');
  console.log(`  测试时间: ${new Date().toISOString()}`);
  console.log(`  测试页面数: ${REPORT.totalPages}`);
  console.log(`  成功页面: ${REPORT.successes.length}`);
  console.log(`  控制台错误页: ${REPORT.consoleErrors.length}`);
  console.log(`  网络请求失败页: ${REPORT.networkFailures.length}`);
  console.log(`  异常崩溃页: ${REPORT.errors.length}`);
  console.log('');

  // Success pages
  if (REPORT.successes.length > 0) {
    console.log('【✅ 正常页面列表】');
    REPORT.successes.forEach(s => console.log(`  - ${s.label} (${s.pathname})`));
    console.log('');
  }

  // Console errors
  if (REPORT.consoleErrors.length > 0) {
    console.log('【⚠️ 控制台错误】');
    REPORT.consoleErrors.forEach(item => {
      console.log(`\n  ▶ 页面: ${item.label} (${item.pathname})`);
      item.errors.forEach((e, i) => {
        console.log(`    Error #${i+1}: [${e.type}] ${e.text}`);
        if (e.stack) {
          console.log(`    Stack: ${e.stack}`);
        }
      });
    });
    console.log('');
  }

  // Network failures
  if (REPORT.networkFailures.length > 0) {
    console.log('【🌐 网络请求失败】');
    REPORT.networkFailures.forEach(item => {
      console.log(`\n  ▶ 页面: ${item.label} (${item.pathname})`);
      item.failures.forEach((f, i) => {
        console.log(`    Request #${i+1}: ${f.method} ${f.url} -> ${f.status} (${f.failure})`);
      });
    });
    console.log('');
  }

  // Errors
  if (REPORT.errors.length > 0) {
    console.log('【❌ 页面异常】');
    REPORT.errors.forEach(item => {
      console.log(`\n  ▶ 页面: ${item.label} (${item.pathname})`);
      console.log(`    错误: ${item.error}`);
    });
    console.log('');
  }

  if (REPORT.errors.length === 0 && REPORT.consoleErrors.length === 0 && REPORT.networkFailures.length === 0) {
    console.log('【结论】全链路畅通，未发现任何错误。');
  } else {
    console.log('【结论】发现上述问题，建议逐一排查。');
  }

  console.log('================================================================');
}

main().catch(err => {
  console.error('测试脚本异常退出:', err);
  process.exit(1);
});
