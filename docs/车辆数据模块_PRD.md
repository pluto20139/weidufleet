# 车辆数据模块 PRD

> 基于代码现状 + PRD V6 整理，聚焦 **车辆信号数据** 和 **数据导出记录** 两个功能。

---

## 1. 模块概览

| 项目 | 说明 |
|------|------|
| 菜单名 | 车辆数据（菜单序号 12） |
| 导航路由 | `/vehicle-signal`、`/data-export` |
| 功能类型 | 定制开发 |
| 数据来源 | OBD（车身信号） |
| 当前状态 | Mock 原型阶段（无 API 对接） |
| 所需权限 | 菜单可见性 → 车辆数据；操作按钮 → 导出/下载 |

### 页面关系

```
车辆信号数据                         数据导出记录
（查询+提交导出）                     （跟踪+下载）
┌──────────┐                        ┌──────────┐
│ 选车     │  导出CSV                │ 处理中   │
│ 选时间   │ ───────▶ POST /exports  │ 已完成   │
│ 选信号   │          toast          │ 可下载   │
│ 查数据   │                        └──────────┘
└──────────┘
```

---

## 2. 车辆信号数据（VehicleSignal）

### 2.1 功能描述

支持用户按**车辆**、**时间范围**、**信号指标**三个维度筛选车辆信号数据，以动态列数据表格展示查询结果，并将筛选条件提交为 CSV 导出任务。

### 2.2 页面布局

```
┌──────────────────┬────────────────────────────────────────────┐
│ 左侧车辆树        │ 筛选栏（时间选择 + 信号选择 + 搜索/重置） [导出CSV] │
│ （最多选10辆）     ├────────────────────────────────────────────┤
│                  │ 动态列数据表格                               │
│ 搜索框            │ 固定列：序号 / 车牌号(脱敏) / 上报时间 / 设备ID  │
│ 租户1 ─ 车A      │ 动态列：根据选中信号生成（约20种可用信号）        │
│       └ 车B      ├────────────────────────────────────────────┤
│ 租户2 ─ 车C      │ 共 xxx 条记录                [分页器]         │
│       └ 车D      └────────────────────────────────────────────┘
└──────────────────┘
```

### 2.3 筛选条件

| 条件 | UI 控件 | 约束 |
|------|---------|------|
| 车辆 | Tree（checkable，租户分组，搜索过滤） | 最多选 **10 辆**，超限阻止并提示 |
| 时间范围 | RangePicker（`showTime`） | 精确到分，格式 `YYYY/MM/DD HH:mm` |
| 信号指标 | TreeSelect（`treeCheckable`，`SHOW_CHILD`） | 5 组共 20 个信号，支持全选/取消全选 |

**校验规则：** 点击搜索或导出时，三个条件必须全部已选，否则弹出警告。

### 2.4 可选的信号字段（5 组 20 项）

#### 电池监控（6 项）

| Key | 中文名 | 单位/格式 | 数据范围 |
|-----|--------|-----------|----------|
| `soc` | SOC 值 | % | 0–100 |
| `soh` | 电池健康度 | % | 0–100 |
| `max_temp` | 电池温度（平均） | ℃ | 0–60 |
| `range` | 续航里程数 | km | — |
| `daily_consumption` | 日均电耗 | kWh | — |
| `charge_status` | 充电状态 | 枚举 | 0=停车充电, 1=行车充电, 2=未充电, 3=充电完成 |

#### 充电记录（6 项）

| Key | 中文名 | 单位/格式 | 数据范围 |
|-----|--------|-----------|----------|
| `charge_record_status` | 充电状态 | — | — |
| `total_voltage` | 充电电压 | V | 400–800 |
| `total_current` | 充电电流 | A | -50–50 |
| `charge_power` | 充电功率 | kW | — |
| `charge_before` | 充电前电量 | % | 0–100 |
| `charge_after` | 充电后电量 | % | 0–100 |

#### 行程记录（4 项）

| Key | 中文名 | 单位/格式 | 数据范围 |
|-----|--------|-----------|----------|
| `avg_speed` | 平均车速 | km/h | — |
| `max_speed` | 最高车速 | km/h | — |
| `min_speed` | 最低车速 | km/h | — |
| `mileage` | 行驶里程 | km | — |

#### 风控预警（2 项）

| Key | 中文名 | 单位/格式 | 数据范围 |
|-----|--------|-----------|----------|
| `insulation` | 绝缘电阻 | kΩ | 0–1000 |
| `temp_alert` | 温度差异报警 | 布尔 | true=异常, false=正常 |

#### 驾驶预警（2 项）

| Key | 中文名 | 单位/格式 | 数据范围 |
|-----|--------|-----------|----------|
| `driving_fcw1` | 对车一级预警 | — | — |
| `driving_fcw2` | 对车二级预警 | — | — |

### 2.5 数据展示列

#### 固定列（始终显示）

| 列名 | 数据字段 | 宽度 | 渲染 |
|------|---------|------|------|
| 序号 | `index` | 80px | 自动 `index + 1` |
| 车牌号 | `plate` | 120px | **脱敏展示**（maskPlate），导出用明文 |
| 上报时间 | `timestamp` | 180px | ISO 格式，智利时区 |
| 设备 ID | `deviceId` | 160px | 设备编号 |

#### 动态列

根据 `selectedSignals` 动态生成，列标题映射：

| Signal Key | 列标题 |
|-----------|--------|
| soc | SOC |
| soh | SOH |
| total_voltage | 总电压 |
| total_current | 总电流 |
| max_temp | 最高单体温度 |
| insulation | 绝缘电阻 |
| charge_status | 充电状态 |
| temp_alert | 温度差异报警 |
| 其他 | 使用 signal Key 本身 |

- 空值统一渲染为 `—`
- 表格启用横向滚动（`scroll.x: max-content`）
- 不支持按信号列排序

### 2.6 脱敏规则（V1.2）

- **前端展示：** 车牌号通过 `maskPlate` 脱敏（首尾各 2 位保留，中间替换为 `*`，例 `AB**12`）
- **导出文件：** 必须使用明文（不脱敏）

### 2.7 分页

| 参数 | 默认值 | 可选值 |
|------|--------|--------|
| `pageSize` | 100 | 10 / 20 / 50 / 100 |
| 排序 | 按上报时间倒序 | — |
| 总数 | 服务端返回 `total` | 前端显示 "共 xxx 条记录" |

### 2.8 导出流程

```
用户点击 [导出 CSV]
        │
        ├── 校验：已选车辆 && 已选时间 && 已选信号？
        │   └── 否 → 弹出警告（vds.warning.incomplete_form）
        │
        ├── POST /vehicle-data/exports
        │   Body: { vehicleIds, startTime, endTime, signals }
        │
        ├── 后端返回：{ id, filename, status: 'processing', createdAt }
        │
        ├── 前端弹出 success toast
        │   "导出任务已生成，请前往数据导出记录查看"
        │
        └── 用户导航至 /data-export 跟踪状态
```

参数详情：

| 参数 | 类型 | 说明 |
|------|------|------|
| `vehicleIds` | `string[]` | 明文 VIN 列表 |
| `startTime` | `string` | 开始时间（智利时区 ISO） |
| `endTime` | `string` | 结束时间（智利时区 ISO） |
| `signals` | `string[]` | 选中的信号 Key 列表 |

### 2.9 审计日志

| 操作菜单 | 操作功能 | 内容模板 |
|---------|---------|---------|
| 车辆数据 | 导出车辆信号数据 | "导出车辆 {车牌(脱敏)} 信号数据（{信号数量} 个信号, {时间范围}）" |

---

## 3. 数据导出记录（DataExport）

### 3.1 功能描述

展示当前租户下所有导出任务的记录列表，支持查看任务状态（处理中 / 已完成）和下载已完成 CSV 文件。

### 3.2 页面布局

```
┌──────────────────────────────────────────────────────────────────┐
│ 数据导出记录                                                      │
│ ℹ 最多保留 30 天内的记录，文件有效期 7 天                            │
├──────────────────────────────────────────────────────────────────┤
│ 📊 文件名         | 筛选条件摘要      | 条数      | 创建时间 | 状态 | 操作 │
│ 📊 xxx_V001_...   | 多车(2辆)\|1h... | —        | 06-10  | ⏳处理中 | 处理中 │
│ 📊 xxx_V005_...   | VIN: LF...       | 27,567   | 06-09  | ✅已完成 | [下载] │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 表格列定义

| 列 | 字段 | 渲染说明 |
|----|------|---------|
| 文件名 | `filename` | 📊 图标 + 文件名 |
| 筛选条件摘要 | `filterSummary` | 文本描述（如"多车(2辆) \| 1小时 \| 8个信号"） |
| 数据条数 | `totalCount` | 已完成 → 千分位数字（`toLocaleString`）；处理中 → `—` |
| 创建时间 | `createdAt` | 原始字符串 `YYYY-MM-DD HH:mm:ss` |
| 状态 | `status` | `processing` → 蓝色旋转 Tag（SyncOutlined）；`completed` → 绿色勾 Tag（CheckCircleOutlined） |
| 操作 | — | 已完成 → [下载] 按钮（DownloadOutlined）；处理中 → 禁用 + Spin |

### 3.4 记录字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✓ | 记录唯一标识 |
| `filename` | `string` | ✓ | 导出文件名，格式：`{业务类型}_{版本}_{日期}.csv` |
| `filterSummary` | `string` | ✓ | 筛选条件摘要文本 |
| `totalCount` | `number \| null` | ✓ | 数据条数，处理中为 null |
| `createdAt` | `string` | ✓ | 创建时间 `YYYY-MM-DD HH:mm:ss` |
| `status` | `'processing' \| 'completed'` | ✓ | 处理状态 |

### 3.5 数据约束

| 约束项 | 规则 |
|--------|------|
| 记录保留期 | 最多 **30 天**，过期自动清理 |
| 文件有效期 | 生成后 **7 天**内可下载，过期文件不可恢复 |
| 状态流转 | `processing` → `completed`（单向，暂不支持失败状态） |
| 数据范围 | 仅展示当前租户下的导出记录 |

### 3.6 下载流程

```
用户点击 [下载]
        │
        └── GET /vehicle-data/exports/:id/download
                │
                └── 后端返回 CSV 文件流
                    Content-Type: text/csv
                    Content-Disposition: attachment; filename="xxx.csv"
                    │
                    └── 浏览器触发文件下载
```

### 3.7 审计日志

| 操作菜单 | 操作功能 | 内容模板 |
|---------|---------|---------|
| 车辆数据 | 下载导出文件 | "下载导出文件 {filename}" |

---

## 4. API 接口定义

### 4.1 车辆信号数据查询

```
GET /vehicle-data/signals
```

**请求参数：**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `vehicles` | Query | `string[]` | ✓ | VIN 列表，逗号分隔 |
| `startTime` | Query | `string` | ✓ | 开始时间（智利时区 ISO） |
| `endTime` | Query | `string` | ✓ | 结束时间（智利时区 ISO） |
| `signals` | Query | `string[]` | ✓ | 信号 Key 列表，逗号分隔 |
| `page` | Query | `number` | | 页码，默认 1 |
| `pageSize` | Query | `number` | | 每页条数，默认 100 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "id": "row_001",
        "plate": "京A88888",
        "timestamp": "2026-06-10T16:35:00-04:00",
        "deviceId": "DEV_1234",
        "soc": 85,
        "soh": 92,
        "max_temp": 38
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 100
  }
}
```

> 注：返回数据中的车牌号**已脱敏**（符合安全规范），导出接口才返回明文。

### 4.2 创建导出任务

```
POST /vehicle-data/exports
```

**请求体：**

```json
{
  "vehicleIds": ["LF...", "LS..."],
  "startTime": "2026-06-09T00:00:00-04:00",
  "endTime": "2026-06-10T23:59:59-04:00",
  "signals": ["soc", "soh", "insulation"]
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "exp_001",
    "filename": "车辆信号数据_V001_20260610.csv",
    "status": "processing",
    "createdAt": "2026-06-10 16:35:00"
  }
}
```

### 4.3 导出记录列表

```
GET /vehicle-data/exports
```

**请求参数：**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `page` | Query | `number` | | 页码，默认 1 |
| `pageSize` | Query | `number` | | 每页条数，默认 20 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "id": "exp_001",
        "filename": "车辆信号数据_V001_20260610.csv",
        "filterSummary": "多车(2辆) | 1小时 | 8个信号",
        "totalCount": null,
        "createdAt": "2026-06-10 16:35:00",
        "status": "processing"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 4.4 下载导出文件

```
GET /vehicle-data/exports/:id/download
```

**响应：** CSV 文件流

```
Content-Type: text/csv
Content-Disposition: attachment; filename="车辆信号数据_V001_20260610.csv"
```

> 仅 `status = completed` 的记录可下载，且需在 7 天有效期内。

---

## 5. TypeScript 类型定义

```typescript
// 车辆信号数据行
interface VehicleSignalRow {
  id: string;
  plate: string;        // 前端展示已脱敏
  timestamp: string;    // ISO 格式
  deviceId: string;
  // 动态信号字段（按选中信号动态添加）
  [signalKey: string]: any;
}

// 导出记录
interface ExportRecord {
  id: string;
  filename: string;
  filterSummary: string;
  totalCount: number | null;
  createdAt: string;          // YYYY-MM-DD HH:mm:ss
  status: 'processing' | 'completed';
}
```

---

## 6. 代码现状与待实现列表

### 已有实现（Mock 原型）

| 功能 | 状态 | 文件 |
|------|------|------|
| 页面路由/导航 | ✅ 已实现 | `App.tsx` / `Sidebar.tsx` |
| 车辆树组件（最多10辆） | ✅ 已实现 | `VehicleTreeComponent.tsx` |
| 筛选栏（时间+信号+全选） | ✅ 已实现 | `FilterBarComponent.tsx` |
| 动态列数据表格 | ✅ 已实现 | `DataGridComponent.tsx` |
| 导出记录表格 | ✅ 已实现 | `ExportRecordComponent.tsx` |
| 信号值格式化（单位/枚举） | ✅ 已实现 | `DataGridComponent.tsx` |
| 中/英/西班牙 i18n | ✅ 已实现 | `zh.ts` / `en.ts` / `es.ts` |
| 集成测试（3 用例） | ✅ 已实现 | `VehicleData.integration.test.tsx` |

### 待实现

| 功能 | 优先级 | 说明 |
|------|--------|------|
| `GET /vehicle-data/signals` 对接 | P0 | 替换内联 setTimeout mock |
| `POST /vehicle-data/exports` 对接 | P0 | 替换 toast-only 导出 |
| `GET /vehicle-data/exports` 对接 | P0 | 替换硬编码 mock 数据 |
| `GET /vehicle-data/exports/:id/download` | P0 | 替换 console.log 下载 |
| `GET /vehicle-data/signals` 请求参数拼装 | P0 | VIN 列表 / 时间 / 信号列表 |
| 导出任务列表过滤条件摘要列渲染 | P1 | mock 已有字段但表格未渲染 |
| 类型定义迁移至 `types/index.ts` | P1 | 当前 `ExportRecord` 在组件内定义 |
| 自定义 hooks 抽取 | P2 | `useVehicleSignal` / `useDataExport` |
| 导出失败状态支持 | P2 | 当前仅 processing / completed |
