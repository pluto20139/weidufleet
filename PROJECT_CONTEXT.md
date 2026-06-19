# PROJECT_CONTEXT.md — 智利车队管理平台

> 基于 PRD V6 + 2026-06-18 PRD合规修复 整理，供 AI 编码助手、新成员快速了解项目全貌。

---

## 1. 技术栈

### 1.1 前端框架

| 类别 | 技术选型 | 版本 |
|------|---------|------|
| 语言 | TypeScript | ~5.6.2 |
| 框架 | React | ^18.3.1 |
| 构建工具 | Vite | ^6.0.1 |
| UI 组件库 | Ant Design (antd) | ^5.21.0 |
| 图标库 | @ant-design/icons | ^5.5.1 |
| 路由 | react-router-dom | ^6.28.0 |
| 状态管理 | Zustand（含 persist 中间件） | ^4.5.5 |
| HTTP 客户端 | Axios | ^1.7.7 |
| 国际化 (i18n) | i18next + react-i18next | ^23.16.4 / ^15.1.0 |
| 地图 | Leaflet + react-leaflet | ^1.9.4 / ^4.2.1 |
| 图表 | Chart.js + react-chartjs-2 | ^4.4.4 / ^5.2.0 |
| Excel 处理 | xlsx (SheetJS) | ^0.18.5 |
| 日期处理 | dayjs + dayjs/plugin/utc + dayjs/plugin/timezone | 内置 |
| 单元测试 | Vitest | ^4.1.8 |
| E2E 测试 | Playwright | ^1.60.0 |

### 1.2 后端框架

> **当前阶段：无独立后端。** 前端使用 Mock 数据层（`src/api/mock.ts`）进行开发。
> PRD 定义的架构为对接外部服务：
> - **用户中心**：登录认证、用户管理、密码重置、角色管理
> - **IOT 平台**：设备注册、车辆信号上报、资产同步、设备安装管理
> 
> 后端技术栈待定（TBD），需在正式开发阶段确定。

### 1.3 数据库类型

> **当前阶段：无数据库。** 所有数据存储在前端 Zustand persist（localStorage）和 Mock 内存数据中。
> 数据库选型需在正式开发阶段确定。

---

## 2. 目录规范

### 2.1 项目根目录

```
weidu-fleet/
├── public/                     # 静态资源
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios 实例（baseURL: /api, Bearer Token, 401 自动登出）
│   │   └── mock.ts             # Mock 数据层（全部业务数据模拟，含动态数据生成）
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx   # 主布局容器（Topbar + Sidebar + Content）
│   │   │   ├── Sidebar.tsx     # 左侧导航菜单（13 个一级菜单）
│   │   │   └── Topbar.tsx      # 顶部栏（面包屑、语言切换(中/英)、租户切换、用户菜单）
│   │   ├── LocationPrivacy.tsx # 地理位置脱敏+默认收起「查看位置」点击展开
│   │   └── VehicleData/        # 车辆数据模块公共组件
│   │       ├── DataGridComponent.tsx
│   │       ├── ExportRecordComponent.tsx
│   │       ├── FilterBarComponent.tsx
│   │       └── VehicleTreeComponent.tsx
│   ├── i18n/
│   │   ├── index.ts            # i18next 初始化配置（fallback: en，仅中/英）
│   │   ├── zh.ts               # 中文翻译
│   │   ├── en.ts               # 英文翻译
│   │   └── es.ts               # 西班牙语（已从语言选择移除，文件保留）
│   ├── pages/
│   │   ├── Login.tsx           # 登录页
│   │   ├── Dashboard.tsx       # 首页看板（柱状图6项ADAS + 8指标 + 排行 + 地图）
│   │   ├── Vehicles.tsx         # 车辆管理列表 + 详情
│   │   ├── Vehicles/           # 车辆详情子 Tab 组件
│   │   │   ├── AlertTable.tsx       # 风控预警记录 tab（围栏+故障+电池共23种）
│   │   │   ├── DrivingTable.tsx    # 驾驶预警记录 tab（6种ADAS）
│   │   │   ├── BatteryTable.tsx     # 电池监控信息 tab
│   │   │   ├── ChargeTable.tsx      # 充电记录 tab
│   │   │   ├── TripTable.tsx        # 行程记录 tab（起终点默认收起「查看位置」）
│   │   │   ├── RepairTable.tsx     # 维修记录 tab
│   │   │   └── MileageChart.tsx    # 里程报表 tab（日/周/月/年4种维度）
│   │   ├── Monitor.tsx         # 实时监控（实时位置 + 轨迹回放30天）
│   │   ├── Risk.tsx            # 风控预警（围栏预警/故障预警9种/电池预警14种）
│   │   ├── Driving.tsx         # 驾驶行为（预警 + 报告详情含建议/里程趋势/区域分布）
│   │   ├── Battery.tsx         # 电池管理（监控+充放电记录，详情含SOH/温度/续航/电耗趋势）
│   │   ├── Trips.tsx           # 行程管理
│   │   ├── Fence.tsx           # 围栏管理（中心点/自定义，出入栏预警）
│   │   ├── Repair.tsx          # 维修管理（无编辑，文本描述+类型提示，删除回退报警状态）
│   │   ├── Tenant.tsx          # 租户管理（精准查询+重置+条件删除+开通账号）
│   │   ├── Biz.tsx             # 业务管理（租户权限CRUD/信息树搜索/资产TreeSelect划拨/用户管理树+筛选/角色管理树）
│   │   ├── VehicleSignal.tsx   # 车辆信号数据
│   │   ├── DataExport.tsx      # 数据导出记录（含分页）
│   │   ├── Sys.tsx             # 系统管理 - 用户管理
│   │   ├── SysRoles.tsx        # 系统管理 - 角色管理
│   │   └── AuditLog.tsx        # 系统管理 - 日志审计（47项操作映射）
│   ├── store/
│   │   └── useAppStore.ts      # Zustand 全局状态（含 localStorage 持久化，含bz业务Tab状态）
│   ├── types/
│   │   └── index.ts            # 全局 TypeScript 类型定义（~40接口+类型）
│   ├── utils/
│   │   ├── format.ts           # 时间格式化（智利时区）、时长格式化、车龄计算
│   │   ├── masking.ts          # VIN/车牌脱敏、位置截断、搜索匹配
│   │   ├── trajectory.ts       # 轨迹保留天数配置（30天）
│   │   └── leafletConfig.ts    # Leaflet 地图瓦片配置
│   ├── styles/
│   │   └── global.css          # 全局样式
│   ├── __tests__/              # 8个测试文件，45个用例
│   │   ├── DashboardMetrics.test.tsx
│   │   ├── FenceVehicleSearch.test.tsx
│   │   ├── LocationPrivacy.test.tsx
│   │   ├── VehicleData.integration.test.tsx
│   │   ├── driving-level.test.ts
│   │   ├── i18n-consistency.test.ts
│   │   └── mock-data.test.ts
│   ├── App.tsx                 # 路由定义（React.lazy 懒加载）
│   ├── main.tsx                # 应用入口（BrowserRouter + ConfigProvider + dayjs 时区）
│   └── vite-env.d.ts           # Vite 类型声明
├── e2e/                        # Playwright E2E 测试
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite 配置（别名 @ → src/，端口 3002）
└── CLAUDE.md                   # AI 辅助开发说明文档
```

### 2.2 命名约定

| 类别 | 规范 |
|------|------|
| 页面组件 | PascalCase，文件名与组件同名（如 `Dashboard.tsx`） |
| 子组件目录 | 与父组件同名的文件夹（如 `pages/Vehicles/`） |
| 工具函数 | camelCase（如 `maskVin`, `formatTime`） |
| 类型/接口 | PascalCase（如 `Vehicle`, `RepairItem`） |
| Store | `use` + 名称 + `Store`（如 `useAppStore`） |
| CSS | 全局样式集中在 `styles/global.css`，组件样式使用内联 style 或 Ant Design Token |
| i18n Key | `模块.字段` 格式（如 `menu.vehicles`, `risk.repairing`） |
| 路由路径 | kebab-case（如 `/vehicle-signal`, `/data-export`） |

---

## 3. 架构约束

### 3.1 前端架构

1. **SPA 单页应用**：基于 React + React Router v6，全部页面懒加载（`React.lazy`）
2. **状态管理**：单一 Zustand Store（`useAppStore`），通过 `persist` 中间件将 `page/user/token/lang/tenant` 持久化到 localStorage。非持久化状态包括 `bz`（业务管理当前Tab）、`detail`（车辆详情VIN）、各模块内部筛选条件等
3. **国际化**：仅支持中文（`zh`）和英文（`en`）切换，默认英文。`es` 翻译文件保留但不在 Topbar 语言选择中展示
4. **路径别名**：`@` 映射到 `src/` 目录（vite.config.ts + tsconfig）
5. **开发端口**：`localhost:3002`
6. **Ant Design 主题**：全局 `fontSize: 15px`，支持中文/英文 locale 切换

### 3.2 地图与可视化

1. **地图**：使用 Leaflet + OpenStreetMap 瓦片（`leafletConfig.ts` 配置）
2. **图表**：使用 Chart.js + react-chartjs-2，用于驾驶风险柱状图、里程折线图、电耗趋势图等
3. **地图交互**：支持拖拽、缩放、车辆聚合显示、轨迹播放（1/2/4/8 倍速）

### 3.3 数据流架构

```
┌──────────┐    ┌──────────┐    ┌──────────────┐
│  IOT平台  │───▶│  后端API  │───▶│  前端(client) │
└──────────┘    └──────────┘    └──────┬───────┘
                                       │
              ┌──────────┐            │
              │  用户中心  │───────────┘
              └──────────┘     (当前: mock.ts 模拟)
```

- 当前阶段所有数据由 `src/api/mock.ts` 内存模拟（含动态数据生成和状态变更）
- `src/api/client.ts` 已配置 Axios 实例（`baseURL: /api`），预留后端对接
- 401 响应自动清除 token 并跳转登录页

### 3.4 时区约束

- 全局时间统一使用 **智利时区**（`America/Santiago`）
- 通过 `dayjs/plugin/timezone` 初始化默认时区（`src/utils/format.ts`）
- 冬令时：UTC-4（每年 4 月第一个星期六 24:00 → 9 月第一个星期六 24:00）
- 夏令时：UTC-3（每年 9 月第一个星期六 24:00 → 次年 4 月第一个星期六 24:00）

### 3.5 安全与隐私

1. **VIN 脱敏**：保留前 6 位 + 7 个 `*` + 后 4 位（例：`LSG4AA*******5678`）
2. **车牌脱敏**：首尾各保留 2 位，中间用 `*` 替换（例：`AB**12`）；≤ 4 位不脱敏
3. **位置精度**：经纬度逆地址解析仅保留至街道/路口级别，移除门牌号。**所有位置默认收起**，点击"查看位置"展开
4. **搜索规则**：支持明文精确匹配和脱敏后可见字符模糊匹配
5. **导出规则**：Excel 导出文件必须使用明文，仅前端展示脱敏

### 3.6 认证流程

1. 登录页（`/login`）输入邮箱 + 密码 + 验证码
2. 认证成功后将 `token` + `user` 写入 Zustand Store（持久化）
3. App.tsx 通过 `page !== 'login'` 判断认证状态，未认证自动跳转 `/login`
4. Token 通过 Axios Request Interceptor 以 `Bearer` 方式注入请求头
5. 初始密码/重置密码后首次登录，强制弹出修改密码弹窗
6. 修改密码规则：8~18 位，支持数字、英文、特殊字符

---

## 4. 核心业务模块

### 4.1 模块总览

| 序号 | 一级菜单 | 二级菜单 | 功能类型 | 数据来源 |
|------|---------|---------|---------|---------|
| 1 | 首页看板 | — | 定制 | OBD+车身 |
| 2 | 车辆管理 | 车辆列表 + 车辆详情（7个Tab） | 定制 | OBD+车身 |
| 3 | 实时监控 | 实时位置 / 轨迹回放(30天) | 基线 | OBD |
| 4 | 风控预警 | 围栏预警 / 故障预警(9种) / 电池预警(14种) | 基线+定制 | OBD+车身 |
| 5 | 驾驶行为 | 驾驶预警(6种ADAS) / 驾驶报告(含建议) | 定制 | OBD+车身 |
| 6 | 电池管理 | 电池监控(4项聚合指标+详情) / 充放电记录 | 定制 | 车身信号 |
| 7 | 行程管理 | 行程记录 | 定制 | OBD+车身 |
| 8 | 围栏管理 | 围栏管理(中心点/自定义, 出入栏预警) | 基线 | OBD |
| 9 | 维修管理 | 维修记录(无编辑,文本描述+类型提示,删除回退) | 定制 | 车队录入 |
| 10 | 租户管理 | 租户管理(精准查询+重置+条件删除) | 基线 | 车队录入 |
| 11 | 业务管理 | 租户权限(CRUD) / 租户信息(树搜索) / 资产划拨(TreeSelect+时间筛选) / 用户管理(租户树+多维筛选) / 角色管理(租户树) | 基线 | 车队录入+IOT |
| 12 | 车辆数据 | 车辆信号数据 / 数据导出记录(含分页) | 定制 | OBD |
| 13 | 系统管理 | 用户管理 / 角色管理 / 日志审计(47项) | 基线+定制 | 车队录入 |

### 4.2 关键业务规则

#### 预警体系
- **9 种故障预警枚举**（联合类型 `FaultType`）：`'VDC' | 'CDCU' | 'BDCU' | 'ADAS' | 'DC-DC温度' | 'DC-DC状态' | '驱动电机控制器温度' | '驱动电机温度' | '高压互锁状态'`
- **14 种电池预警枚举**（`BatteryAlert.type`）：`'SOC过低' | '电池高温' | 'SOC跳变' | '充电故障' | '温差报警' | '储能过压' | '储能欠压' | '单体过压' | '单体欠压' | 'SOC过高' | '储能不匹配' | '单体一致性差' | '绝缘报警' | '储能过充'`
- **6 种驾驶预警枚举**（联合类型 `DrivingAlertType`）：`'对车一级预警' | '对车二级预警' | '对车AEB制动' | '对人一级预警' | '对人二级预警' | '对人AEB制动'`
- **2 种围栏预警类型**（`FenceItem.alertType`）：`'出栏预警' | '入栏预警'`（V5.1 PM 确认：故障/电池枚举保持"报警"，模块标题/列名/围栏用"预警"）

#### 维修状态流
```
未处理(Pending) ──[一键报修]──▶ 维修中(WorkOrder) ──[完成维修]──▶ 维修完成(Fixed)
   ▲                                  │
   └────[删除维修记录]──(回退)──────────┘（status → 'Pending'）
```
- 维修管理**无编辑功能**（PM 确认 V5.1）
- 新建维修描述为**文本输入**（TextArea），placeholder 根据类型动态提示（故障类→9种提示，电池类→14种提示）
- 故障/电池预警仅 `Pending` 状态展示「一键报修」按钮

#### 充电状态（5种）
`'未充电' | '准备充电' | '充电中' | '对方放电' | '故障&异常'`

#### 驾驶风险等级
| 等级 | 预警次数 |
|------|---------|
| 安全司机 | ≤ 1 |
| 低危司机 | 2~3 |
| 中危司机 | 4~6 |
| 高危司机 | > 6 |

#### 驾驶评分（5项各20%权重）
急加速(20%) | 急减速(20%) | 急转弯(20%) | 疲劳驾驶(20%) | AEB制动(20%)

#### 驾驶报告详情页（数据驱动）
- **累计行驶里程**：`DrivingReport.km`
- **累计行驶时长**：`DrivingReport.cumulativeHours`
- **平均车速**：`DrivingReport.avgSpeed`
- **驾驶评分**：`DrivingReport.score`
- **里程趋势**：`DrivingReport.mileageTrend[]`（专属于该报告）
- **区域分布**：`DrivingReport.regionDistribution[]`（专属于该报告）
- **改善建议**：`DrivingReport.suggestions[]`（数据驱动，有兜底）

#### 电池监控详情页
展示指标：SOC | SOH(健康度) | 温度 | 续航 | 累计充电次数 | 充电状态 | VIN/车牌 | 车型
图表：日均电耗趋势折线图（近30天）

#### 行程定义
- **开始**：设备开始上报 GPS 且持续 ≥ 5 分钟
- **结束**：设备超过 10 分钟未上报定位数据
- **轨迹保留**：**30 天**，超出后隐藏地图显示占位符

### 4.3 数据范围控制
- 登录后切换至某租户，所有模块仅展示 `车辆归属租户 = 当前租户` 的数据
- 下级租户的车辆、预警、行程等运营数据，上级不可见
- **业务管理、实时监控** 菜单支持跨租户，展示全部下级租户数据

### 4.4 业务管理模块结构（Biz.tsx）

业务管理是最复杂的管理模块，包含5个Tab页，通过 Zustand `bz` 状态控制当前激活Tab：

| Tab | 功能 | 左侧组件 | 右侧功能 |
|-----|------|---------|----------|
| 租户权限 | 租户层级CRUD + 功能权限配置 | 租户树（增删改按钮） | Checkbox.Group功能权限 |
| 租户信息 | 租户树搜索 + 详情展示 | 租户树（模糊搜索） | Descriptions租户详情 |
| 资产划拨 | 资产管理 + 划拨/同步 | — | TreeSelect租户筛选 + 时间范围 + VIN精准 + 批量划拨 |
| 用户管理 | 用户CRUD + 多维筛选 | 租户树（选择联动） | 昵称/邮箱/角色多选/日期范围 + 管理员保护 |
| 角色管理 | 角色CRUD + 权限配置 | 租户树（选择联动） | 左右布局：角色列表(内联编辑) + 功能权限/数据权限 |

**权限保护规则**：
- 管理员角色不可编辑、不可删除、权限不可修改
- 管理员账号不可删除，编辑时角色Select置灰
- 角色名称唯一性校验，`maxLength={10}`
- 删除角色时根据是否关联用户显示不同确认提示

---

## 5. 权限体系

### 5.1 多租户层级 RBAC 模型

```
根级租户（苇渡汽车）
 └── 一级租户（定义本级功能权限）
      └── 二级租户
           └── 三级租户 ...
```

- **根级租户**：默认拥有全部功能权限，不可配置修改
- **一级租户**：在租户维度配置功能权限，可选范围为应用全部功能权限
- **二级及以下**：在租户层级维度配置，按层级模板批量定义
- **租户树组件**：业务管理各Tab（权限/信息/用户/角色）和资产管理均内置左侧租户树，支持选择后联动右侧数据

### 5.2 用户-租户-角色关系

- 一个用户可关联多个租户（通过邮箱唯一标识）
- 用户在不同租户下可拥有不同角色
- 租户切换后，左侧菜单根据该租户下角色权限动态展示
- 管理员角色由上级租户开通时自动创建，**不可编辑、不可删除、不可修改权限**
- 管理员账号**不可删除**，编辑时角色不可更改

### 5.3 权限控制层级

| 层级 | 说明 |
|------|------|
| 菜单可见性 | 根据用户在当前租户的角色权限控制一级/二级菜单显示 |
| 操作按钮 | 新增/编辑/删除等操作按钮根据权限控制 |
| 数据范围 | 租户维度隔离，上级不可见下级数据（业务管理/实时监控除外） |

### 5.4 初始密码规则
- 新建用户/重置密码：大写字母 + 数字组合，8 位随机字符
- 首次登录或重置后登录强制修改密码

### 5.5 日志审计（47 项操作映射）

系统自动记录关键操作的审计日志，至少保留 180 天。**无"编辑维修"操作**（PRD V5 确认删除）。

| 操作菜单 | 操作功能数量 |
|---------|------------|
| 账户（登录/退出/修改密码/重置密码） | 4 |
| 业务管理（租户层级/资产/用户/角色） | 16 |
| 租户管理（增删改/开通账号） | 4 |
| 车辆管理（批量导入） | 1 |
| 围栏管理（增删改/开关/车辆配置） | 7 |
| 风控预警（一键报修-故障/电池） | 2 |
| 维修管理（新建/完成/删除 — **无编辑**） | 3 |
| 系统管理（用户/角色增删改 + 权限编辑） | 8 |
| 车辆数据（导出/下载） | 2 |

---

## 6. 接口规范

### 6.1 当前状态

> **全量使用 Mock 数据**（`src/api/mock.ts`），无真实后端接口。
> `src/api/client.ts` 已预配置 Axios 实例，待后端就绪后替换为真实 API 调用。

### 6.2 API 客户端配置（预设）

```typescript
// src/api/client.ts
const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});
// Request Interceptor: 注入 Bearer Token
// Response Interceptor: 401 自动登出
```

### 6.3 接口分类规划（基于 PRD 功能模块）

#### 认证与用户中心对接
| 接口 | 方法 | 说明 |
|------|------|------|
| `/auth/login` | POST | 登录（邮箱 + 密码 + 验证码） |
| `/auth/logout` | POST | 退出登录 |
| `/auth/change-password` | PUT | 修改密码 |
| `/auth/reset-password` | POST | 重置用户密码（管理员操作） |

#### 租户管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/tenants` | GET | 查询下级租户列表（支持分页/筛选） |
| `/tenants` | POST | 新增下级租户 |
| `/tenants/:id` | PUT | 编辑租户信息 |
| `/tenants/:id` | DELETE | 删除租户（未开通主账号时） |
| `/tenants/:id/activate` | POST | 开通主账号 |

#### 业务管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/biz/tenant-tree` | GET | 租户层级树 |
| `/biz/tenant-tree/:id` | POST/PUT/DELETE | 租户层级增删改 |
| `/biz/tenant-tree/:id/permissions` | PUT | 配置功能权限 |
| `/biz/assets` | GET | 资产列表（支持租户多选筛选+未划拨） |
| `/biz/assets/sync` | POST | 从 IOT 平台同步资产 |
| `/biz/assets/transfer` | POST | 资产划拨（单条/批量） |
| `/biz/assets/transfer-records` | GET | 划拨记录 |
| `/biz/assets/:vin` | DELETE | 删除资产 |
| `/biz/users` | GET/POST/PUT/DELETE | 用户管理 CRUD |
| `/biz/roles` | GET/POST/PUT/DELETE | 角色管理 CRUD |

#### 车辆管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/vehicles` | GET | 车辆列表（支持筛选/分页） |
| `/vehicles/:vin` | GET | 车辆详情（静态 + 动态 + 设备信息） |
| `/vehicles/import` | POST | 批量导入（Excel，可覆盖:车牌/外观/车型/购车时间，不可覆盖:VIN/设备ID/总里程/电池版本/最后位置） |
| `/vehicles/:vin/alerts` | GET | 风控预警记录 tab（23种预警汇总） |
| `/vehicles/:vin/driving-alerts` | GET | 驾驶预警记录 tab（6种ADAS含位置车速） |
| `/vehicles/:vin/battery` | GET | 电池监控信息 tab |
| `/vehicles/:vin/charges` | GET | 充电记录 tab |
| `/vehicles/:vin/trips` | GET | 行程记录 tab（起终点默认收起） |
| `/vehicles/:vin/repairs` | GET | 维修记录 tab |
| `/vehicles/:vin/mileage` | GET | 里程报表（按日/周/月/年） |

#### 风控预警
| 接口 | 方法 | 说明 |
|------|------|------|
| `/risk/fence-alerts` | GET | 围栏预警列表 |
| `/risk/fault-alerts` | GET | 故障预警列表（9种类型筛选） |
| `/risk/fault-alerts/:id/repair` | POST | 故障预警一键报修（状态→维修中） |
| `/risk/battery-alerts` | GET | 电池预警列表（14种类型筛选） |
| `/risk/battery-alerts/:id/repair` | POST | 电池预警一键报修（状态→维修中） |

#### 驾驶行为
| 接口 | 方法 | 说明 |
|------|------|------|
| `/driving/alerts` | GET | 驾驶预警列表（6种ADAS筛选，位置默认收起） |
| `/driving/reports` | GET | 驾驶报告列表（周报/月报tab，含风险等级筛选） |
| `/driving/reports/:id` | GET | 驾驶报告详情（指标+里程趋势+区域分布+改善建议） |

#### 电池管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/battery/monitor` | GET | 电池监控列表（含4项聚合指标:平均SOC/温度/续航/低电预警数） |
| `/battery/monitor/:vin` | GET | 电池监控详情（SOC/SOH/温度/续航/充电次数/状态/日均电耗趋势） |
| `/battery/charges` | GET | 充电记录 |
| `/battery/discharges` | GET | 放电记录 |

#### 行程管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/trips` | GET | 行程记录列表 |
| `/trips/:id` | GET | 行程详情（含轨迹坐标点） |

#### 围栏管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/fences` | GET | 围栏列表（出入栏预警，中心点/自定义） |
| `/fences` | POST | 新建围栏 |
| `/fences/:id` | PUT | 编辑围栏（关闭时才可编辑） |
| `/fences/:id` | DELETE | 删除围栏（关闭时才可删除） |
| `/fences/:id/toggle` | PUT | 启用/停用围栏 |
| `/fences/:id/vehicles` | GET/POST/DELETE | 围栏车辆配置 |

#### 维修管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/repairs` | GET | 维修记录列表（类型+状态筛选，无编辑按钮） |
| `/repairs` | POST | 新建维修记录（描述联动9种故障/14种电池） |
| `/repairs/:id/complete` | PUT | 完成维修（状态→维修完成） |
| `/repairs/:id` | DELETE | 删除维修记录（预警状态回退→未处理） |

#### 实时监控
| 接口 | 方法 | 说明 |
|------|------|------|
| `/monitor/realtime` | GET | 实时位置数据（地图打点+车牌+企业+速度+SOC） |
| `/monitor/trajectory` | GET | 轨迹回放数据（按天，30天内，支持1/2/4/8倍播放） |

#### 车辆数据
| 接口 | 方法 | 说明 |
|------|------|------|
| `/vehicle-data/signals` | GET | 车辆信号数据（支持导出） |
| `/vehicle-data/exports` | GET | 数据导出记录列表 |
| `/vehicle-data/exports/:id/download` | GET | 下载导出文件 |

#### 系统管理
| 接口 | 方法 | 说明 |
|------|------|------|
| `/sys/users` | GET/POST/PUT/DELETE | 用户管理 CRUD |
| `/sys/roles` | GET/POST/PUT/DELETE | 角色管理 CRUD |
| `/sys/audit-log` | GET | 日志审计列表（47项操作映射，180天范围，操作菜单多选筛选） |

#### 首页看板
| 接口 | 方法 | 说明 |
|------|------|------|
| `/dashboard/metrics` | GET | 基本指标（车辆总数/在线/离线/今日里程/累计里程/驾驶预警/围栏预警/低电预警） |
| `/dashboard/driving-chart` | GET | 驾驶风险图表（6种ADAS，今日/7日/30日，Y轴%） |
| `/dashboard/ranking` | GET | 今日预警排行榜（驾驶/围栏/故障/低电，按总分倒序） |
| `/dashboard/realtime-map` | GET | 实时位置地图数据 |

### 6.4 接口通用规范

| 规范项 | 说明 |
|--------|------|
| 鉴权 | Bearer Token（通过 `Authorization` Header 传递） |
| 错误码 | 401 未认证（自动跳转登录），403 无权限，4xx 参数错误，5xx 服务端错误 |
| 时间格式 | `YYYY-MM-DD HH:mm:ss`（智利时区 `America/Santiago`） |
| 分页 | 支持 `page` + `pageSize`，默认 20 条/页，支持 10/20/50/100 |
| 排序 | 默认按时间倒序 |
| 搜索 | VIN/车牌支持明文精确匹配 + 脱敏后可见字符模糊匹配 |
| 脱敏 | 后端存储明文，返回给前端的 VIN/车牌/位置字段按规则脱敏；导出接口返回明文 |
| 租户隔离 | 所有业务接口自动按 `当前租户 ID` 过滤数据 |
| 语言 | 接口通过 Header `Accept-Language` 或 Token 中的用户偏好返回对应语言内容 |

---

## 附录：全局 TypeScript 类型（核心）

```typescript
// src/types/index.ts 核心类型

Vehicle           // 车辆（静态 + 动态信息），charging: 5种
AlertRecord       // 通用预警记录
FenceItem          // 围栏（alertType: '出栏预警' | '入栏预警'）
FenceAlert         // 围栏预警
FaultAlert         // 故障预警（type: FaultType = 9种联合类型）
BatteryAlert       // 电池预警（type: 14种联合类型）
DrivingAlert       // 驾驶预警（type: DrivingAlertType = 6种联合类型）
DrivingReport      // 驾驶报告（含 cumulativeHours / avgSpeed / suggestions / mileageTrend / regionDistribution）
BatteryMonitorItem // 电池监控（status: 5种充电状态）
ChargeRecord       // 充电记录
DischargeRecord    // 放电记录
TripRecord         // 行程记录
TripDetail         // 行程详情
RepairItem         // 维修记录（含 sourceAlertId / sourceAlertType，无编辑操作）
TenantItem         // 租户
AssetItem          // 资产
BizUserItem        // 业务用户
BizRoleItem        // 业务角色
AuditLog           // 审计日志（47项操作映射）
TransferRecord     // 资产划拨记录
PageKey            // 页面路由枚举
Lang               // 语言类型 ('zh' | 'en')
```
