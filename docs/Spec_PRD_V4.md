# PRD V4 对齐变更规格文档 (Spec)

**文档版本**: V1.0
**基于文档**: 智利车队管理PRD V4
**基线代码**: 当前 main 分支（含 V1.0/V1.1/V1.2 三版本功能）
**项目路径**: `weidu-fleet/`

---

## 一、Context

PRD V4（智利车队管理PRD 第4版）对多个模块进行了功能优化和字段调整。本文档系统性梳理了 PRD V4 与当前代码实现之间的全部差异（共12项变更 + 1项已合规模认），作为后续开发的唯一执行依据。

---

## 二、变更清单总览

| 编号 | 模块 | 变更概要 | 影响文件 | 复杂度 |
|------|------|---------|---------|--------|
| C01 | 全局 | 移除西班牙语支持（3→2语言） | i18n/index.ts, i18n/es.ts, types/index.ts, Header | 低 |
| C02 | 首页看板 | 驾驶风险图X轴：5驾驶行为→6 ADAS预警等级 | Dashboard.tsx, i18n/zh.ts, i18n/en.ts | 中 |
| C03 | 风控预警-故障 | 故障报警类型：4→9种 | types/index.ts, mock.ts, Risk.tsx, Repair.tsx | 中 |
| C04 | 风控预警-电池 | 电池报警类型：5→14种 + 修复筛选Bug | types/index.ts, mock.ts, Risk.tsx, Repair.tsx | 高 |
| C05 | 驾驶预警 | 预警类型：英文key→中文ADAS名称（5→6种） | types/index.ts, mock.ts, Driving.tsx, i18n | 高 |
| C06 | 电池监控 | 充电状态：3→5种 | types/index.ts, mock.ts, Battery.tsx | 低 |
| C07 | 电池监控 | 新增"日均电耗"列 | types/index.ts, mock.ts, Battery.tsx | 低 |
| C08 | 轨迹回放 | 保留时效：10→30天 | utils/trajectory.ts, Monitor.tsx | 低 |
| C09 | 资产划拨 | 归属租户筛选：单选→多选 | Vehicles.tsx (资产Tab) | 低 |
| C10 | 维修管理 | 删除后状态回退至"未处理" | Repair.tsx, mock.ts, types/index.ts | 中 |
| C11 | 日志审计 | 映射表删除"编辑维修"条目（48→47） | mock.ts | 低 |
| C12 | 风控预警 | 状态筛选文案"已生成工单"→"维修中" | Risk.tsx | 低 |
| C13 | 围栏管理 | 自定义围栏地址展示 `— —` | Fence.tsx | ✅ 已合规 |

---

## 三、逐项规格

### C01: 移除西班牙语支持

**PRD V4 要求**: 语言切换仅保留中文、英文（删除西班牙文）

**当前实现**:
- `src/types/index.ts` L176: `export type Lang = 'zh' | 'en' | 'es';`
- `src/i18n/index.ts` L5: `import es from './es';` + L23 resources 含 es
- Header 组件语言切换下拉包含3项

**变更内容**:
1. `src/types/index.ts`: `Lang` 类型移除 `'es'`
2. `src/i18n/index.ts`: 删除 `import es` 行，resources 移除 es 条目
3. Header 语言切换下拉移除西班牙语选项
4. `src/i18n/es.ts`: 保留文件但不再加载（或直接删除）
5. localStorage 中已存的 `lang: 'es'` 用户 → fallback 至 `'en'`

**影响文件**: `src/types/index.ts`, `src/i18n/index.ts`, `src/i18n/es.ts`, Header组件

---

### C02: Dashboard驾驶风险图X轴改为6 ADAS预警等级

**PRD V4 要求**: 首页看板"驾驶风险分布"柱状图X轴为6种ADAS预警等级：
- 对车一级预警、对车二级预警、对车AEB制动、对人一级预警、对人二级预警、对人AEB制动

**当前实现** (`src/pages/Dashboard.tsx` L58-72):
- labels: 5项 — `dash.accl`(急加速), `dash.decel`(急减速), `dash.turn`(急转弯), `dash.fatigue`(疲劳驾驶), `dash.aeb`(AEB制动)
- data: 5个值 `[12, 18, 8, 5, 9]` / `[68, 95, 42, 28, 51]` / `[210, 285, 130, 88, 165]`
- colors: 5色 `['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6']`

**变更内容**:
1. labels 改为6项 ADAS 预警等级（新增 i18n key: `dash.adas_v1`, `dash.adas_v2`, `dash.adas_aeb`, `dash.adas_p1`, `dash.adas_p2`, `dash.adas_paeb`）
2. data 数组扩展为6个值
3. backgroundColor 扩展为6色
4. i18n/zh.ts 和 i18n/en.ts 新增对应词条

**影响文件**: `src/pages/Dashboard.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C03: 故障报警类型扩展（4→9种）

**PRD V4 要求**: 故障报警包含9种类型：
1. VDC故障报警
2. CDCU故障报警
3. BDCU故障报警
4. ADAS故障报警
5. 温度差异报警
6. 电池高温报警
7. 车载储能装置过压报警
8. 车载储能装置欠压报警
9. SOC低报警

> 注：后5项原属于"电池报警"的类型被归入"故障报警"大类中（PRD车辆详情Tab1风控预警记录23项枚举的一部分）。但在风控预警页面的故障报警Tab中，仅展示前4种；电池相关报警在电池报警Tab独立展示。

**当前实现**:
- `src/types/index.ts` L84: `FaultType4 = 'VDC' | 'CDCU' | 'BDCU' | 'ADAS'`（仅4种）
- `src/api/mock.ts` L131: `faultTypes` 仅4种
- `src/pages/Risk.tsx` L16-21: `faultTypeLabels` 仅4项

**变更内容**:
1. 重命名 `FaultType4` → `FaultType`，扩展为9种联合类型
2. mock.ts `getFaultAlerts()` 扩展 faultTypes 数组和 faultContents 映射
3. Risk.tsx `faultTypeLabels` 扩展为9项
4. Repair.tsx 新建维修弹窗中故障类描述选项同步扩展
5. i18n 词条更新

**影响文件**: `src/types/index.ts`, `src/api/mock.ts`, `src/pages/Risk.tsx`, `src/pages/Repair.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C04: 电池报警类型扩展（5→14种）+ 修复筛选Bug

**PRD V4 要求**: 电池报警包含14种类型（车辆详情Tab1风控预警记录23项枚举中属于电池相关的）：
1. SOC低报警
2. 电池高温报警
3. SOC跳变报警
4. 充电故障报警
5. 温差报警（温度差异报警）
6. 车载储能装置过压报警
7. 车载储能装置欠压报警
8. 单体电池过压报警
9. 单体电池欠压报警
10. SOC过高报警
11. 可充电储能系统不匹配报警
12. 电池单体一致性差报警
13. 绝缘报警
14. DC-DC温度报警

**当前实现**:
- `src/types/index.ts` L91: BatteryAlert.type 仅5种
- `src/api/mock.ts` L151: batTypes 仅5种
- `src/pages/Risk.tsx` L23-29: batteryTypeLabels 仅5项

**🐛 已知Bug**: Risk.tsx 电池报警筛选下拉使用英文key（如 `'Low SOC'`, `'High Temp'`），而数据层使用中文key（`'SOC过低'`, `'电池高温'`），导致**筛选功能完全失效**

**变更内容**:
1. BatteryAlert.type 扩展为14种联合类型
2. mock.ts `getBatteryAlerts()` 扩展 batTypes 和 content 映射
3. Risk.tsx `batteryTypeLabels` 扩展为14项
4. **修复Bug**: 电池筛选下拉 value 必须与数据层 key 一致（中文）
5. Repair.tsx 新建维修弹窗中电池类描述选项同步扩展
6. i18n 词条更新

**影响文件**: `src/types/index.ts`, `src/api/mock.ts`, `src/pages/Risk.tsx`, `src/pages/Repair.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C05: 驾驶预警类型改为中文ADAS名称（5→6种）

**PRD V4 要求**: 驾驶预警类型为6种ADAS预警等级：
- 对车一级预警、对车二级预警、对车AEB制动、对人一级预警、对人二级预警、对人AEB制动

**当前实现** (`src/pages/Driving.tsx` L32-38):
```ts
const alertTypeLabels: Record<string, string> = {
  'Rapid Accel': '急加速',
  'Hard Brake': '急减速',
  'Sharp Turn': '急转弯',
  'Fatigue': '疲劳驾驶',
  'AEB': 'AEB制动',
};
```
- mock.ts L165: `alertTypes` 用英文 key `['Rapid Accel', 'Hard Brake', ...]`
- 筛选下拉 value 也是英文
- 驾驶报告详情页风险事件折线图仅5条线

**变更内容**:
1. `DrivingAlert.type` 收窄为6种中文联合类型
2. mock.ts `alertTypes` 改为中文 ADAS 名称
3. Driving.tsx `alertTypeLabels` 改为6项中文名（key=value=中文名）
4. 筛选下拉 options 改为中文 value
5. 驾驶报告详情页风险事件折线图：5条线→6条线
6. i18n 词条更新

**影响文件**: `src/types/index.ts`, `src/api/mock.ts`, `src/pages/Driving.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C06: 充电状态扩展（3→5种）

**PRD V4 要求**: 车辆充电状态5种：充电中、未充电、满电、充电故障、未知

**当前实现**:
- `src/types/index.ts` L20: `charging: '充电中' | '未充电' | '未知'`（仅3种）
- `src/types/index.ts` L127: `BatteryMonitorItem.status: 'charging' | 'idle' | 'unknown'`（仅3种）
- mock.ts L27: 充电状态随机3选1
- mock.ts L205: BatteryMonitorItem 状态随机3选1

**变更内容**:
1. Vehicle.charging 新增 `'满电'` 和 `'充电故障'`
2. BatteryMonitorItem.status 新增 `'full'` 和 `'fault'`
3. mock.ts 充电状态随机5选1
4. Battery.tsx 充电状态 Tag 颜色适配5种

**影响文件**: `src/types/index.ts`, `src/api/mock.ts`, `src/pages/Battery.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C07: 电池监控新增"日均电耗"列

**PRD V4 要求**: 电池监控列表新增"日均电耗"列，单位 kWh/100km

**当前实现**: `BatteryMonitorItem` 接口无 dailyConsumption 字段，Battery.tsx 表格无此列

**变更内容**:
1. `BatteryMonitorItem` 新增 `dailyConsumption: number` 字段
2. mock.ts `getBatteryMonitorItems()` 生成随机日均电耗数据（范围 15~35 kWh/100km）
3. Battery.tsx monitorColumns 新增列：`{ title: '日均电耗', dataIndex: 'dailyConsumption', render: v => \`${v} kWh/100km\` }`
4. i18n 词条新增

**影响文件**: `src/types/index.ts`, `src/api/mock.ts`, `src/pages/Battery.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C08: 轨迹保留时效 10→30天

**PRD V4 要求**: 轨迹数据保留30天

**当前实现** (`src/utils/trajectory.ts` L8):
```ts
const TRAJECTORY_RETENTION_DAYS = 10;
```
Monitor.tsx 中也有 UI 提示"仅支持10天内轨迹回放"

**变更内容**:
1. `TRAJECTORY_RETENTION_DAYS` 从 10 改为 30
2. 所有注释和 JSDoc 中的"10天"更新为"30天"
3. Monitor.tsx UI 提示文案更新

**影响文件**: `src/utils/trajectory.ts`, `src/pages/Monitor.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C09: 资产划拨归属租户筛选改为多选

**PRD V4 要求**: 资产列表筛选中"归属租户"为多选下拉（含"未划拨"选项）

**当前实现**: 需确认资产划拨 Tab 中归属租户筛选是否已为多选

**变更内容**:
1. 确认归属租户筛选组件为 `Select mode="multiple"`
2. 选项包含所有租户 + "未划拨"选项
3. 筛选逻辑适配多选（过滤包含关系）

**影响文件**: `src/pages/Vehicles.tsx`（资产 Tab 筛选区域）

---

### C10: 维修删除后状态回退至"未处理"

**PRD V4 要求**: 删除维修记录后，故障报警/电池报警中对应记录的状态回退为"未处理"

**当前实现** (`src/pages/Repair.tsx` L114-117):
```ts
const handleDelete = (id: string) => {
  setRepairs((prev) => prev.filter((r) => r.id !== id));
  message.success(t('toast.deleted'));
};
```
仅物理删除维修记录，无状态回退逻辑。

**变更内容**:
1. `RepairItem` 接口新增 `sourceAlertId?: string` 和 `sourceAlertType?: 'fault' | 'battery'` 字段（记录来源报警ID）
2. `addRepairItem()` 签名扩展，接收 sourceAlertId 和 sourceAlertType
3. Risk.tsx 一键报修时传入 sourceAlertId
4. Repair.tsx handleDelete 逻辑：
   - 查找被删除的维修记录的 sourceAlertId 和 sourceAlertType
   - 如果是 fault 类型 → 调用 mock 函数将该 FaultAlert.status 回退为 'Pending'
   - 如果是 battery 类型 → 调用 mock 函数将该 BatteryAlert.status 回退为 'Pending'
   - 然后删除维修记录
5. mock.ts 新增 `revertFaultAlertStatus(id)` 和 `revertBatteryAlertStatus(id)` 函数
6. 审计日志映射表新增"删除维修"的操作条目中的回退描述（可选）

**影响文件**: `src/types/index.ts`, `src/pages/Repair.tsx`, `src/pages/Risk.tsx`, `src/api/mock.ts`

---

### C11: 审计日志映射表删除"编辑维修"

**PRD V4 要求**: 维修管理操作仅包含：新建维修、一键报修、完成维修、删除维修（无"编辑维修"）

**当前实现** (`src/api/mock.ts` L681):
```ts
{ menu: '维修管理', function: '编辑维修', contentTpl: `编辑维修记录：车辆 ${maskVin('LJ8T7AD0000100002')}` },
```
AUDIT_OP_MAPPINGS 共48条，含多余的"编辑维修"

**变更内容**:
1. 删除 L681 的"编辑维修"条目
2. AUDIT_OP_MAPPINGS 从48条变为47条
3. AuditLog.tsx 操作类型筛选下拉自动适配（基于数据动态生成，无需额外改动）

**影响文件**: `src/api/mock.ts`

---

### C12: 风险状态筛选文案"已生成工单"→"维修中"

**PRD V4 要求**: 报警状态枚举为：未处理、维修中、维修完成

**当前实现** (`src/pages/Risk.tsx`):
```tsx
<Option value="WorkOrder">已生成工单</Option>
```
筛选下拉中 status 文案为"已生成工单"，应为"维修中"

**变更内容**:
1. Risk.tsx 故障报警 Tab 和电池报警 Tab 中状态筛选 `<Option value="WorkOrder">` 文案改为"维修中"
2. 确认 i18n 词条一致

**影响文件**: `src/pages/Risk.tsx`, `src/i18n/zh.ts`, `src/i18n/en.ts`

---

### C13: 围栏自定义地址展示（✅ 已合规）

**PRD V4 要求**: 自定义围栏的围栏地址列显示 `— —`

**当前实现** (`src/pages/Fence.tsx`): 已正确实现自定义围栏地址显示为 `— —`

**无需变更。**

---

## 四、类型变更汇总

### `src/types/index.ts` 变更矩阵

| 类型/接口 | 当前 | 目标 | 变更 |
|-----------|------|------|------|
| `Lang` | `'zh'\|'en'\|'es'` | `'zh'\|'en'` | 移除 `'es'` |
| `FaultType4` → `FaultType` | 4种 | 9种 | 重命名+扩展 |
| `BatteryAlert.type` | 5种 | 14种 | 扩展 |
| `DrivingAlert.type` | `string` | 6种联合类型 | 收窄 |
| `Vehicle.charging` | 3种 | 5种 | 新增满电/充电故障 |
| `BatteryMonitorItem.status` | 3种 | 5种 | 新增full/fault |
| `BatteryMonitorItem` | 无dailyConsumption | 新增字段 | +dailyConsumption |
| `RepairItem` | 无来源字段 | 新增来源字段 | +sourceAlertId, +sourceAlertType |

---

## 五、i18n 变更概要

### 新增词条 (zh/en)

| Key | 中文 | 英文 |
|-----|------|------|
| `dash.adas_v1` | 对车一级预警 | Vehicle Level-1 Warning |
| `dash.adas_v2` | 对车二级预警 | Vehicle Level-2 Warning |
| `dash.adas_aeb` | 对车AEB制动 | Vehicle AEB Braking |
| `dash.adas_p1` | 对人一级预警 | Pedestrian Level-1 Warning |
| `dash.adas_p2` | 对人二级预警 | Pedestrian Level-2 Warning |
| `dash.adas_paeb` | 对人AEB制动 | Pedestrian AEB Braking |
| `battery.daily_consumption` | 日均电耗 | Daily Consumption |
| `battery.status.full` | 满电 | Full |
| `battery.status.fault` | 充电故障 | Charging Fault |

### 修改词条

| Key | 当前值 | 新值 |
|-----|--------|------|
| `risk.status.workorder` | 已生成工单 | 维修中 |
| `monitor.retention_hint` | 仅支持10天内轨迹回放 | 仅支持30天内轨迹回放 |

### 删除词条

| Key | 说明 |
|-----|------|
| `dash.accl` | 急加速（被ADAS预警替代） |
| `dash.decel` | 急减速 |
| `dash.turn` | 急转弯 |
| `dash.fatigue` | 疲劳驾驶 |
| `dash.aeb` | AEB制动 |
| 语言切换中的西班牙语选项 | es 相关 |

---

## 六、文件变更矩阵

| 文件 | 变更类型 | 涉及编号 |
|------|---------|---------|
| `src/types/index.ts` | 类型扩展 | C01,C03,C04,C05,C06,C07,C10 |
| `src/api/mock.ts` | Mock数据扩展 | C02,C03,C04,C05,C06,C07,C10,C11 |
| `src/pages/Dashboard.tsx` | 图表改造 | C02 |
| `src/pages/Risk.tsx` | 筛选修复+文案 | C03,C04,C10,C12 |
| `src/pages/Driving.tsx` | 类型重构 | C05 |
| `src/pages/Battery.tsx` | 新增列+状态 | C06,C07 |
| `src/pages/Repair.tsx` | 删除回退逻辑 | C03,C04,C10 |
| `src/pages/Monitor.tsx` | 文案更新 | C08 |
| `src/pages/Vehicles.tsx` | 筛选多选 | C09 |
| `src/utils/trajectory.ts` | 常量修改 | C08 |
| `src/i18n/index.ts` | 移除es | C01 |
| `src/i18n/zh.ts` | 词条增删改 | C02,C05,C06,C07,C08,C12 |
| `src/i18n/en.ts` | 词条增删改 | C02,C05,C06,C07,C08,C12 |
| `src/i18n/es.ts` | 保留或删除 | C01 |
| Header组件 | 语言选项 | C01 |

---

## 七、验证清单

| 编号 | 验证项 | 验证方法 |
|------|--------|---------|
| C01 | 语言切换仅显示中/英两项 | UI手动切换验证 |
| C02 | Dashboard柱状图显示6个ADAS等级 | 目视检查 |
| C03 | 故障报警筛选显示9种类型 | 下拉检查 |
| C04 | 电池报警筛选显示14种且筛选功能正常 | 选择每种类型验证筛选结果 |
| C05 | 驾驶预警列表显示6种中文ADAS名称 | 列表+筛选验证 |
| C06 | 电池监控充电状态显示5种 | Tag颜色检查 |
| C07 | 电池监控表格显示日均电耗列 | 列存在+数值格式验证 |
| C08 | 轨迹回放可选30天内日期 | DatePicker范围验证 |
| C09 | 资产划拨归属租户可多选 | 下拉多选交互验证 |
| C10 | 删除维修记录后对应报警状态变为"未处理" | 一键报修→删除→回Risk页验证 |
| C11 | 审计日志操作类型不含"编辑维修" | 筛选下拉检查 |
| C12 | 风险状态筛选显示"维修中"而非"已生成工单" | 下拉文案检查 |
| C13 | 自定义围栏地址显示"— —" | ✅ 已验证 |

---

## 八、执行优先级建议

1. **P0 - 阻塞性Bug**: C04（电池筛选完全失效）→ 优先修复
2. **P1 - 核心功能**: C02, C03, C05, C10（图表/类型/回退逻辑）
3. **P2 - 功能完善**: C01, C06, C07, C08, C09, C11, C12
4. **P3 - 已合规**: C13（无需操作）

---

**文档说明**: 本Spec基于PRD V4与现有代码的逐项对比分析生成，覆盖全部13项变更点。每项变更均标注了PRD要求、当前实现代码位置、具体变更内容和影响文件范围，可直接作为开发实施依据。
