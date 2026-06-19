# 苇渡·智利车队管理平台 — 第二轮验收报告（修复后复验）

> 验收对象：weidu-fleet 前端项目（修复后复验）
> 验收依据：PRD V6 + SPEC_V6.md（V6.4）+ 缺陷修复计划 `docs/Defect_Fix_Plan.md`
> 验收时间：2026-06-19
> 上一轮验收：`docs/Acceptance_Report_Final.md`（5 项 P0 + 6 项 P1 + 6 项 P2）

---

## 一、静态检查 ❌ 未通过

| 检查项 | 命令 | 结果 |
|--------|------|------|
| TypeScript 类型检查 | `npx tsc -b --noEmit` | ❌ **20 个错误**（全在 `src/api/mock.ts`） |
| Vite 生产构建 | `npx vite build` | ✅ **11.86s 构建成功**（Vite 不做类型检查，故通过） |

### TS 错误明细

| 错误码 | 数量 | 根因 |
|--------|------|------|
| TS2304: Cannot find name 'getFilteredVehicles' | 10 处 | mock.ts 第 8 行 `export { ... } from './vehicles'` 是纯 re-export，**不创建模块内绑定**，内部 12 处调用 `getFilteredVehicles(false)` 找不到该函数 |
| TS7006: Parameter implicitly has 'any' type | 10 处 | 连锁错误，因 `getFilteredVehicles` 返回类型未知，`.map((v, i) => ...)` 中 `v`/`i` 隐式 any |

**修复方法**：mock.ts 第 3 行改为 `import { tenantHierarchy, getFilteredVehicles } from './vehicles';`

---

## 二、动态检查 ❌ 未通过

| 检查项 | 命令 | 结果 |
|--------|------|------|
| Vitest 单元测试 | `npx vitest run --dir src/__tests__` | ❌ **15 failed / 22 passed**（上一轮 37/37 全通过） |

### 回归明细

15 个失败用例全部因 `ReferenceError: getFilteredVehicles is not defined`，影响测试文件：
- `mock-data.test.ts`（12 个用例失败）—— Dashboard 统计、风险排行、行程、风控预警、驾驶预警、驾驶报告、电池监控、充放电、围栏、维修、故障预警、电池预警
- `DashboardMetrics.test.tsx`（1 个失败）
- `FenceVehicleSearch.test.tsx`（1 个失败）
- `VehicleData.integration.test.tsx`（1 个失败）

**根因同上**：mock.ts re-export 未 import，模块内调用崩溃。

---

## 三、P0 缺陷修复验收

| # | 缺陷 | 结论 | 证据 |
|---|------|------|------|
| P0-1 | 导出任务状态机 | ✅ **已修复** | types 有 4 状态+expiredAt；ExportRecordComponent 渲染 4 色标签；下载用 `<a download>` 实现真实下载；estimateExportRows 预估接口+>20万拦截；过期判定 `now > expiredAt` |
| P0-2 | 资产划拨 | ✅ **已修复** | Biz.tsx Modal onOk 调 transferAsset/batchTransferAssets；mock 更新 `asset.tenant`；划拨后 `setAssets(getAssetItems())` 刷新 |
| P0-3 | 租户服务到期 | ⚠️ **部分修复** | Topbar 过期标签✅ + 切换拦截✅ + 登录跳过✅；但 `expired` 为硬编码布尔值，**缺 isExpired 自动计算**（不会基于 expireDate 随时间更新） |
| P0-4 | 强制改密 | ⚠️ **部分修复** | Login 检测 mustChangePassword + 不可关闭弹窗✅；但 **AppLayout 无 guard**，URL 直接访问受保护路由可绕过 |
| P0-5 | 围栏默认状态 | ✅ **已修复** | 新建默认 'inactive'；关闭有 Modal.confirm 二次确认；handleDeleteFence/handleOpenEdit 函数内有 status 守卫 |

---

## 四、P1 缺陷修复验收

| # | 缺陷 | 结论 | 证据 |
|---|------|------|------|
| P1-1 | Login 表单校验 | ✅ **已修复** | email required+type:'email'；password required+min:8/max:18；验证码 toUpperCase 比对 |
| P1-2 | 围栏关闭二次确认 | ✅ **已修复** | handleToggleStatus 关闭时 Modal.confirm |
| P1-3 | API/函数状态守卫 | ✅ **已修复** | mock completeRepairItem `if (status !== 'repairing') throw`；Fence 函数内 status 守卫 |
| P1-4 | 维修删除持久化 | ✅ **已修复** | mock deleteRepairItem 从数组 filter 移除；Repair.tsx 调用之 |
| P1-5 | es.ts 西班牙语注册 | ✅ **已修复** | i18n/index.ts import es + resources 注册 |
| P1-6 | 低电预警口径 | ✅ **已修复** | getDashboardStats 改为 `batteryAlerts.filter(a => a.type === 'SOC过低')` 计数 |

---

## 五、回归检查 ❌ 严重回归

| 检查项 | 上一轮 | 本轮 | 变化 |
|--------|--------|------|------|
| TypeScript 类型检查 | ✅ 0 错误 | ❌ 20 错误 | 🔴 回归 |
| 单元测试 | ✅ 37/37 | ❌ 22/37（15 失败） | 🔴 回归 |
| Vite 构建 | ✅ 4.63s | ✅ 11.86s | ✅ 通过 |
| 脱敏体系 | ✅ 89 处 | ✅ 保持 | ✅ 无回归 |
| i18n 中英文 | ✅ 500 keys | ✅ +es 494 keys | ✅ 增强 |

**回归根因**：用户在修复过程中将 mock 数据拆分到模块化文件（vehicles.ts/trips.ts/audit.ts），通过 `export { ... } from './vehicles'` re-export，但 mock.ts 内部函数直接调用 `getFilteredVehicles(false)` 时，因 ES Module 规范 `export...from` 不创建模块内绑定，导致 `ReferenceError`。

---

## 六、验收总结

### 修复完成度

| 类别 | 总数 | 完全修复 | 部分修复 | 未修复 |
|------|------|---------|---------|--------|
| P0 阻断 | 5 | 3 | 2 | 0 |
| P1 体验 | 6 | 6 | 0 | 0 |
| P2 改进 | 6 | — | — | 未检查 |
| **合计** | **11** | **9** | **2** | **0** |

### 待修复项（3 项）

| 优先级 | 项 | 修复方法 |
|--------|---|---------|
| 🔴 **阻断** | mock.ts re-export 回归 | 第 3 行改为 `import { tenantHierarchy, getFilteredVehicles } from './vehicles';` |
| 🟡 P0 残留 | P0-3 isExpired 自动计算 | getTenantItems 中增加 `tenant.expired = tenant.expireDate ? new Date(tenant.expireDate) < new Date() : false` |
| 🟡 P0 残留 | P0-4 AppLayout guard | AppLayout useEffect 增加 `if (user?.mustChangePassword) navigate('/login')` |

### 验收结论

❌ **未通过验收**。虽然 11 项缺陷中 9 项完全修复、2 项部分修复，但修复过程引入了 **1 个严重回归 bug**（mock.ts getFilteredVehicles 未 import），导致：
- TypeScript 类型检查 20 个错误
- 单元测试 15 个失败（从 37/37 降到 22/37）
- 几乎所有依赖 mock 数据的页面在运行时会崩溃

**建议**：修复 mock.ts 第 3 行 import 后重新跑 tsc + vitest，同时补齐 P0-3/P0-4 两个残留项，即可通过验收。
