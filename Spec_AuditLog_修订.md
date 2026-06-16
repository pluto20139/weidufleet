# SPEC — 日志审计模块修订

**基线版本**: V1.2（当前 `weidu-fleet` 代码库）
**PRD 文档**: `修复方案-3.md` — 日志审计部分
**变更性质**: 对 V1.2 日志审计模块的字段、筛选项、数据模型进行修订

---

## 1. 变更范围总览

本修订仅涉及日志审计模块（`AuditLog.tsx` 及相关文件），不改动其他页面。

| 序号 | 变更项 | 类型 | 说明 |
|------|--------|------|------|
| A1 | 列表字段调整 | 修改 | 移除"操作IP"列；"操作类型"拆分为"操作菜单"+"操作功能"两列；"操作人昵称"改为"操作人"；"事件描述"改为"操作内容" |
| A2 | 筛选项扩展 | 修改 | 4项→7项：新增操作人、所属租户、操作菜单、操作功能；操作时间范围增加默认近7天 |
| A3 | 操作数据映射表 | 新增 | 49条操作菜单/操作功能/操作内容映射规则 |
| A4 | 类型定义更新 | 修改 | `AuditLog` 接口字段调整 |
| A5 | Mock数据更新 | 修改 | mock数据适配新字段结构 |
| A6 | 国际化词条 | 修改 | zh/en/es 同步更新 |

---

## 2. 列表字段（表格列）

### 2.1 新列定义（9列）

| 序号 | 列名 | 字段key | 数据类型 | 格式/说明 | 宽度 |
|------|------|---------|---------|----------|------|
| 1 | 序号 | (auto) | number | 自增序号，按当前页内行号 | 60px |
| 2 | 操作时间 | `time` | string | `YYYY-MM-DD HH:mm:ss`（Santiago时区） | 170px |
| 3 | 操作人 | `nickname` | string | 执行操作的用户昵称 | 120px |
| 4 | 操作账号 | `account` | string | 执行操作的登录邮箱 | 200px |
| 5 | 所属租户 | `tenant` | string | 操作人当前生效的租户名称 | 150px |
| 6 | 操作菜单 | `menu` | string | **仅展示一级菜单名称**（如"账户"、"业务管理"、"围栏管理"） | 120px |
| 7 | 操作功能 | `function` | string | 具象操作名称（如"登录"、"资产划拨"、"新建围栏"） | 120px |
| 8 | 操作内容 | `content` | string | 按模板拼装的可读描述，VIN/车牌脱敏 | ellipsis |
| 9 | 操作结果 | `result` | enum | `成功`（绿色Tag）/ `失败`（红色Tag，Hover显示失败原因） | 100px |

### 2.2 移除的列

| 原列名 | 原字段key | 移除原因 |
|--------|----------|---------|
| 操作IP | `ip` | PRD修订后不再展示 |
| ~~操作类型~~ | ~~`operationType`~~ | 拆分为"操作菜单"+"操作功能"两列 |
| ~~事件描述~~ | ~~`description`~~ | 更名为"操作内容" |

### 2.3 排序与分页

- **排序**: 按操作时间倒序（最新在前）
- **分页**: 默认 20 条/页，支持 10/20/50/100 切换

---

## 3. 筛选项（7项）

### 3.1 筛选项定义

| 序号 | 筛选字段 | 控件类型 | 输入限制 | 匹配规则 | 默认值 |
|------|---------|---------|---------|---------|--------|
| 1 | 操作人 | `Input` 文本输入框 | ≤50字符 | 模糊匹配用户昵称 | 空 |
| 2 | 操作账号 | `Input` 文本输入框 | ≤50字符 | 模糊匹配邮箱 | 空 |
| 3 | 所属租户 | `Select` 下拉选择框 | 单选 | 枚举值：当前应用下所有租户名称 + "全部"选项 | "全部" |
| 4 | 操作菜单 | `Select` 下拉选择框 | **多选** | 枚举值：平台全部一级菜单 + "全部"选项 | "全部" |
| 5 | 操作功能 | `Select` 下拉选择框 | **多选** | 枚举值：系统内所有操作功能；**若已选操作菜单，则仅展示该菜单下的功能** | 空 |
| 6 | 操作时间范围 | `DatePicker.RangePicker` 双日期时间选择器 | 起止时间跨度最长180天；仅可查询过去180天内数据 | 操作时间命中所选区间 | **近7天** |
| 7 | 操作结果 | `Select` 下拉选择框 | 单选 | 枚举值：全部、成功、失败 | "全部" |

### 3.2 操作菜单枚举值（一级菜单）

| 序号 | 操作菜单 |
|------|---------|
| 1 | 账户 |
| 2 | 业务管理 |
| 3 | 租户管理 |
| 4 | 车辆管理 |
| 5 | 围栏管理 |
| 6 | 风控预警 |
| 7 | 维修管理 |
| 8 | 系统管理 |
| 9 | 车辆数据 |

### 3.3 操作功能级联逻辑

当"操作菜单"筛选选择了特定菜单后，"操作功能"下拉选项仅展示该菜单下的操作功能。例如：
- 选择"围栏管理" → 操作功能选项仅展示：新建围栏、编辑围栏、删除围栏、启用围栏、停用围栏、添加车辆、删除车辆
- 选择"全部"或不选 → 操作功能展示所有功能

### 3.4 操作时间范围默认值

- **默认**: 页面加载时自动设置时间范围为 **近7天**（`dayjs().subtract(7, 'day')` ~ `dayjs()`）
- **最大跨度**: 180天，超过时 toast 提示 `查询时间跨度最长180天`
- **禁用日期**: 超过180天前的日期、未来日期均置灰不可选

### 3.5 按钮

| 按钮 | 操作 |
|------|------|
| 查询 | 执行筛选（校验时间跨度≤180天） |
| 重置 | 清空所有筛选条件，时间范围恢复为近7天默认值 |

---

## 4. 操作数据映射表（49条）

日志写入时，按以下映射表拼装"操作菜单"、"操作功能"、"操作内容"三个字段：

| 序号 | 操作菜单 | 操作功能 | 操作内容模板 |
|------|---------|---------|-------------|
| 1 | 账户 | 登录 | 登录系统 |
| 2 | 账户 | 退出 | 退出系统 |
| 3 | 账户 | 修改密码 | 修改密码 |
| 4 | 账户 | 重置密码 | 重置用户【被重置用户邮箱】的密码 |
| 5 | 业务管理 | 新增租户层级 | 新增租户层级【层级名称】 |
| 6 | 业务管理 | 编辑租户层级 | 编辑租户层级【原名称】为【新名称】 |
| 7 | 业务管理 | 删除租户层级 | 删除租户层级【层级名称】 |
| 8 | 业务管理 | 配置功能权限 | 配置【层级名称】的功能权限 |
| 9 | 业务管理 | 同步资产 | 执行资产同步 |
| 10 | 业务管理 | 资产划拨 | 将车辆【脱敏VIN】从【划拨前租户名称】划拨至【划拨后租户名称】 |
| 11 | 业务管理 | 批量资产划拨 | 批量资产划拨：将【N】辆车划拨至【划拨后租户名称】 |
| 12 | 业务管理 | 删除车辆资产 | 删除车辆资产【脱敏VIN】 |
| 13 | 业务管理 | 新增用户 | 新增用户【用户邮箱】，分配角色【角色列表】 |
| 14 | 业务管理 | 编辑用户 | 编辑用户【用户邮箱】信息 |
| 15 | 业务管理 | 删除用户 | 删除用户【用户邮箱】 |
| 16 | 业务管理 | 重置密码 | 重置用户【用户邮箱】的密码 |
| 17 | 业务管理 | 新增角色 | 新增角色【角色名称】 |
| 18 | 业务管理 | 编辑角色 | 编辑角色【角色名称】 |
| 19 | 业务管理 | 删除角色 | 删除角色【角色名称】 |
| 20 | 业务管理 | 编辑功能权限 | 编辑角色【角色名称】的功能权限 |
| 21 | 租户管理 | 新增租户 | 新增租户【租户名称】 |
| 22 | 租户管理 | 编辑租户 | 编辑租户【租户名称】信息 |
| 23 | 租户管理 | 删除租户 | 删除租户【租户名称】 |
| 24 | 租户管理 | 开通主账号 | 为租户【租户名称】开通主账号【账号邮箱】 |
| 25 | 车辆管理 | 批量导入 | 批量导入车辆信息：成功【N】条，失败【M】条 |
| 26 | 围栏管理 | 新建围栏 | 新建围栏【围栏名称】，类型【围栏类型】，预警【预警类型】 |
| 27 | 围栏管理 | 编辑围栏 | 编辑围栏【围栏名称】 |
| 28 | 围栏管理 | 删除围栏 | 删除围栏【围栏名称】 |
| 29 | 围栏管理 | 启用围栏 | 启用围栏【围栏名称】 |
| 30 | 围栏管理 | 停用围栏 | 停用围栏【围栏名称】 |
| 31 | 围栏管理 | 添加车辆 | 为围栏【围栏名称】添加车辆【脱敏VIN】 |
| 32 | 围栏管理 | 删除车辆 | 从围栏【围栏名称】移除车辆【脱敏VIN】 |
| 33 | 风控预警 | 一键报修（故障类） | 一键报修（故障类）：车辆【脱敏VIN】，报警类型【报警类型】 |
| 34 | 风控预警 | 一键报修（电池类） | 一键报修（电池类）：车辆【脱敏VIN】，报警类型【报警类型】 |
| 35 | 维修管理 | 新建维修 | 新建维修记录：车辆【脱敏VIN】，类型【维修类型】 |
| 36 | 维修管理 | 完成维修 | 标记维修完成：车辆【脱敏VIN】，类型【维修类型】 |
| 37 | 维修管理 | 编辑维修 | 编辑维修记录：车辆【脱敏VIN】 |
| 38 | 维修管理 | 删除维修 | 删除维修记录：车辆【脱敏VIN】，类型【维修类型】 |
| 39 | 系统管理 | 新增用户 | 新增用户【用户邮箱】，分配角色【角色列表】 |
| 40 | 系统管理 | 编辑用户 | 编辑用户【用户邮箱】信息 |
| 41 | 系统管理 | 删除用户 | 删除用户【用户邮箱】 |
| 42 | 系统管理 | 重置密码 | 重置用户【用户邮箱】的密码 |
| 43 | 系统管理 | 新增角色 | 新增角色【角色名称】 |
| 44 | 系统管理 | 编辑角色 | 编辑角色【角色名称】 |
| 45 | 系统管理 | 删除角色 | 删除角色【角色名称】 |
| 46 | 系统管理 | 编辑功能权限 | 编辑角色【角色名称】的功能权限 |
| 47 | 车辆数据 | 导出车辆信号数据 | 导出车辆【脱敏VIN】信号数据 |
| 48 | 车辆数据 | 下载导出文件 | 下载导出文件【文件名】 |

**注意**: 操作内容中的【脱敏VIN】、【车牌号】等均按全局脱敏规则执行脱敏展示。

---

## 5. 类型定义

### 5.1 修改 `src/types/index.ts`

```ts
// V1.2 日志审计（修订版）
export interface AuditLog {
  id: string;
  time: string;           // YYYY-MM-DD HH:mm:ss (Santiago时区)
  nickname: string;       // 操作人
  account: string;        // 操作账号(邮箱)
  tenant: string;         // 所属租户
  menu: string;           // 操作菜单（一级菜单名称，如"账户"、"业务管理"）
  function: string;       // 操作功能（具象操作名称，如"登录"、"资产划拨"）
  content: string;        // 操作内容（按模板拼装的可读描述）
  result: '成功' | '失败';
  failReason?: string;    // 失败原因（失败时展示）
}
```

### 5.2 字段变更对照

| 原字段 | 新字段 | 变更说明 |
|--------|--------|---------|
| `ip: string` | — | **删除**，不再展示操作IP |
| `operationType: string` | `menu: string` + `function: string` | **拆分**为两个字段 |
| `description: string` | `content: string` | **重命名**，语义不变 |
| `nickname` | `nickname` | 字段名不变，列标题从"操作人昵称"改为"操作人" |

---

## 6. Mock 数据

### 6.1 修改 `src/api/mock.ts`

**操作类型常量数组改为映射结构**:

```ts
interface AuditOpMapping {
  menu: string;       // 操作菜单
  function: string;   // 操作功能
  contentTpl: string; // 操作内容模板
}

const AUDIT_OP_MAPPINGS: AuditOpMapping[] = [
  { menu: '账户', function: '登录', contentTpl: '登录系统' },
  { menu: '账户', function: '退出', contentTpl: '退出系统' },
  { menu: '账户', function: '修改密码', contentTpl: '修改密码' },
  { menu: '账户', function: '重置密码', contentTpl: '重置用户 maria.g@stgo-transport.cl 的密码' },
  { menu: '业务管理', function: '新增租户层级', contentTpl: '新增租户层级【南区运营中心】' },
  { menu: '业务管理', function: '编辑租户层级', contentTpl: '编辑租户层级【南区运营中心】为【南区运营总部】' },
  { menu: '业务管理', function: '删除租户层级', contentTpl: '删除租户层级【临时测试层级】' },
  { menu: '业务管理', function: '配置功能权限', contentTpl: '配置【南区运营中心】的功能权限' },
  { menu: '业务管理', function: '同步资产', contentTpl: '执行资产同步' },
  { menu: '业务管理', function: '资产划拨', contentTpl: `将车辆 ${maskVin('LJ8T7AD0000100001')} 从 苇渡根租户 划拨至 Santiago Transport` },
  { menu: '业务管理', function: '批量资产划拨', contentTpl: '批量资产划拨：将 12 辆车划拨至 智利物流集团' },
  { menu: '业务管理', function: '删除车辆资产', contentTpl: `删除车辆资产 ${maskVin('LJ8T7AD0000100003')}` },
  // ... 覆盖全部48条映射（mock数据填充具体示例值）
];
```

**Mock数据生成调整**:

```ts
const auditLogData: AuditLog[] = Array.from({ length: 40 }, (_, i) => {
  const mapping = AUDIT_OP_MAPPINGS[i % AUDIT_OP_MAPPINGS.length];
  // ...
  return {
    id: `al-${i + 1}`,
    time: /* ... 同前 ... */,
    nickname,
    account: auditAccounts[nickIdx],
    tenant: auditTenants[i % auditTenants.length],
    menu: mapping.menu,           // 新字段
    function: mapping.function,   // 新字段
    content: mapping.contentTpl,  // 新字段
    result: isFail ? '失败' : '成功',
    ...(isFail ? { failReason: /* ... */ } : {}),
    // ip 字段已移除
  };
});
```

---

## 7. 页面组件修改

### 7.1 `src/pages/AuditLog.tsx` 改动要点

#### 筛选项区域（4项→7项）

| 原筛选项 | 新筛选项 | 变更 |
|---------|---------|------|
| 操作账号(Input) | 操作人(Input) | **新增** |
| — | 操作账号(Input) | 保留 |
| — | 所属租户(Select单选) | **新增** |
| — | 操作菜单(Select多选) | **新增** |
| 操作类型(Select多选) | 操作功能(Select多选) | **重命名+级联逻辑** |
| 操作时间范围(RangePicker) | 操作时间范围(RangePicker) | **增加默认近7天** |
| 操作结果(Select单选) | 操作结果(Select单选) | 保留 |

#### 新增 state 变量

```ts
const [nicknameFilter, setNicknameFilter] = useState('');      // 操作人
const [tenantFilter, setTenantFilter] = useState<string>('');  // 所属租户
const [menuFilter, setMenuFilter] = useState<string[]>([]);    // 操作菜单(多选)
// typeFilter → 重命名为 functionFilter
const [functionFilter, setFunctionFilter] = useState<string[]>([]); // 操作功能(多选)
// timeRange 默认值改为近7天
const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>([
  dayjs().subtract(7, 'day'), dayjs()
]);
```

#### 操作功能级联逻辑

```ts
// 操作功能选项根据操作菜单筛选动态生成
const functionOptions = useMemo(() => {
  if (menuFilter.length === 0) {
    // 未选菜单时展示全部功能
    return allFunctionOptions;
  }
  // 仅展示所选菜单下的功能
  return allLogs
    .filter(l => menuFilter.includes(l.menu))
    .map(l => l.function)
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(v => ({ label: v, value: v }));
}, [menuFilter, allLogs]);
```

#### filteredLogs 逻辑更新

```ts
const filteredLogs = useMemo(() => {
  let result = allLogs;
  // 操作人筛选
  if (nicknameFilter) {
    result = result.filter(l => l.nickname.toLowerCase().includes(nicknameFilter.toLowerCase()));
  }
  // 操作账号筛选
  if (accountFilter) {
    result = result.filter(l => l.account.toLowerCase().includes(accountFilter.toLowerCase()));
  }
  // 所属租户筛选
  if (tenantFilter && tenantFilter !== 'all') {
    result = result.filter(l => l.tenant === tenantFilter);
  }
  // 操作菜单筛选
  if (menuFilter.length > 0) {
    result = result.filter(l => menuFilter.includes(l.menu));
  }
  // 操作功能筛选
  if (functionFilter.length > 0) {
    result = result.filter(l => functionFilter.includes(l.function));
  }
  // 时间范围筛选
  if (timeRange && timeRange[0] && timeRange[1]) {
    const start = timeRange[0].startOf('day');
    const end = timeRange[1].endOf('day');
    result = result.filter(l => {
      const d = dayjs(l.time);
      return d.isAfter(start) && d.isBefore(end);
    });
  }
  // 操作结果筛选
  if (resultFilter && resultFilter !== 'all') {
    result = result.filter(l => l.result === resultFilter);
  }
  return result;
}, [allLogs, nicknameFilter, accountFilter, tenantFilter, menuFilter, functionFilter, timeRange, resultFilter]);
```

#### 表格列定义更新

```ts
const columns: ColumnsType<AuditLogType> = [
  { title: t('audit.seq'), key: 'seq', width: 60, render: (_, __, index) => index + 1 },
  { title: t('audit.time'), dataIndex: 'time', key: 'time', width: 170 },
  { title: t('audit.operator'), dataIndex: 'nickname', key: 'nickname', width: 120 },
  { title: t('audit.account'), dataIndex: 'account', key: 'account', width: 200 },
  { title: t('audit.tenant'), dataIndex: 'tenant', key: 'tenant', width: 150 },
  { title: t('audit.menu'), dataIndex: 'menu', key: 'menu', width: 120, render: (v: string) => <Tag>{v}</Tag> },
  { title: t('audit.function'), dataIndex: 'function', key: 'function', width: 120 },
  { title: t('audit.content'), dataIndex: 'content', key: 'content', ellipsis: true },
  {
    title: t('audit.result'), dataIndex: 'result', key: 'result', width: 100,
    render: (v: string, record: AuditLogType) => (
      <Tooltip title={v === '失败' ? record.failReason : ''}>
        <Tag color={v === '成功' ? 'success' : 'error'}>{v}</Tag>
      </Tooltip>
    ),
  },
];
```

#### 重置函数更新

```ts
const handleReset = () => {
  setNicknameFilter('');
  setAccountFilter('');
  setTenantFilter('');
  setMenuFilter([]);
  setFunctionFilter([]);
  setTimeRange([dayjs().subtract(7, 'day'), dayjs()]); // 恢复默认近7天
  setResultFilter('');
};
```

---

## 8. 国际化

### 8.1 `src/i18n/zh.ts` 更新

```ts
// V1.2 日志审计（修订）
'sidebar.audit_log': '日志审计',
'title.audit_log': '日志审计',
'audit.subtitle': '操作日志记录与查询',
'audit.seq': '序号',
'audit.time': '操作时间',
'audit.operator': '操作人',           // 原 audit.nickname → 改为操作人
'audit.account': '操作账号',
'audit.tenant': '所属租户',
'audit.menu': '操作菜单',             // 新增
'audit.function': '操作功能',          // 新增（替代 audit.operation_type）
'audit.content': '操作内容',           // 新增（替代 audit.description）
'audit.result': '操作结果',
'audit.result_success': '成功',
'audit.result_fail': '失败',
'audit.result_all': '全部',
'audit.filter.nickname': '操作人',     // 新增
'audit.filter.tenant': '所属租户',     // 新增
'audit.filter.menu': '操作菜单',       // 新增
'audit.filter.function': '操作功能',   // 新增（替代 audit.operation_type）
'audit.tenant_all': '全部租户',        // 新增
'audit.menu_all': '全部菜单',          // 新增
'audit.max_range_180': '查询时间跨度最长180天',
'audit.fail_reason': '失败原因',
```

**删除的词条**: `audit.nickname`(操作人昵称)、`audit.ip`(操作IP)、`audit.operation_type`(操作类型)、`audit.description`(事件描述)、`audit.time_range`(操作时间)

### 8.2 `src/i18n/en.ts` 同步更新

```ts
'audit.operator': 'Operator',
'audit.menu': 'Menu',
'audit.function': 'Function',
'audit.content': 'Content',
'audit.filter.nickname': 'Operator',
'audit.filter.tenant': 'Tenant',
'audit.filter.menu': 'Menu',
'audit.filter.function': 'Function',
'audit.tenant_all': 'All Tenants',
'audit.menu_all': 'All Menus',
```

### 8.3 `src/i18n/es.ts` 同步更新

```ts
'audit.operator': 'Operador',
'audit.menu': 'Menu',
'audit.function': 'Funcion',
'audit.content': 'Contenido',
'audit.filter.nickname': 'Operador',
'audit.filter.tenant': 'Inquilino',
'audit.filter.menu': 'Menu',
'audit.filter.function': 'Funcion',
'audit.tenant_all': 'Todos los inquilinos',
'audit.menu_all': 'Todos los menus',
```

---

## 9. 文件变更汇总

| 操作 | 文件 | 变更说明 |
|------|------|---------|
| **修改** | `src/pages/AuditLog.tsx` | 表格列定义（9列重构）、筛选项区域（4→7项）、级联逻辑、默认时间范围 |
| **修改** | `src/types/index.ts` | `AuditLog` 接口：移除 `ip`、`operationType`、`description`；新增 `menu`、`function`、`content` |
| **修改** | `src/api/mock.ts` | mock数据结构适配新字段、操作映射表改为结构化数组 |
| **修改** | `src/i18n/zh.ts` | 更新日志审计相关词条 |
| **修改** | `src/i18n/en.ts` | 同步更新 |
| **修改** | `src/i18n/es.ts` | 同步更新 |

**不改动文件**: `App.tsx`（路由不变 `/sys/audit-log`）、`Sidebar.tsx`（菜单位置不变）

---

## 10. 验证清单

| 序号 | 验证项 | 预期 |
|------|--------|------|
| V1 | 表格列数 | 9列：序号、操作时间、操作人、操作账号、所属租户、操作菜单、操作功能、操作内容、操作结果 |
| V2 | "操作IP"列 | 不展示 |
| V3 | "操作菜单"列 | 仅显示一级菜单名称（如"账户"、"业务管理"、"围栏管理"） |
| V4 | "操作功能"列 | 显示具象操作名称（如"登录"、"资产划拨"、"新建围栏"） |
| V5 | "操作内容"列 | 按映射表模板拼装，VIN/车牌脱敏 |
| V6 | 筛选项数量 | 7个筛选条件 |
| V7 | 操作菜单筛选 | 多选，枚举值为9个一级菜单 |
| V8 | 操作功能级联 | 选择操作菜单后，操作功能选项仅展示该菜单下的功能 |
| V9 | 所属租户筛选 | 单选下拉，含"全部"选项 |
| V10 | 操作时间默认值 | 页面加载时默认为近7天 |
| V11 | 时间跨度校验 | 超过180天时 toast 提示 |
| V12 | 禁用日期 | 180天前及未来日期不可选 |
| V13 | 重置按钮 | 清空所有条件，时间恢复为近7天 |
| V14 | 分页 | 默认20条，支持10/20/50/100 |
| V15 | 排序 | 按操作时间倒序 |
| V16 | 操作结果 | 成功=绿色Tag，失败=红色Tag+Hover显示原因 |
| V17 | 多语言 | zh/en/es 三语同步更新 |
