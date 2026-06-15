# SPEC — 苇渡车队 V1.2 脱敏及日志审计

**基线版本**: V1.0（当前 `weidu-fleet` 代码库）
**目标版本**: V1.2
**PRD 文档**: `苇渡智利车队PRD_V1.2_脱敏及日志审计.md`

---

## 1. 变更范围总览

本版本仅包含 **3 类需求**，其他所有功能、字段、布局维持 V1.0 基线不变。

| 序号 | 需求 | 类型 | 涉及文件（预计） |
|------|------|------|-----------------|
| S1 | 全局 VIN/车牌脱敏 | 优化 | `utils/mask.ts`(新), 所有展示 VIN/车牌的页面组件 |
| S2 | 地理位置精度限制为街道级 | 优化 | `utils/address.ts`(新), 所有展示地址的页面组件 |
| S3 | 轨迹存储时效 10 天限制 | 优化 | `pages/Trips.tsx`, `pages/Vehicles/TripTable.tsx`, `pages/Monitor.tsx` |
| S4 | 日志审计模块 | 新增 | `pages/AuditLog.tsx`(新), `api/mock.ts`, `App.tsx`, `components/Layout/Sidebar.tsx`, `types/index.ts`, `i18n/zh.ts` |

**红线约束**:
- 不改动任意页面中未涉及上述 4 项需求的功能逻辑
- 不改动未经 V1.2 PRD 提及的字段名、列名、按钮名
- 数据导出（Excel/CSV）不执行脱敏
- 如有疑问，先与 PM 确认后再改

---

## 2. S1 — 全局 VIN / 车牌脱敏

### 2.1 脱敏工具函数

新建 `src/utils/mask.ts`:

```ts
/**
 * VIN 脱敏：保留前 6 位 + 后 4 位，中间 7 位替换为 *
 * 示例：LSG4AA123456789AB → LSG4AA*******9AB
 */
export function maskVin(vin: string): string {
  if (!vin || vin.length < 11) return vin || '';
  return vin.slice(0, 6) + '*******' + vin.slice(vin.length - 4);
}

/**
 * 车牌脱敏：首尾各保留 2 位，中间替换为 *
 * 示例：ABCD12 → AB**12
 */
export function maskPlate(plate: string): string {
  if (!plate || plate.length < 5) return plate || '';
  return plate.slice(0, 2) + '**' + plate.slice(plate.length - 2);
}
```

### 2.2 脱敏规则

| 字段 | 原始 | 脱敏后 | 查询行为 |
|------|------|--------|---------|
| VIN | 17 位 | 前 6 + `*******` + 后 4 | 支持明文/部分字符模糊检索 |
| 车牌 | 6~8 位 | 前 2 + `**` + 后 2 | 支持明文/部分字符模糊检索 |

### 2.3 脱敏生效范围

**前端展示界面的以下位置须脱敏**:

| 页面/组件 | 涉及 VIN | 涉及车牌 | 文件 |
|-----------|---------|---------|------|
| 首页看板 — 排行榜 | | 车牌号 | `Dashboard.tsx` |
| 首页看板 — 地图气泡 | Y | Y | `Dashboard.tsx` |
| 车辆列表 | Y | Y | `Vehicles.tsx`（ListView） |
| 车辆详情 — 车辆信息 / 设备信息 | Y | Y | `Vehicles.tsx`（DetailView） |
| 车辆详情 — 各 Tab 表格内 | Y | Y | `AlertTable, DrivingTable, BatteryTable, ChargeTable, TripTable, RepairTable` |
| 围栏管理 — 车辆配置 | Y | Y | `Fence.tsx` |
| 围栏管理 — 添加车辆弹窗 | Y | Y | `Fence.tsx` |
| 风控预警 — 围栏/故障/电池报警列表 | Y | Y | `Risk.tsx` |
| 驾驶行为 — 驾驶预警/驾驶报告 | Y | Y | `Driving.tsx` |
| 电池管理 — 监控/充放电列表 | Y | Y | `Battery.tsx` |
| 行程管理 — 列表及详情 | Y | Y | `Trips.tsx` |
| 维修管理 — 列表及详情弹窗 | Y | Y | `Repair.tsx` |
| 实时监控 — 车辆列表/地图气泡 | Y | Y | `Monitor.tsx` |
| 租户管理/业务管理 | Y | Y | `Tenant.tsx`, `Biz.tsx` |
| 系统管理 — 用户/角色 | Y | Y | `Sys.tsx` |
| 车辆信号数据 — 树/列表 | Y | Y | `VehicleTreeComponent.tsx`, `DataGridComponent.tsx` |

**不上脱敏的范围**（PRD 明确排除）:
- 数据导出（CSV / Excel）的 VIN、车牌保持明文
- 车辆信号数据导出（`VehicleSignal.tsx` 导出）保持明文
- 导入模板中的 VIN 列须使用明文（后台校验用）

### 2.4 查询/搜索兼容

所有含 VIN/车牌搜索框的页面，搜索逻辑保持 `String.includes`（模糊匹配），无论用户输入的是脱敏值还是明文值，均可命中结果。

> 前端搜索时不再直接比对脱敏展示值，而是先将用户输入与原始 `mockData` 中的明文字段做 `includes` 匹配，再在渲染层统一脱敏。

### 2.5 实现方案

**方案**: 每个需要脱敏的渲染位置单独调用 `maskVin()` / `maskPlate()`，**不改动 mock 数据源和类型定义**。

优点:
1. 原始数据不变（搜索、导出用的仍是明文）
2. 脱敏只在 UI 渲染层生效
3. 最小改动范围，不对数据结构产生破坏性变更

---

## 3. S2 — 地理位置显示精度限制为街道级

### 3.1 当前基线行为

V1.0 中 `LocationPrivacy` 组件：
- 默认显示"查看位置"
- 点击后展示完整地址（如 `智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号`）

### 3.2 V1.2 变更

全局所有逆地址解析的**展示精度**限制在**街道/路口级**。

**街道级地址示例**:
| 原始完整地址 | 街道级展示 |
|-------------|-----------|
| 智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号 | 智利圣地亚哥阿乌马达步行街 |
| 智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号 | 智利瓦尔帕莱索港码头大道 |
| 智利马伊普区工业大道5500号 | 智利马伊普区工业大道 |

### 3.3 地址截断工具函数

新建 `src/utils/address.ts`:

```ts
/**
 * 将完整地址截断至街道级（去除门牌号等精确信息）
 * 规则：从后往前找到第一个数字（门牌号）并截断
 * 兼容中英文地址格式
 */
export function truncateToStreetLevel(address: string): string {
  if (!address) return '';
  // 匹配末尾的数字或门牌/号结尾的部分
  // 中文地址：XX路XX号、XX街XX号、XX大道XX号 → 保留到路/街/大道
  // 英文地址：XX Street 123, XX Ave 456 → 保留到 Street/Ave
  const trimmed = address
    .replace(/(\d+)(号|楼|栋|层|室|房|\s*$).*/g, '')
    .replace(/(\d+).*$/, '')
    .replace(/\s*no\.?\s*\d+.*$/i, '')
    .trim();
  return trimmed || address;
}
```

### 3.4 修改 `LocationPrivacy` 组件

在 `src/components/LocationPrivacy.tsx` 中，点击展示地址前先调用 `truncateToStreetLevel()`:

```ts
// 新增 import
import { truncateToStreetLevel } from '@/utils/address';

// 组件内改
const displayText = truncateToStreetLevel(text);
```

所有使用 `<LocationPrivacy>` 的位置（约 6 个页面 × 多处）自动生效，无需逐个修改调用方。

### 3.5 生效范围

`LocationPrivacy` 用于以下位置（全自动继承街道级截断）:

| 页面 | 使用位置 |
|------|---------|
| 车辆列表 | 最后位置列 |
| 车辆详情 | 最后位置字段 |
| 行程列表 | 起点、终点列 |
| 行程详情 | 起点、终点字段 |
| 风控预警 | 围栏报警位置列 |
| 驾驶预警 | 预警位置列 |

---

## 4. S3 — 行驶轨迹存储时效 10 天限制

### 4.1 数据清理策略（后端侧说明）

| 策略项 | 规则 |
|--------|------|
| 存储周期 | 最近 10 天（10 × 24h）GPS 打点原始数据 |
| 清理机制 | 每日凌晨定时任务，物理清除超过 10 天的轨迹打点 |
| 清理范围 | 仅轨迹打点数据（`TrajectoryPoint`），不删行程记录（`TripDetail`）本身 |

### 4.2 前端变更 — 轨迹回放（Monitor.tsx）

**时间选择器限制**:
- 可选的起始日期 = 当前时间 − 10 天
- 超过 10 天的日期置灰不可选
- 单次查询跨度最大 3 天

**实现**：利用 antd `DatePicker` 的 `disabledDate` 属性：

```tsx
disabledDate={(date) => {
  const tenDaysAgo = dayjs().subtract(10, 'day');
  return date.isBefore(tenDaysAgo, 'day') || date.isAfter(dayjs(), 'day');
}}
```

**跨天限制**: 在选择结束日期时校验 span ≤ 3 天，超限时 `message.warning('单次查询跨度最大3天')`。

### 4.3 前端变更 — 行程记录 Tab（Vehicles/TripTable）

以 `Vehicles/TripTable.tsx` 中端点时间 `end` 为依据：
- 如果 `dayjs().diff(dayjs(row.end), 'day') > 10` → 轨迹查看按钮 `disabled`，tooltip 文案: `根据隐私及存储策略，该行程的历史轨迹数据已过保存时效`
- 否则按钮可交互

同样逻辑在 `pages/Trips.tsx` 详情页右侧地图区域应用：
- 如果超过 10 天 → 显示遮罩文案: `由于轨迹数据存储时效限制，该段历史轨迹已自动清除`

### 4.4 涉及文件

| 文件 | 变更 |
|------|------|
| `pages/Monitor.tsx` | 轨迹回放 DatePicker 加 `disabledDate` + 跨度校验 |
| `pages/Vehicles/TripTable.tsx` | 超过 10 天按钮置灰 |
| `pages/Trips.tsx` | 详情页地图区超过 10 天显示遮罩 |

---

## 5. S4 — 日志审计模块（V1.2 新增）

### 5.1 菜单位置

在系统管理（`menu.sys`）下新增独立菜单项:

```
侧边栏
├── 用户管理      → /sys/users
├── 角色管理      → /sys/roles
└── 日志审计      → /audit-log    ← 新增
```

### 5.2 页面规格

新建 `src/pages/AuditLog.tsx`：

**查询筛选项**:

| 筛选字段 | 控件 | 约束 |
|---------|------|------|
| 操作账号 | `Input` | 最多 50 字符，模糊匹配邮箱 |
| 操作类型 | `Select` (多选) | 枚举值动态加载 |
| 操作时间范围 | `DatePicker.RangePicker` | 最长跨度 180 天，仅可查过去 180 天数据 |
| 操作结果 | `Select` (单选) | 全部 / 成功 / 失败 |

**列表字段**:

| 列名 | 数据来源 | 格式/示例 |
|------|---------|----------|
| 序号 | 自动递增 | 1, 2, 3... |
| 操作时间 | `createdAt` | `2026-06-12 14:30:05`（Santiago 时区） |
| 操作人昵称 | `nickname` | 张三 |
| 操作账号 | `email` | `a***@wind-v.com`（邮箱脱敏） |
| 所属租户 | `tenantName` | 智利物流集团 |
| 操作IP | `ip` | `192.168.1.100` |
| 操作类型 | `type` | `系统管理-用户管理` |
| 事件描述 | `description` | `用户 a***@wind-v.com 新建了围栏 [xxx]`（VIN/车牌脱敏显示） |
| 操作结果 | `result` | `成功`（绿色） / `失败`（红色，hover 显示错误原因） |

**分页**：默认 20 条，支持 10/20/50/100 切换。

### 5.3 审计事件采集范围

| 分类 | 操作类型枚举值 |
|------|---------------|
| 安全与账户 | `账号登录`、`账号退出`、`修改密码`、`重置密码` |
| 租户/权限 | `新增租户`、`编辑租户`、`删除租户`、`配置功能权限`、`新增用户`、`编辑用户`、`删除用户`、`新增角色`、`编辑角色`、`删除角色` |
| 资产与车辆 | `同步资产`、`资产划拨`、`删除资产`、`批量导入车辆` |
| 围栏管理 | `新建围栏`、`编辑围栏`、`删除围栏`、`围栏启用`、`围栏停用`、`添加车辆`、`移除车辆` |
| 维修与服务 | `新建维修`、`一键报修`、`完成维修`、`删除维修` |
| 数据与导出 | `车辆信号数据导出`、`下载导出文件` |

### 5.4 Mock 数据

在 `src/api/mock.ts` 中新增函数:

```ts
export function getAuditLogs(): AuditLogEntry[] { ... }
```

生成至少 20 条 mock 数据，覆盖所有操作类型。

### 5.5 类型定义

在 `src/types/index.ts` 中新增:

```ts
export interface AuditLogEntry {
  id: string;
  createdAt: string;
  nickname: string;
  email: string;
  tenantName: string;
  ip: string;
  type: string;
  description: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}
```

### 5.6 数据保留

日志数据保留 **180 天**，筛选项最大查询跨度也是 **180 天**。

### 5.7 国际化

在 `src/i18n/zh.ts` / `i18n/en.ts` / `i18n/es.ts` 中新增:

```ts
// 菜单
'menu.audit_log': '日志审计',
'sidebar.audit_log': '日志审计',
'title.audit_log': '日志审计',

// 表格列
'audit.time': '操作时间',
'audit.nickname': '操作人昵称',
'audit.email': '操作账号',
'audit.tenant': '所属租户',
'audit.ip': '操作IP',
'audit.type': '操作类型',
'audit.description': '事件描述',
'audit.result': '操作结果',
'audit.result.success': '成功',
'audit.result.failure': '失败',

// 筛选
'audit.filter.account': '操作账号',
'audit.filter.type': '操作类型',
'audit.filter.time': '操作时间范围',
'audit.filter.result': '操作结果',
```

### 5.8 路由变更

`src/App.tsx` 新增路由:

```tsx
<Route path="audit-log" element={<AuditLog />} />
```

### 5.9 侧边栏变更

`src/components/Layout/Sidebar.tsx` 新增菜单项（与 `用户管理`、`角色管理` 并列）。

---

## 6. 不改动清单（明确排除）

以下 V1.0 功能**不在本次变更范围内**，一律不碰：

| 功能 | 原因 |
|------|------|
| 字段列名、按钮文案 | PRD 未要求 |
| 图表形式（折线/柱状/饼图） | PRD 未要求 |
| 首页指标卡片数量/内容 | PRD 仅要求脱敏，不增删指标 |
| 维修描述下拉枚举 | PRD 未要求 |
| 驾驶报告筛选/统计规则 | PRD 未要求 |
| 信号分组/树结构 | PRD 未要求 |
| 导出格式（CSV/XLSX） | PRD 仅要求导出不脱敏 |
| 语言切换 | PRD 未要求 |
| LocationPrivacy 展开/收起交互 | PRD 仅要求精度降级，交互不变 |
| i18n 中 EN/ES 文案 | PRD 以 zh 为基准，EN/ES 仅同步新增的 audit 词条 |

---

## 7. 文件变更汇总

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `src/utils/mask.ts` | `maskVin()` + `maskPlate()` |
| **新增** | `src/utils/address.ts` | `truncateToStreetLevel()` |
| **新增** | `src/pages/AuditLog.tsx` | 日志审计页面 |
| **修改** | `src/components/LocationPrivacy.tsx` | 集成 `truncateToStreetLevel` |
| **修改** | `src/App.tsx` | 新增 `/audit-log` 路由 |
| **修改** | `src/components/Layout/Sidebar.tsx` | 新增日志审计菜单项 |
| **修改** | `src/api/mock.ts` | 新增 `getAuditLogs()` + 现有数据覆盖脱敏不影响搜索 |
| **修改** | `src/types/index.ts` | 新增 `AuditLogEntry` 接口 |
| **修改** | `src/i18n/zh.ts` | 新增 audit 相关词条 |
| **修改** | `src/i18n/en.ts` | 同步新增 audit 词条（English） |
| **修改** | `src/i18n/es.ts` | 同步新增 audit 词条（Spanish） |
| **修改** | `src/pages/Dashboard.tsx` | map 气泡 VIN/车牌脱敏 |
| **修改** | `src/pages/Vehicles.tsx` | 列表+详情 VIN/车牌脱敏 |
| **修改** | `src/pages/*/*Table.tsx`（6个） | 各 Tab 表格 VIN/车牌脱敏 |
| **修改** | `src/pages/Fence.tsx` | 车辆配置 VIN/车牌脱敏 |
| **修改** | `src/pages/Risk.tsx` | 报警列表 VIN/车牌/地址脱敏 |
| **修改** | `src/pages/Driving.tsx` | 预警+报告 VIN/车牌脱敏 |
| **修改** | `src/pages/Battery.tsx` | 监控+充放电列表 VIN/车牌脱敏 |
| **修改** | `src/pages/Trips.tsx` | 列表+详情 VIN/车牌/地址脱敏 + 轨迹遮罩 |
| **修改** | `src/pages/Repair.tsx` | 列表+弹窗 VIN/车牌脱敏 |
| **修改** | `src/pages/Monitor.tsx` | 地图气泡脱敏 + 轨迹回放 10 天限制 |
| **修改** | `src/pages/Tenant.tsx` | 列表 VIN/车牌脱敏 |
| **修改** | `src/pages/Biz.tsx` | 资产列表 VIN/车牌脱敏 |

| **新增** | `src/__tests__/mask.test.ts` | 单元测试：脱敏函数覆盖率 100% |
| **新增** | `src/__tests__/address.test.ts` | 单元测试：地址截断 |
| **修改** | `src/__tests__/mock-data.test.ts` | 新增 `getAuditLogs` 数据完整性校验 |
