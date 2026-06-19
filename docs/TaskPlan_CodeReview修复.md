# 代码优化 TaskPlan（基于 CodeReview报告 V4，共~69项）

> 基础分支：当前工作区  
> 项目路径：`/Users/Zhuanz1/Desktop/AI文件夹/苇渡-智利车队管理/weidu-fleet`  
> 执行原则：**先改类型层 → 再改逻辑层 → 再改展示层 → 最后UI重构**，每完成一个Task保证 `npm run build` 无报错

---

## Task 1：类型系统对齐（`src/types/index.ts`，16项）

> 这是所有后续修改的基础，必须最先完成。修改后所有引用处会触发 TS 编译错误，便于逐一定位修复。

### 1.1 新增缺失类型（4项）

| 对应报告# | 新增接口 | 字段定义（来自PRD） |
|---|---|---|
| §2-1 | `VehicleAlertRecord` | `{ plate, vin, alertName(23种), alertContent(CAN解码), time }` |
| §2-2 | `VehicleDrivingRecord` | `{ plate, vin, alertName(6种), alertContent(CAN解码), speed, time }` |
| §2-3 | `VehicleBatteryRecord` | `{ plate, vin, soc, soh, temp, range, time }` |
| §2-4 | `TransferRecord` | `{ vin, fromTenant, toTenant, operator, transferTime }` |

**操作**：在 `types/index.ts` 末尾（`AuditLog` 接口之后）追加4个 `export interface`。

### 1.2 修复枚举值不一致（9项）

| 对应报告# | 类型 | 当前值 | 目标值 | 修改位置 |
|---|---|---|---|---|
| §2-5 | `FaultAlert.status` | `'Pending'\|'WorkOrder'\|'Fixed'` | 保留英文key（内部逻辑用），**前端显示由i18n映射** | 不改types，改Risk.tsx映射（见Task 2） |
| §2-6 | `BatteryAlert.status` | 同上 | 同上 | 同上 |
| §2-7 | `FaultAlert.type` | `FaultType24`（24种英文） | **PRD仅4种：`'VDC'\|'CDCU'\|'BDCU'\|'ADAS'`** | 删除 `FaultType24`，改为 `FaultType4` |
| §2-8 | `BatteryAlert.type` | 英文5种 | **改为中文：`'SOC过低'\|'电池高温'\|'SOC跳变'\|'充电故障'\|'温差报警'`** | 直接改类型字面量 |
| §2-9 | `DrivingReport.level` | `'Safe'\|'Low'\|'Medium'\|'High'` | **`'安全司机'\|'低危司机'\|'中危司机'\|'高危司机'`** | 改类型字面量 |
| §2-10 | `FenceItem.status` | `'active'\|'inactive'` | **`'生效中'\|'未生效'`** | 改类型字面量 |
| §2-11 | `FenceItem.alertType` | `string` | **`'出栏报警'\|'入栏报警'`** | 改类型字面量 |
| §2-12 | `RepairItem.status` | `'in_progress'\|'done'` | **`'维修中'\|'维修完成'`** | 改类型字面量 |
| §2-13 | `RepairItem.type` | `'fault'\|'battery'` | **`'故障类'\|'电池类'`** | 改类型字面量 |

**操作**：逐个修改 `types/index.ts` 中的类型定义。

### 1.3 字段修正（3项）

| 对应报告# | 类型 | 操作 |
|---|---|---|
| §2-14 | `Vehicle` | **新增** `deviceType?: string`、`deviceModel?: string` 两个可选字段 |
| §2-15 | `FenceAlert` | **新增** `device?: string`、`speed?: number` 两个可选字段 |
| §2-16 | `DischargeRecord` | **删除** `energyConsumed: number` 字段 |

### 1.4 编译验证

- 执行 `npx tsc --noEmit`，记录所有因枚举变更导致的编译错误
- 这些错误将在后续 Task 2~6 中逐个页面修复

---

## Task 2：状态流转修复（P0 级，7项）

### 2.1 故障/电池报警状态映射（报告§4 #1~#3）

**文件**：`src/pages/Risk.tsx`

**当前代码**（L140-143 故障状态i18n映射）：
```ts
const faultStatusMap: Record<string, string> = {
  Pending: '未处理', WorkOrder: '维修中', Fixed: '维修完成',
};
```

**修改**：
- `WorkOrder` → 映射为 `'已生成工单'`（一键报修后状态）
- 电池报警状态映射（L191-195）同步修改
- `handleRepairFault`（L63-68）和 `handleRepairBattery`：状态设为 `WorkOrder` 不变，但显示文案改为"已生成工单"

### 2.2 围栏状态枚举（报告§4 #4）

**文件**：`src/pages/Fence.tsx`

**操作**：
- 围栏列表状态渲染处（L41附近），`'active'` → 显示 `'生效中'`，`'inactive'` → 显示 `'未生效'`
- 新建围栏时 status 值改为 `'生效中'` / `'未生效'`
- 搜索筛选 Select 的 options 改为中文

### 2.3 维修完成→报警状态同步（报告§4 #5）

**文件**：`src/pages/Repair.tsx`

**当前代码**（L83-88 `handleComplete`）：仅改维修状态为 `done`。

**修改**：
```ts
const handleComplete = (id: string) => {
  const repair = repairs.find(r => r.id === id);
  if (repair) {
    // 1. 维修状态改为"维修完成"
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status: '维修完成' as const } : r));
    // 2. 同步更新关联的故障/电池报警状态为"维修完成"（通过vin匹配）
    syncAlertStatus(repair.vin, 'Fixed');
    message.success(t('toast.completed'));
  }
};
```
> 注：`syncAlertStatus` 需在 mock 层增加，或在组件内维护本地状态映射。

### 2.4 围栏删除二次确认（报告§4 #6）

**文件**：`src/pages/Fence.tsx`

**当前代码**（L110-113）：直接 `setFences(prev => prev.filter(...))` 无确认。

**修改**：包裹 `Modal.confirm`：
```ts
Modal.confirm({
  title: '确认删除',
  content: '删除后数据无法恢复，是否继续？',
  onOk: () => { /* 执行删除 */ },
});
```
- 额外：仅 `'未生效'` 状态的围栏可删除，`'生效中'` 时删除按钮禁用。

### 2.5 租户过期状态（报告§4 #7）

**文件**：`src/pages/Tenant.tsx`

**操作**：
- 在 `TenantItem` 类型中增加 `expireDate?: string`、`expired?: boolean` 字段
- 列表增加"服务状态"列：未过期显示"正常"，过期显示"服务过期"（红色Tag）
- 过期租户子级也显示"服务过期"
- Mock数据中增加过期租户示例

---

## Task 3：V1.2 位置精度 & 检索匹配补齐（4项）

### 3.1 Dashboard 地图Popup补齐（报告§1.3 #8 + §3.1 #1~#2）

**文件**：`src/pages/Dashboard.tsx` L240-252

**当前Popup字段**：车牌(VIN/企业/设备名称/设备状态/行驶速度/上报时间)  
**需新增**：
- `电池信息(SOC)`: `<div><strong>SOC:</strong> {v.soc}%</div>`
- `实时地址`: `<div><strong>地址:</strong> {truncateLocation(地址)}</div>`
  - 地址来源：使用mock逆地理编码或 `v.lat/v.lng` 拼接地址字符串后 `truncateLocation`
  - 需在文件头引入 `truncateLocation` from `@/utils/masking`

### 3.2 围栏编辑页地图地址回显（报告§1.3 #9）

**文件**：`src/pages/Fence.tsx` L321

**当前代码**：
```ts
setCenterAddr(`${c[0].toFixed(4)}, ${c[1].toFixed(4)}`);
```
**修改**：改为模拟逆地理地址 + `truncateLocation`：
```ts
const addr = `智利圣地亚哥首都大区圣地亚哥市解放者大道${Math.floor(c[0]*1000)}号`;
setCenterAddr(truncateLocation(addr));
```
- 需在文件头引入 `truncateLocation`

### 3.3 围栏车辆配置页搜索（报告§1.4 #4）

**文件**：`src/pages/Fence.tsx` L127-128

**当前代码**：
```ts
.filter(v => v.vin.includes(search) || v.plate.includes(search))
```
**修改**：
```ts
.filter(v => matchVinSearch(v.vin, search) || matchPlateSearch(v.plate, search))
```
- 需在文件头引入 `matchVinSearch, matchPlateSearch` from `@/utils/masking`

### 3.4 编译验证

- `npx tsc --noEmit` 确认无新增错误

---

## Task 4：字段完整性补齐（16项）

### 4.1 Dashboard 地图Popup SOC（报告§3.1 #1）

> 已在 Task 3.1 中一并处理 ✅

### 4.2 车辆详情 — 车型展示确认（报告§3.2 #3）

**文件**：`src/pages/Vehicles.tsx` L377-394

**操作**：确认左侧车辆信息区是否有 `model`（车型）展示行。若已存在则无需改动；若缺少则新增一行：
```tsx
<Descriptions.Item label="车型">{v.model}</Descriptions.Item>
```

### 4.3 车辆详情 — 设备类型/设备型号动态化（报告§3.2 #4）

**文件**：`src/pages/Vehicles.tsx` L400-401

**当前代码**：硬编码 `'OBD-II'` / `'WD-T100'`  
**修改**：
```tsx
<Descriptions.Item label="设备类型">{v.deviceType || 'OBD-II'}</Descriptions.Item>
<Descriptions.Item label="设备型号">{v.deviceModel || 'WD-T100'}</Descriptions.Item>
```
- 同时修改 `src/api/mock.ts` 的 `vehicles` 数组，增加 `deviceType: 'OBD-II'`、`deviceModel: 'WD-T100'` 字段

### 4.4 AlertTable 补齐23种预警名称（报告§3.2 #5）

**文件**：`src/pages/Vehicles/AlertTable.tsx` L6-13

**当前**：仅映射6种 → **目标**：映射PRD要求的全部23种预警  
**操作**：扩展 `alertNameMap` 和 `alertContentMap`：
- 4种故障类：VDC故障报警、CDCU故障报警、BDCU故障报警、ADAS故障报警（已有）
- 19种电池类：需补全SOC过低报警、电池高温报警、SOC跳变报警、充电故障报警、温差报警 + 其余14种电池子类型报警
- 具体映射参考PRD风控预警章节

### 4.5 DrivingTable 增加"预警内容"列（报告§3.2 #6）

**文件**：`src/pages/Vehicles/DrivingTable.tsx` L24-28

**操作**：在 `columns` 中"车速"列之后增加：
```ts
{ title: '预警内容', dataIndex: 'alertContent', key: 'alertContent' },
```
- 在 `alertContentMap` 中为6种驾驶预警补充 CAN 解码内容（如"前方车辆急刹，请注意减速"等）

### 4.6 驾驶预警搜索补齐"选择时间"（报告§3.3 #7）

**文件**：`src/pages/Driving.tsx` L252-277

**操作**：在搜索栏中增加 `DatePicker.RangePicker` 组件：
```tsx
<RangePicker
  showTime={{ format: 'HH:mm' }}
  format="YYYY-MM-DD HH:mm"
  onChange={(dates) => setTimeRange(dates)}
/>
```
- 在筛选逻辑中增加时间区间判断

### 4.7 驾驶报告列表增加"风险等级"列（报告§3.3 #8）

**文件**：`src/pages/Driving.tsx` L106-148

**操作**：在报告列表 columns 中增加独立的风险等级列：
```ts
{
  title: '风险等级', dataIndex: 'level', key: 'level',
  render: (v: string) => {
    const colorMap = { '安全司机': 'green', '低危司机': 'blue', '中危司机': 'orange', '高危司机': 'red' };
    return <Tag color={colorMap[v]}>{v}</Tag>;
  },
},
```
- 同步修改 mock 数据中 `level` 值为中文

### 4.8 实时监控搜索补齐"企业名称/VIN码"（报告§3.4 #9）

**文件**：`src/pages/Monitor.tsx` L112-116

**当前**：仅 `plate` 搜索  
**修改**：搜索逻辑改为匹配 `vin`、`plate`、企业名称：
```ts
.filter(v => matchPlateSearch(v.plate, search) || matchVinSearch(v.vin, search) || '智利物流集团'.includes(search))
```
- 引入 `matchVinSearch`、`matchPlateSearch`
- 搜索 placeholder 改为 "搜索企业名称/VIN码/车牌号"

### 4.9 实时监控车辆列表补齐VIN/状态（报告§3.4 #10）

**文件**：`src/pages/Monitor.tsx` L85-101

**操作**：在车辆列表项中增加：
```tsx
<div>VIN: {maskVin(v.vin)}</div>
<div>状态: {v.status}</div>
```

### 4.10 围栏搜索补齐"操作时间"（报告§3.5 #13）

**文件**：`src/pages/Fence.tsx` L343-353

**操作**：增加 `DatePicker.RangePicker`（精确到分钟，限制最长1年）：
```tsx
<RangePicker
  showTime={{ format: 'HH:mm' }}
  format="YYYY-MM-DD HH:mm"
  disabledDate={(current) => current && current > dayjs().endOf('day')}
  onChange={(dates) => setTimeRange(dates)}
/>
```
- 筛选逻辑中增加时间区间过滤

### 4.11 租户列表补齐"联系人"列（报告§3.6 #14）

**文件**：`src/pages/Tenant.tsx` L100-130

**操作**：在 columns 中增加：
```ts
{ title: '联系人', dataIndex: 'contact', key: 'contact' },
```

### 4.12 租户搜索补齐"创建时间"（报告§3.6 #15）

**文件**：`src/pages/Tenant.tsx` L140-167

**操作**：同 4.10，增加 `RangePicker` + 时间过滤逻辑。

### 4.13 租户表单补齐"企业地址"（报告§3.6 #16）

**文件**：`src/pages/Tenant.tsx` L197-227

**操作**：在 Modal 的 Form 中增加非必填字段：
```tsx
<Form.Item name="address" label="企业地址">
  <Input placeholder="请输入企业地址" />
</Form.Item>
```

### 4.14 Topbar 租户切换展示方式（报告§3.7 #17）

**文件**：`src/components/Layout/Topbar.tsx` L127-144

**当前**：`Select` 下拉  
**修改**：改为平铺展示（多个 Tag/Button 排列），按关联时间排序，最新在最下方。
- 如仅有1个租户，直接显示文本不展示切换交互

---

## Task 5：CRUD矩阵补齐（13项）

### 5.1 维修管理 — 编辑操作（报告§5 #1）

**文件**：`src/pages/Repair.tsx`

**操作**：
- 在列表操作列增加"编辑"按钮（仅 `status === '维修中'` 时可编辑）
- 复用现有新建 Modal，回显数据
- 编辑提交后更新 `repairs` 数组

### 5.2 租户删除二次确认（报告§5 #2）

**文件**：`src/pages/Tenant.tsx`

**操作**：删除操作包裹 `Modal.confirm`：
```ts
Modal.confirm({
  title: '确认删除',
  content: '删除后数据无法恢复，是否继续？',
  onOk: () => { /* 执行删除 */ },
});
```

### 5.3 已开通账号租户不可删除（报告§5 #3）

**文件**：`src/pages/Tenant.tsx`

**操作**：判断 `tenant.adminAccount` 是否存在，存在则禁用删除按钮，Tooltip 提示"该租户已开通管理员账号，不可删除"。

### 5.4 租户编辑逻辑实现（报告§5 #4）

**文件**：`src/pages/Tenant.tsx`

**操作**：
- 编辑按钮触发 Modal，回显当前租户数据
- 企业编码字段 `disabled`（置灰不可改）
- 提交后更新列表

### 5.5 租户编辑企业编码置灰（报告§5 #5）

> 已在 5.4 中一并处理 ✅

### 5.6 租户开通账号 — 邮箱已存在分支（报告§5 #6）

**文件**：`src/pages/Tenant.tsx`

**操作**：
- 在开通账号 Modal 的提交逻辑中，检查邮箱是否已存在于 `BizUserItem` 列表
- 已存在：展示已有用户信息 + "追加角色" 选项
- 不存在：正常创建流程

### 5.7 租户开通账号 — 复制信息功能（报告§5 #7）

**文件**：`src/pages/Tenant.tsx`

**操作**：开通成功后展示信息弹窗：
```tsx
<Modal title="账号开通成功">
  <p>登录邮箱：{email}</p>
  <p>登录密码：{password}</p>
  <Button onClick={() => { navigator.clipboard.writeText(`邮箱:${email}\n密码:${password}`); message.success('复制成功'); }}>
    复制信息
  </Button>
</Modal>
```

### 5.8 资产删除操作（报告§5 #8~#9）

**文件**：`src/pages/Biz.tsx`

**操作**：
- 在资产列表操作列增加"删除"按钮
- 判断资产是否已关联设备（`vin` 在 `Vehicle[]` 中存在关联）：
  - 已关联：`message.warning('该资产已关联设备，不可删除')`
  - 未关联：`Modal.confirm` 二次确认后执行删除

### 5.9 批量划拨未勾选提示（报告§5 #10）

**文件**：`src/pages/Biz.tsx`

**操作**：在批量划拨按钮 `onClick` 中：
```ts
if (selectedAssets.length === 0) {
  message.warning('请选择指定数据操作');
  return;
}
```

### 5.10 业务用户重置密码两步流程（报告§5 #11）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.1（用户管理UI重构）中一并处理 ✅

### 5.11 角色删除区分提示（报告§5 #12）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.2（角色管理UI重构）中一并处理 ✅

### 5.12 管理员角色不可编辑/删除（报告§5 #13）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.2 中一并处理 ✅

---

## Task 6：异常场景补齐（11项）

### 6.1 租户企业名称唯一性校验（报告§6 #1）

**文件**：`src/pages/Tenant.tsx`

**操作**：在 Modal 的 Form.Item 中增加 `rules` 自定义校验：
```ts
rules: [{
  validator: (_, value) => {
    const exists = tenants.some(t => t.name === value && t.id !== editingId);
    return exists ? Promise.reject('该企业名称已存在，请更换') : Promise.resolve();
  },
}]
```
- 飘红展示在输入框下方

### 6.2 企业编码唯一性 + 格式校验（报告§6 #2）

**文件**：`src/pages/Tenant.tsx`

**操作**：
- 正则校验：`/^[a-zA-Z0-9]+$/`（仅英文+数字）
- 唯一性校验：同 6.1 逻辑
- 组合 rules 数组

### 6.3 租户开通邮箱格式校验文案（报告§6 #3）

**文件**：`src/pages/Tenant.tsx`

**操作**：修改邮箱 Form.Item 的 rules message：
```ts
{ type: 'email', message: '请输入正确格式的邮箱' }
```

### 6.4 维修新建成功提示文案（报告§6 #4）

**文件**：`src/pages/Repair.tsx`

**当前代码**（L77）：`message.success(t('toast.created'))` → 通用"创建成功"  
**修改**：`message.success('新建维修记录成功')`

### 6.5 编辑用户邮箱唯一性校验（报告§6 #5）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.1 中一并处理 ✅

### 6.6 管理员角色用户角色框置灰（报告§6 #6）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.1 中一并处理 ✅

### 6.7 管理员角色用户不可删除（报告§6 #7）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.1 中一并处理 ✅

### 6.8 角色名称唯一性校验（报告§6 #8）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.2 中一并处理 ✅

### 6.9 角色名称≤10字符限制（报告§6 #9）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.2 中一并处理 ✅

### 6.10 新增角色数据权限配置（报告§6 #10）

**文件**：`src/pages/Sys.tsx`

> 将在 Task 8.2 中一并处理 ✅

### 6.11 围栏新建闭合校验（报告§6 #11）

**文件**：`src/pages/Fence.tsx`

**操作**：在自定义围栏提交时增加校验：
```ts
if (customPoints.length < 3) {
  message.warning('围栏至少需要3个点位');
  return;
}
const first = customPoints[0];
const last = customPoints[customPoints.length - 1];
if (first[0] !== last[0] || first[1] !== last[1]) {
  message.warning('围栏点位未闭合，请确保首尾点位相同');
  return;
}
```

---

## Task 7：审计日志防御（1项）

### 7.1 AuditLog 事件描述前端兜底脱敏（报告§7 #6）

**文件**：`src/pages/AuditLog.tsx`

**操作**：在 `description` 列的 `render` 函数中增加正则兜底：
```ts
render: (text: string) => {
  // 兜底脱敏17位VIN码
  let masked = text.replace(/[A-HJ-NPR-Z0-9]{17}/g, (m) => m.slice(0, 6) + '*******' + m.slice(-4));
  // 兜底脱敏车牌号（6-8位字母数字组合）
  masked = masked.replace(/\b[A-Z0-9]{6,8}\b/g, (m) => m.length > 4 ? m.slice(0, 2) + '*'.repeat(m.length - 4) + m.slice(-2) : m);
  return masked;
},
```

---

## Task 8：系统管理 UI 重构（参考示例图，2大项）

> 这是改动量最大的Task，建议在前面所有Task完成后再进行。

### 8.1 用户管理 UI 重构（报告§8.1）

**文件**：`src/pages/Sys.tsx` L124-232

**改动范围**：完全重写用户管理 Tab 区域

| 改动项 | 当前实现 | 目标实现 |
|---|---|---|
| 搜索栏 | 2个Input + 搜索按钮 | 用户名称(Input) + 登录邮箱(Input) + 角色(Select多选) + 创建时间(RangePicker) + 重置/查询按钮 |
| 表格 | 无序号，基础列 | 序号 + 用户昵称 + 登录邮箱 + 角色(多角色"、"分隔) + 创建时间 + 操作列 |
| 分页 | 基础分页 | "共X条记录 第X/X页" + 每页条数(10/20/50/100) + 跳至 |
| 重置密码 | 仅按钮无流程 | 步骤1：确认弹窗(红字"重置密码后该账号旧密码将不可用，是否继续？") → 步骤2：成功弹窗(绿字 + 昵称/邮箱/新密码 + "复制信息"按钮) |
| 删除 | 无确认 | `Modal.confirm` 红字"删除账号后账号将不可用，是否继续？" |
| 编辑邮箱 | 无校验 | 邮箱已存在 → 输入框下方飘红"该邮箱已被使用，请更换" |
| 管理员保护 | 无 | 管理员角色：角色框置灰不可改、删除按钮禁用 |

### 8.2 角色管理 UI 重构（报告§8.2）

**文件**：`src/pages/Sys.tsx` L236-318

**改动范围**：完全重写角色管理 Tab 区域

| 改动项 | 当前实现 | 目标实现 |
|---|---|---|
| 整体布局 | 卡片网格 | **左右分栏**：左侧角色列表(~250px宽) + 右侧权限配置区 |
| 左侧列表 | 无 | 角色名称列表 + 点击选中高亮 + "新增角色"按钮 + 鼠标移入显示编辑/删除图标 |
| 权限配置 | Modal中Checkbox | Tab切换："功能权限" / "数据权限" |
| 功能权限 | 平铺Checkbox | **树形结构**(Tree + Checkbox)，层级展开/折叠 |
| 数据权限 | 无 | 单选："仅本级" / "本级+下级" / "全部下级" |
| 底部操作 | 无 | "保存" / "取消" |
| 删除弹窗 | 无 | 已关联用户：特定文案；未关联用户：另一文案 |
| 管理员保护 | 无 | 管理员角色不可删除、不可配置权限、仅查看 |
| 角色名称校验 | 无 | 唯一性飘红 + ≤10字符限制 |

---

## 执行顺序 & 依赖关系

```
Task 1 (types对齐)
  ├── Task 2 (状态流转) ← 依赖Task 1的枚举修改
  ├── Task 3 (V1.2补齐) ← 独立，但建议在Task 1之后
  ├── Task 4 (字段补齐) ← 依赖Task 1的类型修改
  ├── Task 5 (CRUD矩阵) ← 部分独立，部分依赖Task 1
  ├── Task 6 (异常场景) ← 部分独立，部分并入Task 8
  └── Task 7 (审计日志) ← 完全独立
  
Task 2~7 全部完成后 →
  └── Task 8 (系统管理UI重构) ← 改动量最大，最后做
```

## 工作量估算

| Task | 涉及文件数 | 预估改动行数 | 复杂度 |
|---|---|---|---|
| Task 1 类型对齐 | 1 (types) + mock | ~80行 | 低 |
| Task 2 状态流转 | 3 (Risk/Repair/Fence/Tenant) | ~120行 | 中 |
| Task 3 V1.2补齐 | 2 (Dashboard/Fence) | ~40行 | 低 |
| Task 4 字段补齐 | 8 (Dashboard/Vehicles/Driving/Monitor/Fence/Tenant/Topbar) | ~200行 | 中 |
| Task 5 CRUD矩阵 | 3 (Repair/Tenant/Biz) | ~150行 | 中 |
| Task 6 异常场景 | 3 (Tenant/Repair/Fence) | ~80行 | 低 |
| Task 7 审计日志 | 1 (AuditLog) | ~15行 | 低 |
| Task 8 UI重构 | 1 (Sys) | ~500行 | **高** |
| **合计** | — | **~1185行** | — |

## 每个Task完成后的验证步骤

1. `npx tsc --noEmit` — 类型检查通过
2. `npm run build` — 构建无报错
3. `npm run dev` — 启动开发服务器，人工浏览相关页面确认UI无异常
4. 对照 CodeReview报告 中对应项，逐条确认已修复

---

*TaskPlan 结束*
