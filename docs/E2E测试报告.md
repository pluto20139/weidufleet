# 苇渡-智利车队管理 E2E 自动化测试报告

**测试执行时间：** 2026年6月11日
**测试框架：** Playwright
**执行环境：** Chromium (Headless)

---

## 1. 测试概览
- **总用例数：** 43
- **✅ 通过数量：** 4
- **❌ 失败数量：** 39
- **通过率：** 9.3%

---

## 2. 失败的测试用例 (39个)

大部分失败的原因是 **页面元素加载超时 (`TimeoutError`)**，例如在限定时间内未能渲染出 `table` 列表。这通常意味着前端在等待 API 响应，或者需要配置 Mock 数据环境。

### 01-全局配置
1. ❌ **TC-01 语言切换仅支持中文/英文** *(e2e/specs/01-global.spec.ts)*
2. ❌ **TC-02 所有位置信息默认隐藏** *(e2e/specs/01-global.spec.ts)*
3. ❌ **TC-04 详情页标题格式为"**详情页"** *(e2e/specs/01-global.spec.ts)*

### 02-首页看板
4. ❌ **TC-05 首页展示8个数据指标** *(e2e/specs/02-dashboard.spec.ts)*
5. ❌ **TC-06 预警排行榜列名正确** *(e2e/specs/02-dashboard.spec.ts)*

### 03-车辆管理
6. ❌ **TC-07 电池监控列表列名为续航里程** *(e2e/specs/03-vehicles.spec.ts)*
7. ❌ **TC-08 里程报表年视图展示近3年** *(e2e/specs/03-vehicles.spec.ts)*
8. ❌ **TC-09 充电记录包含累计充电次数** *(e2e/specs/03-vehicles.spec.ts)*
9. ❌ **TC-10 行程列表列名为结束时间** *(e2e/specs/03-vehicles.spec.ts)*
10. ❌ **TC-11 车辆列表最后位置默认隐藏** *(e2e/specs/03-vehicles.spec.ts)*
11. ❌ **TC-12 车辆详情页最后位置默认隐藏** *(e2e/specs/03-vehicles.spec.ts)*

### 04-围栏管理
12. ❌ **TC-13 Switch 无文字** *(e2e/specs/04-fence.spec.ts)*
13. ❌ **TC-14~19 围栏列名验证** *(e2e/specs/04-fence.spec.ts)*
14. ❌ **TC-20 添加车辆弹窗支持搜索** *(e2e/specs/04-fence.spec.ts)*

### 05-风控预警
15. ❌ **TC-21 围栏报警详情页布局（左信息右地图，无报警类型）** *(e2e/specs/05-risk.spec.ts)*
16. ❌ **TC-22 故障报警类型枚举值为 VDC/CDCU/BDCU/ADAS 故障** *(e2e/specs/05-risk.spec.ts)*

### 06-驾驶行为
17. ❌ **TC-23 驾驶预警字段改名** *(e2e/specs/06-driving.spec.ts)*
18. ❌ **TC-24 驾驶报告数据指标** *(e2e/specs/06-driving.spec.ts)*
19. ❌ **TC-25 驾驶报告图表名称** *(e2e/specs/06-driving.spec.ts)*
20. ❌ **TC-26 行驶区域分布按智利城市展示** *(e2e/specs/06-driving.spec.ts)*
21. ❌ **TC-27 风险事件统计为折线图** *(e2e/specs/06-driving.spec.ts)*
22. ❌ **TC-28 驾驶报告周报月报时间筛选** *(e2e/specs/06-driving.spec.ts)*

### 07-电池管理
23. ❌ **TC-29 电池监控详情图表 X 轴月-日格式** *(e2e/specs/07-battery.spec.ts)*
24. ❌ **TC-30 电池详情布局：3指标在上，图表在下** *(e2e/specs/07-battery.spec.ts)*
25. ❌ **TC-31 放电记录字段：放电时长、无消耗电量** *(e2e/specs/07-battery.spec.ts)*
26. ❌ **TC-32 充放电记录均有时间筛选** *(e2e/specs/07-battery.spec.ts)*

### 08-行程管理
27. ❌ **TC-33 行程列表起终点默认隐藏** *(e2e/specs/08-trips.spec.ts)*
28. ❌ **TC-34 行程详情页无开始时间/到达时间/预警次数** *(e2e/specs/08-trips.spec.ts)*

### 09-维修管理
29. ❌ **TC-35 新建维修弹窗中维修描述为下拉选择** *(e2e/specs/09-repair.spec.ts)*
30. ❌ **TC-36 维修列表有时间筛选** *(e2e/specs/09-repair.spec.ts)*
31. ❌ **TC-37 操作列有"完成维修"按钮** *(e2e/specs/09-repair.spec.ts)*

### 10-车辆信号数据
32. ❌ **TC-38 树状结构仅2个租户层级，展示车牌号** *(e2e/specs/10-vehicle-signal.spec.ts)*
33. ❌ **TC-39 右侧列表有车牌号列** *(e2e/specs/10-vehicle-signal.spec.ts)*
34. ❌ **TC-40 导出按钮在页面右上方** *(e2e/specs/10-vehicle-signal.spec.ts)*
35. ❌ **TC-42 筛选项有标签名称** *(e2e/specs/10-vehicle-signal.spec.ts)*
36. ❌ **TC-43 信号分组选择与全选** *(e2e/specs/10-vehicle-signal.spec.ts)*

### 11-数据导出记录
37. ❌ **TC-44 导出记录表无筛选条件摘要列** *(e2e/specs/11-data-export.spec.ts)*

### 12-系统管理
38. ❌ **TC-45 用户/角色为独立菜单，无 tab 切换** *(e2e/specs/12-system.spec.ts)*
39. ❌ **TC-47 导出按钮文字为"导出 CSV"** *(e2e/specs/12-system.spec.ts)*

---

## 3. 通过的测试用例 (4个)
1. ✅ **[setup] authenticate via login form** *(e2e/auth.setup.ts)*
2. ✅ **TC-03 登录无强制修改密码弹窗** *(e2e/specs/01-global.spec.ts)*
3. ✅ **TC-41 上报时间无排序** *(e2e/specs/10-vehicle-signal.spec.ts)*
4. ✅ **TC-46 角色管理页面权限使用中文** *(e2e/specs/12-system.spec.ts)*

---

## 4. 下一步建议
大量用例在加载页面列表元素 `table` 时发生了超时 (`TimeoutError: page.waitForSelector: Timeout 10000ms exceeded. waiting for locator('table')`)。
**建议优先排查以下几点：**
1. **网络请求拦截**：确保 E2E 环境下后端的接口调用能正常返回（使用 Mock 工具拦截器或真实测试数据库）。
2. **鉴权状态传递**：虽然登录 setup 成功了，但确保存储的 auth 状态正确传递给其他测试上下文。
3. **选择器优化**：个别因为具体文案报错的（例如找不到文字为“导出 CSV”的按钮），可以去对应的页面检查当前渲染的实际 DOM 结构或国际化是否已生效。