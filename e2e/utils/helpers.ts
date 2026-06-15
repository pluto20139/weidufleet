import { Page, expect } from '@playwright/test';

/** 等待 antd 动画 / 路由过渡完成 */
export async function waitForPageReady(page: Page, timeout = 3000) {
  await page.waitForLoadState('networkidle');
  // antd 动效缓冲
  await page.waitForTimeout(500);
}

/** 透过 react-i18next 实例取当前语言下的文案（仅调试用） */
export async function getI18nText(page: Page, key: string): Promise<string> {
  return page.evaluate((k: string) => {
    const i18n = (window as any).__i18n_t;
    return i18n ? i18n(k) : k;
  }, key);
}

/** 判断当前 UI 语言 */
export async function getCurrentLang(page: Page): Promise<string> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('weidu-fleet-storage');
      if (!raw) return 'zh';
      return JSON.parse(raw).state?.lang || 'zh';
    } catch {
      return 'zh';
    }
  });
}

/** 将页面所有表格头提取成纯文本数组 */
export async function getTableHeaders(page: Page): Promise<string[]> {
  return page.locator('.ant-table-thead th').allTextContents();
}

/** 断言表格某列的值全部属于合法集合 */
export async function expectColumnValues(
  page: Page,
  colIndex: number,
  validValues: string[],
) {
  const cells = page.locator(`.ant-table-tbody td:nth-child(${colIndex + 1})`);
  const count = await cells.count();
  for (let i = 0; i < count; i++) {
    const text = (await cells.nth(i).textContent())?.trim() || '';
    expect(validValues).toContain(text);
  }
}
