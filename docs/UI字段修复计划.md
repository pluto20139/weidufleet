# 智利车队管理平台 — UI字段修复计划

> **生成日期**:2026-06-15
> **基线报告**:`UI字段检测报告.md`
> **排除范围**:模块1 登录校验、模块2 改密功能、模块4 业务管理 vs 系统管理结构归属(产品确认不调整)

---

## 修复范围总览

| 优先级 | 数量 | 说明 |
|--------|------|------|
| **P0** | 2 项 | 功能性缺陷(枚举对齐、检索失效) |
| **P1** | 13 项 | 与报告明确不符(状态文案/枚举/格式/数值边界) |
| **P2** | 4 项 | 缺失子功能/字段 |

**涉及文件预估**:约 10 个文件,每个改动约 3-15 行。

---

## P0 — 功能性缺陷(2 项)

### P0-1: 模块11 驾驶预警 — mock 数据 type 与渲染表/筛选下拉三处对不齐

**问题**:mock 数据 `type` 用 ADAS 代码(`FCW1`/`AEB_V`/`PCW2` 等),渲染表 `alertTypeLabels` 的 key 是 `Rapid Accel`/`Hard Brake` 等,筛选下拉 value 也是 `Rapid Accel` 等。三者互不匹配,导致列表显示原始代码、筛选失效。

**修复方案**:统一 mock 数据的 type 值为 `alertTypeLabels` 和筛选下拉使用的 key。

**文件 & 改动**:

| # | 文件 | 行号 | 改动内容 |
|---|------|------|---------|
| 1 | `src/api/mock.ts` | 165 | `alertTypes = ['FCW1', 'FCW2', 'AEB_V', 'PCW1', 'PCW2', 'AEB_P']` → `['Rapid Accel', 'Hard Brake', 'Sharp Turn', 'Fatigue', 'AEB', 'Rapid Accel']`(6项循环,与 `Driving.tsx:287-291` 下拉 value 对齐) |

> 注:渲染表 `alertTypeLabels`(Driving.tsx:39-45)和筛选下拉(Driving.tsx:287-291)不改,它们已经相互一致,只需让 mock 数据对齐即可。

**验证**:列表不再显示 `FCW1` 等原始代码,筛选下拉能正确过滤。

---

### P0-2: 全局检索 — `matchVinSearch`/`matchPlateSearch` 定义但全项目零调用

**问题**:脱敏匹配工具函数 `masking.ts:48-73` 已完整实现明文+脱敏模糊匹配,但全项目(Repair、AuditLog、Vehicles 等筛选处)均用裸 `includes`,对脱敏后的不可见字符无法命中。

**修复方案**:将各页面筛选处的裸 `includes` 替换为 `matchVinSearch`/`matchPlateSearch` 调用。

**文件 & 改动**:

| # | 文件 | 位置 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Repair.tsx` | 筛选函数(约 L55-57) | 车牌筛选从 `item.plate.toLowerCase().includes(plateFilter.toLowerCase())` → `matchPlateSearch(plateFilter, item.plate)` |
| 2 | `src/pages/AuditLog.tsx` | 筛选函数(约 L35) | 账号筛选若含 VIN/车牌匹配场景,同样替换;若无则不改(账号字段不涉及脱敏) |

> 注:需先 grep 确认所有使用裸 includes 做脱敏字段筛选的位置,确保不遗漏。`Vehicles.tsx` 和 `Trips.tsx` 若已用 `matchVinSearch/matchPlateSearch` 则不需改。

**验证**:输入脱敏后的可见字符(如 VIN 前 6 位)能正确匹配到数据。

---

## P1 — 与报告明确不符(14 项)

### P1-1: 模块9/10 — 报警状态中档 "已生成工单" → "维修中"

**问题**:故障报警(Risk.tsx faultTab)和电池报警(Risk.tsx batteryTab)的状态中档 `WorkOrder` 渲染为"已生成工单",报告要求"维修中"。

**修复方案**:将两处 statusMap 的 `WorkOrder` 显示文案改为"维修中"。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Risk.tsx` | 192 | `'WorkOrder': '已生成工单'` → `'WorkOrder': t('risk.repairing', '维修中')` |
| 2 | `src/pages/Risk.tsx` | 333-335 | batteryTab 同理,`'WorkOrder': '已生成工单'` → `'WorkOrder': t('risk.repairing', '维修中')` |

> 注:内部枚举值 `WorkOrder` 不改(影响 mock 数据和类型),仅改显示文案。i18n 需在 `zh.ts`/`en.ts`/`es.ts` 中新增 `risk.repairing` key。

| # | 文件 | 改动 |
|---|------|------|
| 3 | `src/i18n/zh.ts` | 新增 `'risk.repairing': '维修中'` |
| 4 | `src/i18n/en.ts` | 新增 `'risk.repairing': 'Repairing'` |
| 5 | `src/i18n/es.ts` | 新增 `'risk.repairing': 'En reparación'` |

**验证**:故障/电池报警列表,`WorkOrder` 状态行显示"维修中"。

---

### P1-2: 模块9 — 操作按钮文案 "报修" → "一键报修"

**问题**:按钮文案为 `t('fence.repair')`(值为"报修"),报告要求"一键报修"。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Risk.tsx` | 209 | `t('fence.repair')` → 直接写 `'一键报修'` 或新增 i18n key `risk.quick_repair` |

**验证**:按钮显示"一键报修"。

---

### P1-3: 模块12 驾驶报告 — 报告时间格式 "2025-W23" → "2025年第21周"

**问题**:周报 period 原样直出 `"2025-W23"`,报告要求"2025年第21周";月报 `"2025-06"` → "2025年6月"。

**修复方案**:在 mock 数据生成时直接格式化为报告要求的中文格式,或在列渲染时转换。推荐在 mock 中改(与报告直接一致)。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/api/mock.ts` | 186 | `period: i < 4 ? '2025-W23' : '2025-06'` → `period: i < 4 ? '2025年第23周' : '2025年6月'` |

**验证**:驾驶报告列表周报列显示"2025年第23周",月报显示"2025年6月"。

---

### P1-4: 模块12 驾驶报告 — 风险等级列重复(派生 level + 原始 riskLevel 两列)

**问题**:表格同时有由 score 派生的 `level` 列(L127-135)和直接渲染 `level` 字符串的 `riskLevel` 列(L136-144),语义重复。

**修复方案**:删除 `riskLevel` 列(原始 level 字符串列),保留由 score 派生的 `level` 列(带颜色 Tag,更有业务意义)。或反之(取决于产品意图——派生 vs 原始)。

> **需确认**:两列数据可能不一致(mock 中 `level` 字段和 `score` 派生的等级是独立生成的),删除前需确认以哪个为准。

| # | 文件 | 行号 | 改动(假设保留派生列) |
|---|------|------|------|
| 1 | `src/pages/Driving.tsx` | 136-144 | 删除 `riskLevel` 列定义(第 136-144 行整个对象从数组中移除) |

**验证**:表格只剩一列风险等级。

---

### P1-5: 模块15 行程管理 — 时长格式 "1小时25分钟" → "hh:mm"

**问题**:mock 数据 `duration` 为中文"1小时25分钟",报告要求 `hh:mm`。

**修复方案**:将 mock 数据中的 duration 值改为 `hh:mm` 格式(如 `01:25`)。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/api/mock.ts` | 270 | `duration: '1小时25分钟'` → `duration: '01:25'` |
| 2 | `src/api/mock.ts` | 全文 | 所有 tripData 条目的 duration 均需转换(grep `duration:` 在 mock.ts 中匹配) |

**验证**:行程列表和详情中时长显示 `hh:mm` 格式。

---

### P1-6: 模块13 电池监控 — 折线 label "kWh" → "kWh/100km"

**问题**:日均电耗折线 label 仅 "kWh",报告要求 "kWh/100km"。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Battery.tsx` | 61 | `label: t('battery.kwh', 'kWh')` → `label: t('battery.kwh_100km', 'kWh/100km')` |

| # | 文件 | 改动 |
|---|------|------|
| 2 | `src/i18n/zh.ts` | 新增 `'battery.kwh_100km': 'kWh/100km'` |
| 3 | `src/i18n/en.ts` | 新增 `'battery.kwh_100km': 'kWh/100km'` |
| 4 | `src/i18n/es.ts` | 新增 `'battery.kwh_100km': 'kWh/100km'` |

**验证**:电池监控详情折线图单位显示 "kWh/100km"。

---

### P1-7: 模块6 车辆管理 — 车龄上限 50 → 100

**问题**:车龄筛选 `InputNumber` 的 `max=50`,报告要求 0-100。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Vehicles.tsx` | 224 | `max={50}` → `max={100}` |
| 2 | `src/pages/Vehicles.tsx` | 226 | `max={50}` → `max={100}` |

**验证**:车龄筛选最大值可达 100。

---

### P1-8: 模块6 车辆管理 — 电池版本筛选无 maxLength

**问题**:报告要求电池版本筛选 ≤20 字符,代码 `Input` 无 `maxLength`。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Vehicles.tsx` | 约 214-219 | 电池版本 `<Input>` 添加 `maxLength={20}` |

**验证**:电池版本输入框最多输入 20 字符。

---

### P1-9: 模块7 围栏管理 — 半径无上限

**问题**:围栏半径 `InputNumber` 仅有 `min={0.1}`,无 `max`,报告要求 ≤100km。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Fence.tsx` | 325 | `<InputNumber min={0.1} step={0.1}` → `<InputNumber min={0.1} max={100} step={0.1}` |

**验证**:围栏半径输入最大值限制为 100km。

---

### P1-10: 模块5 租户管理 — 分页默认 20 → 10

> ~~P1-12(语言切换加西班牙文): 已移除。产品确认仅保留中文/英文切换,不加西班牙文。~~

**问题**:`defaultPageSize: 20`,报告要求默认 10。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Tenant.tsx` | 261 | `defaultPageSize: 20` → `defaultPageSize: 10` |

**验证**:租户列表默认每页 10 条。

---

### P1-11: 模块5 租户管理 — 联系人/电话必填 → 非必填

**问题**:联系人(`contact`)和联系电话(`phone`)均为 `required: true`,报告要求非必填。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Tenant.tsx` | 约 319 | 联系人 rules 中删除 `required: true` |
| 2 | `src/pages/Tenant.tsx` | 约 325 | 联系电话 rules 中删除 `required: true` |

**验证**:新增租户时联系人和电话可不填即可提交。

---

### P1-12: 模块11 驾驶预警 — 车牌筛选无 maxLength

**问题**:报告要求车牌筛选 ≤8 字符,代码无 `maxLength`。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Driving.tsx` | 约 273-278 | 车牌 `<Input>` 添加 `maxLength={8}` |

**验证**:驾驶预警车牌筛选最多输入 8 字符。

---

### P1-13: 模块16 维修管理 — 新建弹窗维修描述选项仅 6 项,电池类仅 2 项

**问题**:报告全局枚举电池报警 5 项(SOC过低/电池高温/SOC跳变/充电故障/温差报警),但维修描述下拉仅含 4 故障项 + 2 电池项(温度差异/电池高温),缺 SOC过低/SOC跳变/充电故障。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Repair.tsx` | 约 284-300 | 维修描述 Select 的 options 补齐 5 项电池报警(SOC过低/电池高温/SOC跳变/充电故障/温差报警) |

**验证**:新建维修弹窗中维修描述下拉含完整 9 项(4 故障 + 5 电池)。

---

## P2 — 缺失子功能(4 项)

### P2-1: 模块12 驾驶报告 — 评分规则展示

**问题**:报告要求展示评分规则(急加速/急减速/急转弯/AEB制动/疲劳驾驶 各 20% 权重),代码无任何实现。

**修复方案**:在驾驶报告详情弹窗/页中增加一个 Collapse/Descriptions 展示评分规则说明。

| # | 文件 | 改动 |
|---|------|------|
| 1 | `src/pages/Driving.tsx` | 详情区域新增评分规则面板,5 行:各预警类型 + 权重 20% |
| 2 | `src/i18n/zh.ts` | 新增评分规则相关文案 key |
| 3 | `src/i18n/en.ts` | 新增英文翻译 |
|  |                         |                                                     |

**验证**:点击驾驶报告详情,可见评分规则说明面板。

---

### P2-2: 模块4.3 资产划拨记录 — 补齐变更人、划拨前后租户字段

**问题**:划拨记录表格仅"租户+时间"两列,报告要求划拨时间、变更人、划拨前租户、划拨后租户 4 列。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Biz.tsx` | 划拨记录 Table columns(约 357-369) | 补齐 `变更人`/`划拨前租户`/`划拨后租户` 3 列 |
| 2 | `src/api/mock.ts` | 资产划拨 mock 数据 | 补齐 `beforeTenant`/`afterTenant`/`operator` 字段 |

**验证**:划拨记录弹窗表格显示 4 列(时间/变更人/划拨前/划拨后)。

---

### P2-3: 模块3 首页地图 — zoom 改为自动适应

**问题**:地图 `zoom={11}` 固定,报告要求"自动缩放"。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Dashboard.tsx` | 约 222-223 | 移除固定 `zoom={11}`,或在 `vehicles` 数据变化时调用 `map.fitBounds()` 自动适配边界 |

**验证**:首页地图加载后自动缩放以包含所有车辆标记点。

---

### P2-4: 模块17 实时位置 — 搜索框联动过滤

**问题**:搜索框 `placeholder="搜索企业名称/VIN码/车牌号"` 但 `onChange` 无过滤逻辑,输入无效。

| # | 文件 | 行号 | 改动 |
|---|------|------|------|
| 1 | `src/pages/Monitor.tsx` | 搜索 Input(约 L113) | 添加 `onChange` 处理,按企业名/VIN/车牌过滤车辆树节点(使用 `matchVinSearch`/`matchPlateSearch`) |

**验证**:输入 VIN 前 6 位或车牌可见部分,车辆列表实时过滤。

---

## 修复执行顺序建议

```
批次1(P0,影响功能):
  P0-1  mock.ts:165  alertTypes 对齐           (1 行)
  P0-2  Repair.tsx + AuditLog.tsx 检索替换       (2-3 行)

批次2(P1,快速批量):
  P1-7  Vehicles.tsx:224,226  车龄 max=100       (2 处改数字)
  P1-8  Vehicles.tsx  电池版本 maxLength=20        (1 属性)
  P1-9  Fence.tsx:325    半径 max=100             (1 属性)
  P1-10 Tenant.tsx:261  分页默认10               (1 处改数字)
  P1-11 Tenant.tsx:319,325  联系人/电话非必填     (删 2 个 required)
  P1-13 Driving.tsx:273  车牌 maxLength=8        (1 属性)
  P1-6  Battery.tsx:61   label kWh/100km          (1 字符串)

批次3(P1,涉及 i18n):
  P1-1  Risk.tsx:192,333 + i18n 3 文件  状态文案   (改 2 字符串 + 加 3 key)
  P1-2  Risk.tsx:209     按钮文案                 (改 1 字符串)
  P1-3  mock.ts:186     period 格式化             (改 1 字符串)
  ~~P1-12 Topbar.tsx 语言切换加 es — 已移除~~

批次4(P1,需确认):
  P1-4  Driving.tsx:136-144  删重复列             (删 1 列定义)
  P1-13 Repair.tsx:284-300   补齐描述选项          (加 3 个 Option)

批次5(P2):
  P2-1  驾驶报告评分规则面板 (新增组件)
  P2-2  资产划拨记录字段     (改列定义 + 补 mock 字段)
  P2-3  首页地图自动缩放     (改 zoom/flyBounds)
  P2-4  实时位置搜索联动      (加 onChange 过滤)
```

**预估改动量**:
- 批次 1-3(P0 + P1 批量):约 22 行改动,涉及 8 个文件
- 批次 4(P1 需确认):约 15 行改动,涉及 2 个文件
- 批次 5(P2):约 80 行改动(含新增面板),涉及 4 个文件
- **总计约 117 行改动,11 个文件**

---

**修复计划说明**:
1. 每批次完成后运行 `npm run build` 验证 TS 编译通过
2. i18n 改动需同步更新 zh/en/es 三个文件
3. mock 数据改动需确认不影响其他页面的数据消费
4. P1-4(删重复列)需产品确认以哪个等级字段为准
