import { test, expect } from '../fixtures';

test.describe('TC-05~TC-06 首页看板', () => {

  test('TC-05 首页展示8个数据指标', async ({ dashboardPage }) => {
    await dashboardPage.goto('/dashboard');

    // 8 个 Statistic 卡片
    await expect(dashboardPage.statCards).toHaveCount(8);

    // 验证指标标题
    const titles = await dashboardPage.statTitles.allTextContents();
    expect(titles).toContain('车辆总数');
    expect(titles).toContain('在线数');
    expect(titles).toContain('离线数');
    expect(titles).toContain('今日里程');
    expect(titles).toContain('累计总里程');
    expect(titles).toContain('今日驾驶预警');
    expect(titles).toContain('今日围栏预警');
    expect(titles).toContain('今日低电报警');
  });

  test('TC-06 预警排行榜列名正确', async ({ dashboardPage }) => {
    await dashboardPage.goto('/dashboard');
    const texts = await dashboardPage.rankingHeaders.allTextContents();
    expect(texts).toContain('序号');
    expect(texts).toContain('车牌号');
    expect(texts).toContain('驾驶预警');
    expect(texts).toContain('围栏预警');
    expect(texts).toContain('故障预警');
    expect(texts).toContain('低电报警');
    expect(texts).toContain('总计');
  });
});
