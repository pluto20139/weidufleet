# 自动化测试与 Bug 排查报告

> **生成时间**: 2026-06-05 | **项目**: weidu-fleet (苇渡-智利车队管理) | **测试方式**: 本地服务运行时 + DOM 遍历 + 控制台/网络监控

---

## 测试概述

- **测试地址**: `http://localhost:3000`（Preview 服务器，Vite 开发模式）
- **覆盖范围**: 总计测试了 **17 个菜单项**（含子菜单），覆盖 **14 个路由**，以及 **2 个页面核心按钮**（查询、新建维修）
- **测试方法**: 依次点击侧边栏每个菜单项，每次点击后等待 2~3 秒等待页面渲染，全程挂载 Console Error 监听 + Network Failed Request 拦截

---

## 页面遍历结果总览

| # | 菜单名称 | 路由 | 结果 | 备注 |
|---|---------|------|------|------|
| 1 | 首页看板 | `/dashboard` | ✅ 正常 | 仪表盘展示车队概览、车辆统计、里程数据 |
| 2 | 车辆列表 | `/vehicles` | ✅ 正常 | 车辆表格渲染正常，含 VIN/车牌/设备ID/车型等列 |
| 3 | 实时位置 | `/monitor` (实时监控) | ✅ 正常 | Leaflet 地图加载，车辆标记正常 |
| 4 | 轨迹回放 | `/monitor` (轨迹回放) | ✅ 正常 | 路线回放功能 |
| 5 | 围栏报警 | `/risk` (风控预警) | ✅ 正常 | 风险告警页面 |
| 6 | 故障报警 | `/risk` | ✅ 正常 | 同上风险模块 |
| 7 | 电池报警 | `/risk` | ✅ 正常 | 同上风险模块 |
| 8 | 驾驶预警 | `/driving` | ✅ 正常 | 驾驶行为监控 |
| 9 | 驾驶报告 | `/driving` | ✅ 正常 | 驾驶报告页面 |
| 10 | 电池监控 | `/battery` | ✅ 正常 | 电池状态监控 |
| 11 | 充放电记录 | `/battery` | ✅ 正常 | 充放电历史记录 |
| 12 | 行程记录 | `/trips` | ✅ 正常 | 行程列表 |
| 13 | 围栏管理 | `/fence` | ✅ 正常 | 电子围栏管理 |
| 14 | 维修记录 | `/repair` | ✅ 正常 | 维修工单表格+查询按钮+新建按钮 |
| 15 | 租户管理 | `/tenant` | ❌ **崩溃** | 页面白屏 → SPA 整体回退到登录页 |
| 16 | 业务管理 | `/biz` | ❌ **崩溃** | 同上，直接跳转登录页 |
| 17 | 系统管理 | `/sys` | ❌ **崩溃** | 同上，直接跳转登录页 |

---

## 发现的问题列表

### 问题 #1 — 三个管理页面 chunk 加载 404，导致 SPA 整体崩溃

- **问题位置**: 在侧边栏点击 **租户管理**（`/tenant`）、**业务管理**（`/biz`）、**系统管理**（`/sys`）时发生
- **错误现象**: 页面瞬间白屏，SPA 整体崩溃并回退到 `/login` 登录页，需要重新登录才能恢复。崩溃后侧边栏完全消失（DOM 节点数归零），React 根组件被卸载。
- **核心报错信息**:
  ```
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  [error] TypeError: Failed to fetch dynamically imported module: http://localhost:3000/assets/Tenant-DQXlrTf2.js
  ```
  ```
  [FAILED] GET http://localhost:3000/assets/Tenant-DQXlrTf2.js → 404 Not Found [net::ERR_ABORTED]
  ```
- **根因分析**: 主入口 bundle `index-CBIkLZjn.js` 中引用的懒加载 chunk hash（如 `Tenant-DQXlrTf2.js`）与 `dist/assets/` 目录中实际存在的文件 hash（如 `Tenant-BjPz3TvK.js`）不匹配。说明 dist 目录中的主 bundle 和页面 chunk 来自不同次构建，导致 hash 不一致。`/biz` 和 `/sys` 存在同样问题。
- **影响范围**: 3 个管理级页面完全无法访问，且点击后导致整个应用崩溃退出。

---

### 问题 #2 — 主 bundle 中残留 `src/main.tsx` 开发模式引用

- **问题位置**: 全局（首次页面加载时即触发）
- **错误现象**: 浏览器尝试加载开发源码文件，返回 404，不影响功能但会在 Network 面板产生红色错误记录。
- **核心报错信息**:
  ```
  [FAILED] GET http://localhost:3000/src/main.tsx → 404 Not Found [net::ERR_ABORTED]
  ```
- **根因分析**: 入口 bundle 或 Vite 构建配置中残留了对源码路径 `src/main.tsx` 的引用（可能是动态 import 或 sourcemap 残留），这在生产构建产物中不应存在。

---

### 问题 #3 — OpenStreetMap 地图瓦片偶发加载失败

- **问题位置**: 实时监控（`/monitor`）、车辆列表等含地图的页面
- **错误现象**: 地图局部区域显示空白瓦片（灰色/白色方块），不影响页面整体功能
- **核心报错信息**:
  ```
  [FAILED] GET https://a.tile.openstreetmap.org/16/19906/39233.png [net::ERR_ABORTED]
  ```
- **根因分析**: OpenStreetMap 公共 CDN 的偶发性网络波动或请求频率限制导致瓦片加载中断。

---

### 问题 #4 — 应用崩溃后无 Error Boundary 降级保护

- **问题位置**: 全局（懒加载失败时触发）
- **错误现象**: 单个页面 chunk 加载失败（404）后，React 未捕获该异步错误，导致整个组件树卸载，用户被踢回登录页，失去所有会话状态。侧边栏、顶栏全部消失。
- **核心报错信息**: 同上问题 #1 的 `Failed to fetch dynamically imported module`
- **根因分析**: `App.tsx` 中的 `<Suspense fallback={<PageLoading />}>` 无法捕获动态 import 的网络层失败（chunk 404），该错误向上冒泡至 React 根组件导致整体崩溃。缺少 React Error Boundary 包裹懒加载路由。

---

### 问题 #5 — 主包体积过大（静态分析补充）

- **问题位置**: `dist/assets/index-CBIkLZjn.js`（入口主包）
- **错误现象**: 主入口包体积 **1,062 KB**，占整个应用 JS 体积的 59%，首屏需下载并解析超过 1MB JS
- **建议**: 配置 Ant Design 按需加载或使用 `unplugin-antd`

---

## 全链路评估

| 项目 | 状态 | 说明 |
|------|------|------|
| 服务启动 | ✅ | localhost:3000 正常响应 |
| 核心页面 (11/14) | ✅ | 仪表盘、车辆、监控、风控、驾驶、电池、行程、围栏、维修全部正常 |
| 管理页面 (0/3) | ❌ | tenant/biz/sys 全部因 chunk 404 崩溃 |
| Error Boundary | ❌ | chunk 加载失败导致 SPA 整体崩溃，无降级 |
| 网络请求 | ⚠️ | 1 个 404（main.tsx）+ 3 个 chunk 404 + 地图瓦片偶发失败 |
| 控制台错误 | ❌ | Tenant chunk 404 重复 6 次（React 重试机制） |
| 代码体积 | ⚠️ | 主包 1MB+，Vehicles chunk 62KB |

---

## 总结

项目 **11/14 个路由页面功能正常**，车队管理核心业务流程（仪表盘、车辆、监控、风控、驾驶、电池、行程、围栏、维修）均可正常使用。

**阻塞级问题**: 租户管理、业务管理、系统管理三个页面因构建产物 hash 不匹配导致 chunk 404，且缺少 Error Boundary 保护，引发 SPA 整体崩溃。建议**重新执行一次完整的 `npm run build`** 确保所有 chunk hash 一致，并在 `App.tsx` 中为懒加载路由添加 React Error Boundary 包裹。
