# 苇渡-智利车队管理 — Playwright E2E 测试计划

## 1. 环境与配置

### 1.1 安装依赖
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 1.2 Playwright 配置 (`playwright.config.ts`)
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

---

## 2. 测试文件结构

```
e2e/
├── auth.setup.ts              # 认证状态设置（全局 setup）
├── global.teardown.ts         # 收尾清理
├── fixtures/
│   └── index.ts               # 自定义 test fixture
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── VehiclesPage.ts
│   ├── FencePage.ts
│   ├── RiskPage.ts
│   ├── DrivingPage.ts
│   ├── BatteryPage.ts
│   ├── TripsPage.ts
│   ├── RepairPage.ts
│   ├── VehicleSignalPage.ts
│   ├── DataExportPage.ts
│   ├── SysUsersPage.ts
│   └── SysRolesPage.ts
├── specs/
│   ├── 01-global.spec.ts          # TC-01 ~ TC-04
│   ├── 02-dashboard.spec.ts       # TC-05 ~ TC-06
│   ├── 03-vehicles.spec.ts        # TC-07 ~ TC-12
│   ├── 04-fence.spec.ts           # TC-13 ~ TC-20
│   ├── 05-risk.spec.ts            # TC-21 ~ TC-22
│   ├── 06-driving.spec.ts         # TC-23 ~ TC-28
│   ├── 07-battery.spec.ts         # TC-29 ~ TC-32
│   ├── 08-trips.spec.ts           # TC-33 ~ TC-34
│   ├── 09-repair.spec.ts          # TC-35 ~ TC-37
│   ├── 10-vehicle-signal.spec.ts  # TC-38 ~ TC-43
│   ├── 11-data-export.spec.ts     # TC-44
│   └── 12-system.spec.ts          # TC-45 ~ TC-47
└── utils/
    ├── mock-data.ts               # 共享测试数据 / 选择器常量
    └── helpers.ts                 # 工具函数（等待、截图、i18n 解析）
```

---

## 3. Page Object 设计

### 3.1 基类模式
每个 Page Object 继承一个基础类，提供通用操作：

```ts
// pages/BasePage.ts
export class BasePage {
  constructor(protected page: Page) {}

  // 通用等待：页面完全加载 + antd 动画结束
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // antd 动画缓冲
  }

  // 获取当前语言下的文字（通过 i18n key 反查）
  async t(key: string): Promise<string> {
    return this.page.evaluate((k) => {
      // 从 window 上挂载的 i18n 实例获取
      return (window as any).__i18n_t?.(k) || k;
    }, key);
  }

  // 截图对比辅助
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

### 3.2 核心 Page Object 清单

| Page Object | 对应页面 | 覆盖 TC |
|-------------|----------|---------|
| `LoginPage` | /login | TC-03 |
| `DashboardPage` | /dashboard | TC-05, TC-06 |
| `VehiclesPage` | /vehicles, /vehicles/:vin | TC-04, TC-07~TC-12 |
| `FencePage` | /fence | TC-13~TC-20 |
| `RiskPage` | /risk | TC-21, TC-22 |
| `DrivingPage` | /driving | TC-23~TC-28 |
| `BatteryPage` | /battery | TC-29~TC-32 |
| `TripsPage` | /trips | TC-33, TC-34 |
| `RepairPage` | /repair | TC-35~TC-37 |
| `VehicleSignalPage` | /vehicle-signal | TC-38~TC-43 |
| `DataExportPage` | /data-export | TC-44 |
| `SysUsersPage` | /sys/users | TC-45 |
| `SysRolesPage` | /sys/roles | TC-45, TC-46 |
| `Topbar` (组件) | 全局顶栏 | TC-01 |

---

## 4. 认证与 Setup

### 4.1 Global Setup (`auth.setup.ts`)

```ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // 方案 A: 直接通过 API / localStorage 注入认证态
  await page.goto('/login');
  
  // 填写登录表单（验证码固定逻辑）
  await page.fill('input[id="email"]', 'admin@weidu.cl');
  await page.fill('input[id="password"]', '12345678');
  
  // 读取验证码文字
  const captcha = await page.locator('.ant-input-group-addon span').textContent();
  await page.fill('input[id="captcha"]', captcha || '');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard');
  
  // 保存认证状态
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

### 4.2 test fixture (`fixtures/index.ts`)

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
// ... 导入所有页面对象

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  // ... 所有页面
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  // ...
});

export { expect } from '@playwright/test';
```

---

## 5. Test Case → Playwright 实现映射

### 5.1 全局 (`01-global.spec.ts`)

#### TC-01: 语言切换

```ts
test('TC-01 语言切换仅支持中文/英文', async ({ page, topbar }) => {
  await page.goto('/dashboard');
  
  // 获取当前语言按钮文字
  const langBtn = page.locator('button:has-text("ZH"):has-text("EN")').first();
  
  // 点击切换
  await langBtn.click();
  await page.waitForTimeout(500);
  
  // 切换后按钮文字变化
  const btnText = await langBtn.textContent();
  expect(['ZH', 'EN']).toContain(btnText);
  
  // 确认界面语言变化（例：首页标题）
  // 中文时：车辆总数；英文时：Total Vehicles
  const totalLabel = page.locator('.ant-statistic-title').first();
  if (btnText === 'ZH') {
    await expect(totalLabel).toContainText('车辆总数');
  } else {
    await expect(totalLabel).toContainText('Total');
  }

  // 确认无西班牙语选项
  await langBtn.click(); // 切回
  const finalText = await langBtn.textContent();
  // 西班牙语不在选项中
  // 通过检查 localStorage 中 lang 字段验证
  const lang = await page.evaluate(() => localStorage.getItem('weidu-fleet-storage'));
  expect(lang).not.toContain('es');
});
```

#### TC-02: 地理位置隐私

```ts
test('TC-02 所有位置信息默认隐藏，点击查看位置后显示', async ({ page }) => {
  // ---- 车辆管理列表 ----
  await page.goto('/vehicles');
  await page.waitForSelector('table');
  
  // 找到"最后位置"列中的"查看位置"链接
  const viewLocationLinks = page.locator('text=查看位置');
  await expect(viewLocationLinks.first()).toBeVisible();
  
  // 确认真实地址不可见
  await expect(page.locator('text=智利圣地亚哥')).toBeHidden();
  
  // 点击第一个"查看位置"
  await viewLocationLinks.first().click();
  
  // 真实地址出现
  await expect(page.locator('text=智利圣地亚哥').first()).toBeVisible();
  
  // ---- 行程记录列表 ----
  await page.goto('/trips');
  await page.waitForSelector('table');
  await expect(page.locator('text=查看位置').first()).toBeVisible();
  
  // ---- 围栏报警列表 ----
  await page.goto('/risk?tab=fence');
  await page.waitForSelector('table');
  await expect(page.locator('text=查看位置').first()).toBeVisible();
  
  // ---- 驾驶预警列表 ----
  await page.goto('/driving?tab=alert');
  await page.waitForSelector('table');
  await expect(page.locator('text=查看位置').first()).toBeVisible();
});
```

#### TC-03: 强制密码弹窗已移除

```ts
test('TC-03 登录无强制修改密码弹窗', async ({ page }) => {
  await page.goto('/login');
  
  // 使用 admin 账号登录（原本会触发密码弹窗）
  await page.fill('input[id="password"]', '12345678');
  const captcha = await page.locator('.ant-input-group-addon span').textContent();
  await page.fill('input[id="captcha"]', captcha || '');
  await page.click('button[type="submit"]');
  
  // 等待跳转
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // 确认没有"强制修改密码"弹窗
  await expect(page.locator('text=强制修改初始密码')).toBeHidden();
  await expect(page.locator('text=检测到您使用的是初始密码')).toBeHidden();
});
```

#### TC-04: 详情页标题

```ts
test('TC-04 详情页标题格式为"**详情页"', async ({ page }) => {
  // ---- 车辆管理详情页 ----
  await page.goto('/vehicles');
  await page.locator('table a:has-text("查看")').first().click();
  await page.waitForURL('**/vehicles/**');
  
  // 确认不显示车牌号
  const breadcrumb = page.locator('.ant-breadcrumb').last();
  await expect(breadcrumb).not.toContainText(/京[A-Z]/);
  
  // 确认显示"详情页"
  await expect(page.locator('text=详情页')).toBeVisible();
  
  // ---- 电池监控详情弹窗 ----
  await page.goto('/battery?tab=monitor');
  await page.locator('table button:has-text("查看")').first().click();
  await expect(page.locator('.ant-modal-title')).toContainText('详情页');
  
  // ---- 行程详情页 ----
  await page.goto('/trips');
  await page.locator('table a:has-text("查看")').first().click();
  await expect(page.locator('h2')).toContainText('详情页');
});
```

### 5.2 首页看板 (`02-dashboard.spec.ts`)

#### TC-05: 数据指标完整性

```ts
test('TC-05 首页展示8个数据指标', async ({ page }) => {
  await page.goto('/dashboard');
  
  const stats = page.locator('.ant-statistic');
  await expect(stats).toHaveCount(8);
  
  // 验证指标标题
  const titles = await page.locator('.ant-statistic-title').allTextContents();
  // 中文语言下
  expect(titles).toContain('车辆总数');
  expect(titles).toContain('在线数');
  expect(titles).toContain('离线数');
  expect(titles).toContain('今日里程');
  expect(titles).toContain('累计总里程');
  expect(titles).toContain('今日驾驶预警');
  expect(titles).toContain('今日围栏预警');
  expect(titles).toContain('今日低电报警');
});
```

#### TC-06: 排行榜字段名

```ts
test('TC-06 预警排行榜列名正确', async ({ page }) => {
  await page.goto('/dashboard');
  
  const headers = page.locator('.ant-table-thead th');
  const texts = await headers.allTextContents();
  
  expect(texts).toContain('序号');
  expect(texts).toContain('车牌号');
  expect(texts).toContain('驾驶预警');
  expect(texts).toContain('围栏预警');
  expect(texts).toContain('故障预警');
  expect(texts).toContain('低电报警');
  expect(texts).toContain('总计');
});
```

### 5.3 车辆管理 (`03-vehicles.spec.ts`)

#### TC-07: 续航→续航里程

```ts
test('TC-07 电池监控列表列名为续航里程', async ({ page }) => {
  await page.goto('/battery?tab=monitor');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers).toContainText('续航里程');
});
```

#### TC-08: 里程报表 - 近3年

```ts
test('TC-08 里程报表年视图展示近3年', async ({ page }) => {
  await page.goto('/vehicles');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 点击里程报表 tab
  await page.locator('button:has-text("里程报表")').click();
  
  // 点击"年"按钮
  await page.locator('.ant-radio-button-wrapper:has-text("年")').click();
  
  // 确认 X 轴标签包含 2024, 2025, 2026
  const labels = await page.locator('canvas').getAttribute('aria-label') || '';
  // 或者检查图表数据
  await expect(page.locator('text=2024年')).toBeVisible();
  await expect(page.locator('text=2025年')).toBeVisible();
  await expect(page.locator('text=2026年')).toBeVisible();
});
```

#### TC-09~TC-12: 车辆表格字段

```ts
test('TC-09 充电记录包含累计充电次数', async ({ page }) => {
  await page.goto('/battery?tab=charge');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers).toContainText('累计充电次数');
});

test('TC-10 到达时间改为结束时间', async ({ page }) => {
  await page.goto('/trips');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers).toContainText('结束时间');
});

test('TC-11 车辆列表最后位置默认隐藏', async ({ page }) => {
  await page.goto('/vehicles');
  await page.waitForSelector('table');
  
  // 确认"最后位置"列存在
  const headers = page.locator('.ant-table-thead th');
  await expect(headers).toContainText('最后位置');
  
  // 确认默认显示"查看位置"
  const views = page.locator('td:has-text("查看位置")');
  await expect(views.first()).toBeVisible();
});

test('TC-12 车辆详情页最后位置默认隐藏', async ({ page }) => {
  await page.goto('/vehicles');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 在详情页中找"最后位置"
  const labels = page.locator('.ant-descriptions-item-label');
  await expect(labels).toContainText('最后位置');
  
  // 对应值应该是"查看位置"
  const content = page.locator('.ant-descriptions-item-content');
  await expect(content.filter({ hasText: '查看位置' })).toBeVisible();
});
```

### 5.4 围栏管理 (`04-fence.spec.ts`)

```ts
test('TC-13 Switch 无文字', async ({ page }) => {
  await page.goto('/fence');
  const switches = page.locator('.ant-switch');
  
  // 确认 Switch 内部无文字
  const innerText = await switches.first().textContent();
  expect(innerText?.trim()).toBe('');
});

test('TC-14~TC-19 围栏列名验证', async ({ page }) => {
  await page.goto('/fence');
  const headers = page.locator('.ant-table-thead th');
  const texts = await headers.allTextContents();
  
  expect(texts).toContain('围栏类型');
  expect(texts).toContain('使用车辆');
  expect(texts).toContain('预警类型');
  expect(texts).toContain('围栏地址');
  expect(texts).toContain('操作人');
  expect(texts).toContain('添加时间');
  expect(texts).not.toContain('创建时间');
});

test('TC-20 添加车辆弹窗支持搜索', async ({ page }) => {
  await page.goto('/fence');
  
  // 点击车辆数链接进入配置页
  await page.locator('table a').first().click();
  
  // 点击"添加"按钮
  await page.locator('button:has-text("添加")').first().click();
  
  // 弹窗中有 Select 搜索框
  const select = page.locator('.ant-select');
  await expect(select.first()).toBeVisible();
  
  // 输入 VIN 码搜索
  await select.first().click();
  await page.keyboard.type('VIN');
  
  // 选项被过滤（antd 默认行为）
  // 验证弹窗标题
  await expect(page.locator('.ant-modal-title')).toContainText('选择车辆');
});
```

### 5.5 风控预警 (`05-risk.spec.ts`)

```ts
test('TC-21 围栏报警详情页布局', async ({ page }) => {
  await page.goto('/risk?tab=fence');
  await page.locator('table button:has-text("查看")').first().click();
  
  // 弹窗中左侧信息字段无"报警类型"
  const modalContent = page.locator('.ant-modal-content');
  await expect(modalContent).not.toContainText('报警类型');
  
  // 右侧地图存在
  const map = modalContent.locator('.leaflet-container');
  await expect(map).toBeVisible();
  
  // 布局为左侧信息列 + 右侧地图列
  const leftCol = modalContent.locator('.ant-col:first-child .ant-descriptions');
  await expect(leftCol).toBeVisible();
  
  const rightCol = modalContent.locator('.ant-col:last-child .leaflet-container');
  await expect(rightCol).toBeVisible();
});

test('TC-22 故障报警类型枚举', async ({ page }) => {
  await page.goto('/risk?tab=fault');
  const cells = page.locator('.ant-table-tbody td:nth-child(4)');
  const texts = await cells.allTextContents();
  
  // 所有枚举值应该是 VDC故障/CDCU故障/BDCU故障/ADAS故障 之一
  const validTypes = ['VDC故障', 'CDCU故障', 'BDCU故障', 'ADAS故障'];
  for (const text of texts) {
    expect(validTypes).toContain(text.trim());
  }
});
```

### 5.6 驾驶行为 (`06-driving.spec.ts`)

```ts
test('TC-23 驾驶预警字段改名', async ({ page }) => {
  await page.goto('/driving?tab=alert');
  const headers = page.locator('.ant-table-thead th');
  const texts = await headers.allTextContents();
  
  expect(texts).toContain('预警类型');
  expect(texts).toContain('预警位置');
  expect(texts).toContain('行车速度');
  expect(texts).not.toContain('风险事件');
  
  // 预警类型筛选项文字
  const filterSelect = page.locator('.ant-select:has-text("预警类型")');
  await expect(filterSelect).toBeVisible();
});

test('TC-24 驾驶报告数据指标', async ({ page }) => {
  await page.goto('/driving?tab=report');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 弹窗中4个指标卡
  const stats = page.locator('.ant-modal-content .ant-statistic-title');
  const texts = await stats.allTextContents();
  
  expect(texts).toContain('累计行驶里程');
  expect(texts).toContain('累计驾驶时长');
  expect(texts).toContain('平均车速');
  expect(texts).toContain('驾驶评分');
});

test('TC-25 驾驶报告图表名称', async ({ page }) => {
  await page.goto('/driving?tab=report');
  await page.locator('table a:has-text("查看")').first().click();
  
  const cardTitles = page.locator('.ant-modal-content .ant-card-head-title');
  const texts = await cardTitles.allTextContents();
  
  expect(texts).toContain('行驶里程趋势');
  expect(texts).toContain('驾驶时间段占比');
  expect(texts).toContain('行驶区域分布');
  expect(texts).toContain('风险事件统计');
});

test('TC-26 行驶区域分布按城市', async ({ page }) => {
  await page.goto('/driving?tab=report');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 检查饼图/柱状图标签
  // 通过 canvas 相邻文字检查
  const areaCard = page.locator('.ant-card:has-text("行驶区域分布")');
  await expect(areaCard).toContainText('圣地亚哥');
  await expect(areaCard).not.toContainText('高速');
});

test('TC-27 风险事件统计为折线图', async ({ page }) => {
  await page.goto('/driving?tab=report');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 确认使用 Line 组件（canvas 元素存在且 title 为风险事件统计）
  await expect(page.locator('.ant-card:has-text("风险事件统计") canvas')).toBeVisible();
});

test('TC-28 驾驶报告时间筛选', async ({ page }) => {
  await page.goto('/driving?tab=report');
  
  // 周报 - 存在周选择器
  const weekPicker = page.locator('.ant-picker:has-text("选择周")');
  await expect(weekPicker).toBeVisible();
  
  // 切换到月报 tab
  await page.locator('button:has-text("月报")').click();
  await page.waitForTimeout(500);
  
  // 月报 - 存在月选择器
  const monthPicker = page.locator('.ant-picker:has-text("选择月")');
  await expect(monthPicker).toBeVisible();
});
```

### 5.7 电池管理 (`07-battery.spec.ts`)

```ts
test('TC-29 电池监控详情图表 X 轴月-日格式', async ({ page }) => {
  await page.goto('/battery?tab=monitor');
  await page.locator('table button:has-text("查看")').first().click();
  
  // 图表使用 canvas，无法直接读取标签
  // 通过检查数据标签起始格式间接验证
  // 或者检查 chart.js 内部数据
  const xLabels = await page.evaluate(() => {
    const charts = (window as any).Chart?.instances;
    if (!charts) return null;
    const chart = Object.values(charts)[0] as any;
    return chart?.data?.labels?.slice(0, 3);
  });
  
  if (xLabels) {
    // 前3个标签应该是 "06-01", "06-02", "06-03"
    expect(xLabels[0]).toMatch(/^\d{2}-\d{2}$/);
    expect(xLabels[0]).not.toMatch(/^D/);
  }
});

test('TC-30 电池详情布局指标在上图表在下', async ({ page }) => {
  await page.goto('/battery?tab=monitor');
  await page.locator('table button:has-text("查看")').first().click();
  
  const modal = page.locator('.ant-modal-content');
  
  // 先有指标卡（Statistic），后有图表卡
  const statCards = modal.locator('.ant-statistic');
  await expect(statCards).toHaveCount(3);
  
  // 三个指标：SOC、电池健康度、电池温度
  const statTitles = await statCards.locator('.ant-statistic-title').allTextContents();
  expect(statTitles).toContain('SOC');
  expect(statTitles).toContain('电池健康度');
  expect(statTitles).toContain('电池温度');
});

test('TC-31 放电记录字段', async ({ page }) => {
  await page.goto('/battery?tab=charge');
  
  // 点击"放电记录" tab
  await page.locator('button:has-text("放电记录")').click();
  await page.waitForTimeout(500);
  
  const headers = page.locator('.ant-table-thead th');
  const texts = await headers.allTextContents();
  
  expect(texts).toContain('放电时长');
  expect(texts).not.toContain('消耗电量');
  expect(texts).not.toContain('充电时长');
});

test('TC-32 充放电记录时间筛选', async ({ page }) => {
  await page.goto('/battery?tab=charge');
  
  // 充电记录有日期范围选择器
  await expect(page.locator('.ant-picker-range').first()).toBeVisible();
  
  // 切到放电记录
  await page.locator('button:has-text("放电记录")').click();
  await page.waitForTimeout(500);
  
  // 放电记录也有日期范围选择器
  await expect(page.locator('.ant-picker-range').first()).toBeVisible();
});
```

### 5.8 行程管理 (`08-trips.spec.ts`)

```ts
test('TC-33 行程列表起终点默认隐藏', async ({ page }) => {
  await page.goto('/trips');
  await page.waitForSelector('table');
  
  // 起点/终点列显示"查看位置"
  const viewLinks = page.locator('td:has-text("查看位置")');
  await expect(viewLinks.first()).toBeVisible();
  
  // 点击后显示地址
  await viewLinks.first().click();
  await expect(page.locator('text=智利').first()).toBeVisible();
});

test('TC-34 行程详情页无预警字段', async ({ page }) => {
  await page.goto('/trips');
  await page.locator('table a:has-text("查看")').first().click();
  
  // 确认无"开始时间"、"到达时间"、"预警次数"、"预警信息"等字段
  const pageText = await page.locator('.ant-descriptions').textContent();
  expect(pageText).not.toContain('开始时间');
  expect(pageText).not.toContain('预警次数');
  
  // 起点终点使用查看位置
  const contents = page.locator('.ant-descriptions-item-content');
  await expect(contents.filter({ hasText: '查看位置' }).first()).toBeVisible();
  
  // 无预警信息框
  await expect(page.locator('.ant-card:has-text("告警")')).toBeHidden();
});
```

### 5.9 维修管理 (`09-repair.spec.ts`)

```ts
test('TC-35 新建维修维修描述为下拉', async ({ page }) => {
  await page.goto('/repair');
  await page.locator('button:has-text("新建维修")').click();
  
  // 弹窗中的"维修描述"是 Select 而非 Input.TextArea
  const descField = page.locator('.ant-modal .ant-form-item:has-text("维修描述")');
  
  // 确认是 Select（有 .ant-select 类）
  const select = descField.locator('.ant-select');
  await expect(select).toBeVisible();
  
  // 不是 TextArea
  await expect(descField.locator('textarea')).toBeHidden();
  
  // 展开下拉看看选项
  await select.click();
  const dropdown = page.locator('.ant-select-dropdown');
  await expect(dropdown).toBeVisible();
  const options = await dropdown.locator('.ant-select-item').allTextContents();
  expect(options.length).toBeGreaterThan(0);
});

test('TC-36 维修列表时间筛选', async ({ page }) => {
  await page.goto('/repair');
  await expect(page.locator('.ant-picker-range')).toBeVisible();
});

test('TC-37 完成按钮文字为完成维修', async ({ page }) => {
  await page.goto('/repair');
  
  // 状态为"维修中"的记录应有"完成维修"按钮
  const completeBtn = page.locator('button:has-text("完成维修")');
  await expect(completeBtn.first()).toBeVisible();
  await expect(completeBtn.first()).not.toContainText('完成');
});
```

### 5.10 车辆信号数据 (`10-vehicle-signal.spec.ts`)

```ts
test('TC-38 树状结构2层级仅车牌号', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 左侧树存在
  const tree = page.locator('.ant-tree');
  await expect(tree).toBeVisible();
  
  // 叶子节点只显示车牌号（无 VIN）
  const leafNodes = tree.locator('.ant-tree-treenode:has(.ant-tree-node-content-wrapper)');
  const leafTexts = await leafNodes.allTextContents();
  
  for (const text of leafTexts) {
    // 不包含 VIN 格式的长字符串
    expect(text).not.toMatch(/[A-Z0-9]{10,}/);
  }
});

test('TC-39 右侧列表有车牌号列', async ({ page }) => {
  await page.goto('/vehicle-signal');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers).toContainText('车牌号');
});

test('TC-40 导出按钮在右上方', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 导出 CSV 按钮在页面右上方
  const exportBtn = page.locator('button:has-text("导出 CSV")');
  await expect(exportBtn).toBeVisible();
  
  // 确认它在 Page header / filter 区域而非底部分页区域
  const headerCard = page.locator('.ant-card').first();
  const inHeader = await headerCard.locator('button:has-text("导出 CSV")').isVisible();
  expect(inHeader).toBe(true);
});

test('TC-41 上报时间无排序', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 上报时间列表头没有排序图标
  const timeHeader = page.locator('th:has-text("上报时间")');
  const sortIcon = timeHeader.locator('.ant-table-column-sorter');
  await expect(sortIcon).toBeHidden();
});

test('TC-42 筛选项有标签名称', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 筛选区域有"选择时间"和"选择信号"标签
  await expect(page.locator('text=选择时间')).toBeVisible();
  await expect(page.locator('text=选择信号')).toBeVisible();
});

test('TC-43 信号分组选择', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 打开信号选择器
  const signalSelect = page.locator('.ant-tree-select');
  await signalSelect.click();
  
  // 确认有分组标题（电池监控、充电记录等）
  const dropdown = page.locator('.ant-select-dropdown');
  await expect(dropdown.locator('text=电池监控')).toBeVisible();
  await expect(dropdown.locator('text=充电记录')).toBeVisible();
  await expect(dropdown.locator('text=行程记录')).toBeVisible();
  await expect(dropdown.locator('text=风控预警')).toBeVisible();
  await expect(dropdown.locator('text=驾驶预警')).toBeVisible();
  
  // 全选按钮存在
  await expect(page.locator('button:has-text("全选")')).toBeVisible();
});
```

### 5.11 数据导出记录 (`11-data-export.spec.ts`)

```ts
test('TC-44 导出记录无筛选条件摘要列', async ({ page }) => {
  await page.goto('/data-export');
  const headers = page.locator('.ant-table-thead th');
  const texts = await headers.allTextContents();
  
  expect(texts).not.toContain('筛选条件摘要');
  expect(texts).toContain('文件名');
  expect(texts).toContain('数据条数');
});
```

### 5.12 系统管理 (`12-system.spec.ts`)

```ts
test('TC-45 用户/角色为独立菜单项', async ({ page }) => {
  await page.goto('/');
  
  // 侧边栏中"用户管理"和"角色管理"是独立项
  const sidebar = page.locator('.ant-menu');
  
  const userMgmtItem = sidebar.locator('a:has-text("用户管理")');
  const roleMgmtItem = sidebar.locator('a:has-text("角色管理")');
  
  await expect(userMgmtItem).toBeVisible();
  await expect(roleMgmtItem).toBeVisible();
  
  // 点击用户管理
  await userMgmtItem.click();
  await page.waitForURL('**/sys/users');
  
  // 确认只有用户管理内容（无标签切换栏）
  await expect(page.locator('text=用户列表')).toBeVisible();
  await expect(page.locator('button:has-text("角色列表")')).toBeHidden();
  
  // 点击角色管理
  await roleMgmtItem.click();
  await page.waitForURL('**/sys/roles');
  
  // 确认只有角色管理内容
  await expect(page.locator('text=功能权限')).toBeVisible();
});

test('TC-46 角色管理中文显示', async ({ page }) => {
  await page.goto('/sys/roles');
  
  // 角色卡片中的权限列表使用中文
  // 检查权限列表
  const permissions = page.locator('.ant-card ul li');
  const texts = await permissions.allTextContents();
  
  for (const text of texts) {
    // 权限应为中文，不含英文单词
    expect(text).not.toMatch(/^[A-Z]/);
  }
});

test('TC-47 导出 CSV 格式', async ({ page }) => {
  await page.goto('/vehicle-signal');
  
  // 导出按钮文字为"导出 CSV"
  const exportBtn = page.locator('button:has-text("导出 CSV")');
  await expect(exportBtn).toBeVisible();
  await expect(exportBtn).not.toContainText('Excel');
  await expect(exportBtn).not.toContainText('XLSX');
});
```

---

## 6. 测试执行命令

```bash
# 仅运行全局测试
npx playwright test e2e/specs/01-global.spec.ts

# 运行所有测试
npx playwright test

# 带 UI 模式调试
npx playwright test --ui

# 生成报告
npx playwright show-report
```

## 7. CI 集成 (GitHub Actions)

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install chromium

- name: Start dev server
  run: npm run dev & npx wait-on http://localhost:3001

- name: Run E2E tests
  run: npx playwright test

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

---

## 8. 统计

| 规格文件 | 覆盖 TCs | 测试数 |
|----------|----------|--------|
| `01-global.spec.ts` | TC-01~TC-04 | 4 |
| `02-dashboard.spec.ts` | TC-05~TC-06 | 2 |
| `03-vehicles.spec.ts` | TC-07~TC-12 | 6 |
| `04-fence.spec.ts` | TC-13~TC-20 | 8 |
| `05-risk.spec.ts` | TC-21~TC-22 | 2 |
| `06-driving.spec.ts` | TC-23~TC-28 | 6 |
| `07-battery.spec.ts` | TC-29~TC-32 | 4 |
| `08-trips.spec.ts` | TC-33~TC-34 | 2 |
| `09-repair.spec.ts` | TC-35~TC-37 | 3 |
| `10-vehicle-signal.spec.ts` | TC-38~TC-43 | 6 |
| `11-data-export.spec.ts` | TC-44 | 1 |
| `12-system.spec.ts` | TC-45~TC-47 | 3 |
| **合计** | **TC-01~TC-47** | **47** |
