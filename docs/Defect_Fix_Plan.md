# 苇渡·智利车队管理平台 — 缺陷修复计划

> 基于最终验收报告 `docs/Acceptance_Report_Final.md`
> 共 17 项缺陷：🔴 P0 × 5 ｜ 🟡 P1 × 6 ｜ 🟢 P2 × 6

---

## 🔴 P0 阻断缺陷（必须修复，阻断发布）

### P0-1 · 导出任务状态机严重缺失

| 项 | 内容 |
|---|------|
| 现状 | `ExportRecordComponent.tsx` 仅 2 状态（processing/completed），无已失败/已过期；下载仅 `console.log`；无预估接口；无过期字段 |
| Spec 要求 | §3.5 四状态（处理中/已完成/已失败/已过期）+ 7天过期 + `/exports/estimate` 预估接口 + 下载二次校验 |
| 涉及文件 | `src/types/index.ts`（ExportTask 类型）、`src/components/VehicleData/ExportRecordComponent.tsx`、`src/pages/DataExport.tsx`、`src/pages/VehicleSignal.tsx`、`src/api/mock.ts` |
| 修复步骤 | ① types ExportTask 增加 `failed`/`expired` 状态 + `expiredAt` 字段<br>② ExportRecordComponent 状态标签补 4 色（处理中蓝/已完成绿/已失败红/已过期灰）<br>③ 下载按钮 onClick 实现实际下载（`window.open(fileUrl)` 或 `<a download>`）<br>④ mock 层补 `estimateExportRows(filters)` 函数返回 `{estimatedRows, allowed}`<br>⑤ VehicleSignal 导出按钮点击 → 先调 estimate → allowed=false 弹窗拦截 → allowed=true 调创建接口<br>⑥ mock 层补过期判定：`now > expiredAt && status===completed → status=expired` |
| 验收标准 | 四状态标签渲染正确；下载仅 completed+未过期可用；预估 >20万 拦截弹窗提示 |

### P0-2 · 资产划拨空壳

| 项 | 内容 |
|---|------|
| 现状 | `Biz.tsx` 划拨 Modal 无 `onOk`，租户 Select 无 `onChange`，单条/批量划拨不更新 `tenant_id` |
| Spec 要求 | §3.3 划拨更新 `assets.tenant_id` + 写 `asset_transfer_records` |
| 涉及文件 | `src/pages/Biz.tsx`、`src/api/mock.ts`、`src/types/index.ts` |
| 修复步骤 | ① Biz.tsx 划拨 Modal 增加 `selectedTenantId` state + Select `onChange`<br>② Modal `onOk` → 调 `transferAsset(vin, tenantId)` 或 `batchTransferAssets(vins[], tenantId)`<br>③ mock 层新增 `transferAsset`/`batchTransferAssets`：更新 `asset.tenantId` + 推入 `transferRecord`<br>④ 批量划拨未勾选时 `message.warning('请选择指定数据操作')`<br>⑤ 划拨后刷新资产列表 |
| 验收标准 | 划拨后资产归属租户更新；划拨记录列表新增一条；批量划拨多车生效 |

### P0-3 · 租户服务到期完全缺失

| 项 | 内容 |
|---|------|
| 现状 | 无 `isExpired` 逻辑，到期租户仍可操作 |
| Spec 要求 | §3.8 登录默认选最近未过期租户；Topbar 到期标签；写操作拦截 403 |
| 涉及文件 | `src/types/index.ts`、`src/store/useAppStore.ts`、`src/api/mock.ts`、`src/components/Layout/Topbar.tsx`（或等效组件）、`src/api/client.ts`（拦截器） |
| 修复步骤 | ① types Tenant 增加 `serviceExpireAt?: string` + `isExpired?: boolean`<br>② mock 层 `getMyTenants` 返回 `isExpired`（`now > serviceExpireAt` 或祖先到期）<br>③ useAppStore 登录后选租户逻辑：最近租户 isExpired → 选下一个未过期<br>④ Topbar 租户列表 isExpired=true 显示「服务过期」标签 + 置灰不可选<br>⑤ api/client.ts 响应拦截器：403 + message 含"服务已过期" → toast 提示 + 阻断操作 |
| 验收标准 | 到期租户 Topbar 置灰+标签；切换到期租户被拒；写操作返回 403 提示 |

### P0-4 · 强制改密未消费

| 项 | 内容 |
|---|------|
| 现状 | `mustChangePassword` 仅 types 定义，Login 页无拦截逻辑 |
| Spec 要求 | §2.2 mustChangePassword=true → 前端拦截进入主界面，强制弹出改密弹窗且不可关闭 |
| 涉及文件 | `src/pages/Login.tsx`、`src/App.tsx`、`src/components/Layout/AppLayout.tsx`（或等效） |
| 修复步骤 | ① Login 登录成功后检查 `user.mustChangePassword`<br>② 若 true → 不跳转 dashboard，改为渲染 `<ChangePasswordModal closable={false} />`<br>③ 改密成功 → 更新 `user.mustChangePassword=false` → 跳转 dashboard<br>④ AppLayout 增加 guard：`user.mustChangePassword === true` → 重定向到改密页 |
| 验收标准 | 初始密码登录后强制弹改密窗且不可关闭；改密成功后正常进入系统 |

### P0-5 · 围栏新建默认状态错误

| 项 | 内容 |
|---|------|
| 现状 | `Fence.tsx:225` 新建围栏 `status: '生效中'`，Spec 要求默认"未生效" |
| Spec 要求 | §3.2 新建围栏 → status=未生效（默认） |
| 涉及文件 | `src/pages/Fence.tsx` |
| 修复步骤 | ① Fence.tsx 新建提交时 `status: '未生效'`（而非 `'生效中'`）<br>② 同时补关闭 toggle 二次确认（P1-2 联动）<br>③ 函数内部补 status 守卫：`handleDeleteFence`/`handleOpenEdit` 内增加 `if (record.status === '生效中') { message.warning('请先关闭围栏'); return; }` |
| 验收标准 | 新建围栏默认"未生效"；生效中围栏编辑/删除被函数级拦截 |

---

## 🟡 P1 缺陷（应修复，影响体验）

### P1-1 · Login 表单校验缺失
- **文件**：`src/pages/Login.tsx`
- **修复**：email 加 `required: true` + `type: 'email'`；password 加 `required: true` + `min: 8 max: 18`；验证码加输入匹配校验
- **验收**：空提交飘红提示；非邮箱格式飘红；验证码错误提示

### P1-2 · 围栏关闭 toggle 无二次确认
- **文件**：`src/pages/Fence.tsx`
- **修复**：`handleToggleStatus` 关闭时用 `Modal.confirm({ title: '确认关闭围栏？' })` 包裹
- **验收**：关闭弹二次确认，取消不关闭

### P1-3 · 状态校验仅在 UI 层（API/函数无守卫）
- **文件**：`src/api/mock.ts`（completeRepairItem）、`src/pages/Fence.tsx`（handleDeleteFence/handleOpenEdit）
- **修复**：mock 层 `completeRepairItem` 增 `if (item.status !== '维修中') throw`；Fence 函数体内增 status 守卫
- **验收**：绕过 UI 直接调 API 时非法流转被拒

### P1-4 · 维修删除未持久移除
- **文件**：`src/pages/Repair.tsx:102`、`src/api/mock.ts`
- **修复**：新增 `deleteRepairItem(id)` mock 函数从 `repairData` 数组移除；Repair.tsx `handleDelete` 调用之
- **验收**：删除后刷新页面不复活

### P1-5 · es.ts 西班牙语未注册
- **文件**：`src/i18n/index.ts`
- **修复**：`import es from './es'` + `resources: { zh, en, es }`；补齐 es.ts 缺失的 6 个 key
- **验收**：语言切换可选西语

### P1-6 · 低电预警用 soc≤20 阈值而非按预警类型计数
- **文件**：`src/api/mock.ts`（getDashboardStats）、`src/pages/Dashboard.tsx`
- **修复**：低电预警数 = `batteryAlerts.filter(a => a.type === 'SOC_LOW' && isToday(a.createdAt)).length`，而非 `vehicles.filter(v => v.soc <= 20).length`
- **验收**：首页低电预警数与电池预警页 SOC_LOW 计数一致

---

## 🟢 P2 改进项（后续迭代）

| # | 缺陷 | 修复方向 |
|---|------|---------|
| P2-1 | API 层纯 Mock，无真实接口契约 | 按模块拆分 `src/api/{vehicles,risk,driving,...}.ts`，对接真实后端 |
| P2-2 | Store 单一未模块化 | 按业务域拆分 `useVehicleStore`/`useRiskStore`/... |
| P2-3 | 主 chunk >500KB | xlsx 动态 import；路由级 code-splitting 已有，补 manualChunks |
| P2-4 | 状态值中英混用 | 统一用 Spec 存储码（IN_PROGRESS/COMPLETED/PENDING），前端 i18n 渲染 |
| P2-5 | 资产 device 检查硬编码 VIN | 改为 `asset.deviceId !== null` 动态判断 |
| P2-6 | Sys.tsx 删除按钮恒禁用 | 检查 `disabled` 条件，应为 `record.role === 'Admin'` 而非无条件 |

---

## 修复排期建议

| 优先级 | 批次 | 缺陷项 | 预估改动 |
|--------|------|--------|---------|
| **第一批** | P0-1 ~ P0-5 | 5 项阻断 | 导出状态机重构 + 资产划拨补全 + 租户到期新增 + 改密拦截 + 围栏默认值 |
| **第二批** | P1-1 ~ P1-6 | 6 项体验 | Login 校验 + 围栏确认 + API 守卫 + 删除持久化 + es 注册 + 低电预警口径 |
| **第三批** | P2-1 ~ P2-6 | 6 项改进 | API 重构 + Store 拆分 + 性能优化 + 枚举统一 |

> 第一批修复完成后需重新执行完整验收（7 维度），P0 全部清零后方可发布。
