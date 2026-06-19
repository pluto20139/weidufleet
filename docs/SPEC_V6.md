# 苇渡·智利车队管理平台 — 工程 Spec（V6.4）

> 基于 PRD V6（2026-06-18）整理。本文档定义：① 数据库表设计 ② API 契约 ③ 核心业务状态机 ④ 权限矩阵 ⑤ 业务对象定义。
> 设计原则：**后端明文存储，前端/接口按规则脱敏**；**多租户隔离（业务管理/实时监控除外）**；**时区统一智利**。

## 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|---------|
| V6.0 | 2026-06-18 | 初版（DB/API/状态机/权限矩阵/业务对象） |
| V6.1 | 2026-06-18 | 基于两轮 Review（51 项）启动修订：新增 §0.1 枚举对照表；修正维修描述控件（TextArea→单选）与状态术语统一；修正 14+9 预警枚举文本逐字对齐 PRD；补全一级租户单下级约束、修改密码服务端兜底、心跳阈值、围栏闭合校验、日均电耗口径、疲劳驾驶单位、信号 pivot、导出过期判定、审计数据范围、登录校验优先级、字符计数口径等。PM 确认：维修状态统一"维修完成"；开通账号=当前租户管理员。（本次修订因故中断，部分 P0/P1 项未落地） |
| V6.2 | 2026-06-18 | 接续 V6.1 中断部分，补全剩余 22 项遗漏，确保两轮 Review 51 项全部闭环 |
| V6.3 | 2026-06-18 | 基于第三轮 Review（R3, 30 项）修订，三轮累计 81 项全部闭环 |
| V6.4 | 2026-06-18 | **基于第四轮 Review（R4, 22 项）修订**，四轮累计 103 项全部闭环：<br>**PM 确认 3 项**：① R4-H1 审计日志数据范围=**仅当前租户** ② R4-M3 驾驶报告列表"行驶里程"≠详情"累计行驶里程"（列表=周期里程，详情=车辆总里程） ③ 里程报表非独立菜单，仅车辆详情 tab<br>**P0（2 项）**：R4-H1 §1.12.1 审计日志数据范围改为"仅当前租户"（消除与 §4.1 矛盾）；R4-H2 撤销（里程报表非独立菜单，§2.5 现有 `/vehicles/{vin}/mileage` 已覆盖）<br>**P1（8 项）**：R4-M1 §2.1.2 分页默认值同步 §0；R4-M2 §3.3 资产划拨→vehicles 建表链路；R4-M3 §1.6.2/§2.7 行驶里程≠累计行驶里程；R4-M4 §1.6.3 疲劳驾驶单次连续驾驶判定逻辑；R4-M5 §1.6.3 报告周期 ISO 周定义；R4-M6 §1.3.2 设备 status 实时计算；R4-M7 §2.14 tenantId 全部传值；R4-M8 §3.3 删除级联<br>**P2（12 项）**：R4-L1 评分四舍五入/L2 实时地图字段/L3 排行榜字段/L6-L7 围栏/驾驶预警无 status 声明/L10 快照表更新机制/L11 13 个一级菜单枚举/L12 risk_count 定义等 |

> **PM 确认（2026-06-18）**：
> - 维修状态术语（N-H4）：PRD 原文"列表=维修完成 / 筛选=已完成"为笔误，**统一为"维修完成"**。
> - 开通账号角色层级（N-M3）："赋予该租户下级管理员角色"中"下级"为笔误，**实际为当前租户的管理员角色**。
> - **疲劳驾驶评分（R3-H1）**：按**时长（小时）**评分非按次数；0h→100/1h→90/2h→80/3h→70/4h→60/≥5h→50；PRD 占位符"**"采用 4h 为默认阈值（可配置）。
> - **首页在线/离线（R3-H2）**：每车 1 设备，设备数=车辆数，两口径等价。
> - **累计充电次数（R3-L14）**：全局累计，不随租户划拨重置。
> - **审计日志数据范围（R4-H1）**：仅当前租户（非"当前租户+所有下级"）。
> - **驾驶报告里程字段（R4-M3）**：列表"行驶里程"=报告周期内里程；详情"累计行驶里程"=车辆总里程（vehicles.total_mileage_km），二者不同。
> - **里程报表（R4-H2）**：非独立菜单，仅车辆详情 tab；PRD §产品概述行 67"行程管理→里程报表"为描述笔误，以 PRD §导航栏设计为准。

---

## 0. 全局约定

| 项目 | 规范 |
|------|------|
| 时区 | `America/Santiago`（冬令时 UTC-4，夏令时 UTC-3，由 `dayjs tz` 自动切换） |
| 时间格式 | `YYYY-MM-DD HH:mm:ss`；日期 `YYYY-MM-DD`；时长 `HH:mm`；行程时长 `HH:mm:ss` |
| 主键策略 | 业务表用 `BIGINT` 自增 `id`；外部引用 ID（用户、租户、VIN）使用字符串/唯一索引 |
| 软删除 | 配置类（租户/角色/围栏）`deleted_at TIMESTAMP NULL`；流水类（预警/行程/日志）物理保留 |
| 鉴权 | `Authorization: Bearer <jwt>`；401 自动登出，403 无权限 |
| 分页 | `page`（从 1）+ `pageSize`（可选 10/20/50/100）；**默认值由各页面定义**（车辆列表/围栏/流水类=20；业务管理/系统管理列表类=10，见各 API 说明） |
| 排序 | 默认按时间倒序；角色列表正序 |
| 语言 | `Accept-Language: zh|en`，Token 内含偏好；**未指定时默认 `en`**（与 PRD"默认英文"一致） |
| 脱敏 | 见 §1.14；**导出/下载一律明文** |
| 审计 | 关键操作写 `audit_logs`，保留 ≥ 180 天（47 项映射见 §5.2） |
| 字符长度 | 除特别说明外，"字符数"按 **Unicode 码点**计（中文 1 字 = 1 码点） |
| 夏/冬令时 | 依赖 IANA tzdata 的 `America/Santiago` 规则，与 PRD"4/9 月第一个星期六 24:00"定义一致 |

## 0.1 枚举对照表（存储码 ↔ PRD 原文文案 ↔ i18n）

> **强约束**：数据库存储码、接口传输用"存储码"；前端展示、审计文案一律用"PRD 原文文案"；i18n key 见 `src/i18n/zh.ts` `en.ts`。**严禁在 Spec/UI 缩写枚举**。

### 0.1.1 故障预警类型（9 种）
| 存储码 | PRD 原文文案 | 英文文案 | i18n key |
|--------|------------|---------|----------|
| `VDC` | VDC故障报警 | VDC Fault | `fault.VDC` |
| `CDCU` | CDCU故障报警 | CDCU Fault | `fault.CDCU` |
| `BDCU` | BDCU故障报警 | BDCU Fault | `fault.BDCU` |
| `ADAS` | ADAS故障报警 | ADAS Fault | `fault.ADAS` |
| `DC_DC_TEMP` | DC-DC 温度报警 | DC-DC Temp Alarm | `fault.DC_DC_TEMP` |
| `DC_DC_STATUS` | DC-DC 状态报警 | DC-DC Status Alarm | `fault.DC_DC_STATUS` |
| `MOTOR_CTRL_TEMP` | 驱动电机控制器温度报警 | Motor Controller Temp Alarm | `fault.MOTOR_CTRL_TEMP` |
| `MOTOR_TEMP` | 驱动电机温度报警 | Motor Temp Alarm | `fault.MOTOR_TEMP` |
| `HV_INTERLOCK` | 高压互锁状态报警 | HV Interlock Alarm | `fault.HV_INTERLOCK` |

### 0.1.2 电池预警类型（14 种）
| 存储码 | PRD 原文文案 | 英文文案 | i18n key |
|--------|------------|---------|----------|
| `TEMP_DIFF` | 温度差异报警 | Temperature Difference | `battery.TEMP_DIFF` |
| `HIGH_TEMP` | 电池高温报警 | Battery High Temp | `battery.HIGH_TEMP` |
| `STORAGE_OVERVOLTAGE` | 车载储能装置过压报警 | Storage Over-voltage | `battery.STORAGE_OVERVOLTAGE` |
| `STORAGE_UNDERVOLTAGE` | 车载储能装置欠压报警 | Storage Under-voltage | `battery.STORAGE_UNDERVOLTAGE` |
| `SOC_LOW` | **SOC低报警** | SOC Low | `battery.SOC_LOW` |
| `CELL_OVERVOLTAGE` | 单体电池过压报警 | Cell Over-voltage | `battery.CELL_OVERVOLTAGE` |
| `CELL_UNDERVOLTAGE` | 单体电池欠压报警 | Cell Under-voltage | `battery.CELL_UNDERVOLTAGE` |
| `SOC_HIGH` | SOC 过高报警 | SOC High | `battery.SOC_HIGH` |
| `SOC_JUMP` | SOC 跳变报警 | SOC Jump | `battery.SOC_JUMP` |
| `STORAGE_MISMATCH` | 可充电储能系统不匹配报警 | Storage Mismatch | `battery.STORAGE_MISMATCH` |
| `CELL_CONSISTENCY` | 电池单体一致性差报警 | Cell Consistency | `battery.CELL_CONSISTENCY` |
| `STORAGE_TYPE_OVERCHARGE` | **车载储能装置类型过充** | Storage Type Overcharge | `battery.STORAGE_TYPE_OVERCHARGE` |
| `INSULATION` | 绝缘报警 | Insulation Alarm | `battery.INSULATION` |
| `CHARGE_FAULT` | 充电故障报警 | Charge Fault | `battery.CHARGE_FAULT` |

> ⚠️ **关键修正**：
> - 首页"今日低电预警"判定条件 = `type = 'SOC_LOW'`（即 SOC低报警），非"SOC过低"。
> - 第 12 项存储码 `STORAGE_TYPE_OVERCHARGE`，文案"车载储能装置**类型**过充"——"类型"二字不可丢。

### 0.1.3 驾驶预警类型（6 种 ADAS）
| 存储码 | PRD 原文文案 | i18n key |
|--------|------------|----------|
| `CAR_L1` | 对车一级预警 | `driving.CAR_L1` |
| `CAR_L2` | 对车二级预警 | `driving.CAR_L2` |
| `CAR_AEB` | 对车AEB制动 | `driving.CAR_AEB` |
| `PERSON_L1` | 对人一级预警 | `driving.PERSON_L1` |
| `PERSON_L2` | 对人二级预警 | `driving.PERSON_L2` |
| `PERSON_AEB` | 对人AEB制动 | `driving.PERSON_AEB` |

### 0.1.4 充电状态（5 种）
| 信号编码 | 存储码 | PRD 原文文案 | i18n key |
|---------|--------|------------|----------|
| `0000b` | `NOT_CHARGING` | 未充电 | `charge.NOT_CHARGING` |
| `0011b` | `PREPARING` | 准备充电 | `charge.PREPARING` |
| `0100b` | `CHARGING` | 充电中 | `charge.CHARGING` |
| `0110b` | `DISCHARGING_OTHER` | 对方放电 | `charge.DISCHARGING_OTHER` |
| 其他 | `FAULT` | 故障&异常 | `charge.FAULT` |

> ⚠️ **编码映射（R3-M5）**：信号处理层收到原始信号值后，按本表"信号编码"列映射到"存储码"再入库；`0000b`/`0011b`/`0100b` 三值由 PRD §充放电判定明确，`0110b`（对方放电）为本 Spec 推断编码（PRD 未给具体二进制值），**待 PM 确认后可调**；其余未列出编码统一归为 `FAULT`。

### 0.1.5 围栏预警类型（2 种）
| 存储码 | PRD 原文文案 |
|--------|------------|
| `OUT` | 出栏预警 |
| `IN` | 入栏预警 |

### 0.1.6 维修相关枚举
| 枚举 | 存储码 | 展示文案（中/英） | 备注 |
|------|--------|-----------------|------|
| 维修类型 | `FAULT` | 故障类 / Fault | |
| 维修类型 | `BATTERY` | 电池类 / Battery | |
| 维修状态 | `IN_PROGRESS` | 维修中 / In Progress | 存储码 1 |
| 维修状态 | `COMPLETED` | **维修完成** / Completed | 存储码 2；**筛选下拉也统一为"维修完成"**（PRD"已完成"为笔误，PM 确认） |

### 0.1.7 驾驶风险等级
| 存储码 | 文案 | 驾驶预警次数（整数等价表述） |
|--------|------|--------------------------|
| `SAFE` | 安全司机 | n ≤ 1 |
| `LOW` | 低危司机 | 2 ≤ n ≤ 3 |
| `MID` | 中危司机 | 4 ≤ n ≤ 6 |
| `HIGH` | 高危司机 | n ≥ 7 |

> ⚠️ 以本表为准，废弃 `PROJECT_CONTEXT.md` 第 243-248 行"低危 2~3 / 中危 4~6 / 高危 >6"以外的任何歧义表述（与 PRD `1<n≤3` 等价）。

---

# 第一部分 · 数据库表设计

> 命名：表 `snake_case` 复数；字段 `snake_case`；布尔 `is_xxx`；时间 `xxx_at`。
> 引擎：MySQL 8.0 / Postgres 15（语法兼容），字符集 `utf8mb4`。
> 轨迹/信号明细等大表建议分区（按月）或落入时序库（InfluxDB/TDengine），本 Spec 给逻辑表结构。

## 1.1 认证与用户中心（user_center）

### 1.1.1 `users`（用户中心用户）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | PK | 用户 ID |
| email | VARCHAR(128) | UNIQUE NOT NULL | 登录邮箱（唯一标识） |
| nickname | VARCHAR(64) | NOT NULL | 用户昵称（≤20，可重复） |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| must_change_password | TINYINT(1) | DEFAULT 1 | 初始/重置后强制改密 |
| last_login_at | TIMESTAMP | NULL | 最近登录时间 |
| status | TINYINT | DEFAULT 1 | 1=启用 0=禁用 |
| created_at / updated_at | TIMESTAMP | NOT NULL | |

> 密码规则：8~18 位，数字+英文+特殊字符；初始/重置密码：**大写字母+数字 8 位随机**。

### 1.1.2 `app_user_tenants`（应用-用户-租户-角色 多对多）
> 一个邮箱用户可关联多租户，每租户下可有多角色。
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| user_id | VARCHAR(32) | FK→users.id | |
| tenant_id | BIGINT | FK→tenants.id | 该用户在该租户下的关联 |
| role_ids | JSON / VARCHAR(255) | NOT NULL | 角色数组（同租户内多角色，逗号分隔或 JSON） |
| is_admin_account | TINYINT(1) | DEFAULT 0 | 是否租户管理员账号（开通账号时置位，受保护） |
| related_at | TIMESTAMP | NOT NULL | 关联建立时间（用于租户切换排序） |
| UNIQUE | | (user_id, tenant_id) | 同一用户同租户仅一条关系 |

### 1.1.3 `login_logs`（登录日志）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| user_id VARCHAR(32) | | |
| tenant_id BIGINT NULL | | 切换后的租户 |
| ip VARCHAR(45) | | |
| user_agent VARCHAR(255) | | |
| result TINYINT | 1=成功 0=失败 |
| message VARCHAR(128) | "账号密码错误"/"验证码错误" |
| created_at TIMESTAMP | |

## 1.2 租户与业务管理（biz）

### 1.2.1 `tenants`（租户）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| parent_id | BIGINT | NULL, FK→tenants.id | 父租户；根级为 NULL |
| level | TINYINT | NOT NULL | 层级：0=根(苇渡) 1=一级 2=二级... |
| code | VARCHAR(255) | NOT NULL | 企业编码（编辑置灰）；PRD"长度不限制"，本 Spec 设 255 字符上限为数据库安全约束（R3-M7） |
| name | VARCHAR(128) | NOT NULL | 企业名称 |
| address | VARCHAR(255) | NULL | |
| contact_name | VARCHAR(64) | NULL | |
| contact_phone | VARCHAR(32) | NULL | |
| service_expire_at | TIMESTAMP | NULL | 服务到期（一级到期则该一级及其全部下级显示过期） |
| created_at / updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | 软删除 |
| INDEX | | (parent_id), (level) | |
| UNIQUE | | (code, deleted_at) | 避免软删后同 code 重建冲突 |
| UNIQUE | | (name, parent_id, deleted_at) | 同父下名称唯一（Spec 解读：PRD 未明确唯一性范围，本 Spec 取"同父下唯一"；R3-L16 待 PM 进一步确认是否需全局唯一） |

> 业务规则：
> ① **一级租户仅可添加 1 个下级**（应用层校验：`parent.level=1` 时，该 parent 下 `level=2` 子节点数 ≤ 1；超额返回 409「一级租户仅可添加一个下级」；UI 在已有下级时隐藏"添加下级"入口）。
> ② 未开通主账号可删，已开通不可删（409）。
> ③ 一级租户不支持编辑/删除（由租户管理模块维护）。
> ④ 二级及以下支持增删改；**有下级时不可删**（409「存在下级租户，不可删除」）。
> ⑤ 根级只读，默认全权限。
> ⑥ **服务到期处理见 §3.8**。

### 1.2.2 `tenant_admins`（租户主管理员账号开通状态）
| 字段 | 类型 | 说明 |
|------|------|------|
| tenant_id BIGINT PK/FK | | |
| user_id VARCHAR(32) FK→users.id | 已开通的管理员账号 |
| activated_at TIMESTAMP | 开通时间 |

> 开通后 `tenants` 列表"管理员账号"字段非"-"；未开通显示"-"，删除该租户前必须为空。

### 1.2.3 `tenant_permission_templates`（租户层级权限模板）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| tenant_id BIGINT FK | 所属租户 |
| scope_level TINYINT | 模板作用层级（二级/三级…） |
| permissions JSON | 功能权限码数组 |
| updated_at TIMESTAMP | |

> 根级苇渡默认全权限，不可配置；一级在租户维度配置；二级及以下在**层级模板**维度批量配置。

### 1.2.4 `tenant_permissions`（租户实际功能权限）
| 字段 | 类型 | 说明 |
|------|------|------|
| tenant_id BIGINT PK | |
| permissions JSON | 该租户被授予的功能权限码集合（菜单+按钮） |
| updated_at TIMESTAMP | |

> 关联关系：租户权限定义该租户的最大范围，角色权限是该范围内的子集。

### 1.2.5 `roles`（角色）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| tenant_id | BIGINT | FK→tenants.id | 归属租户 |
| name | VARCHAR(32) | NOT NULL | ≤10 字符 |
| is_system_admin | TINYINT(1) | DEFAULT 0 | 租户管理员（开通账号自动创建，受保护） |
| permissions | JSON | | 功能权限码数组 |
| created_at / updated_at | | | |
| UNIQUE(tenant_id, name) | | | 同租户角色名唯一 |

### 1.2.6 `assets`（车辆资产 — 业务管理划拨对象）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| vin | CHAR(17) | PK | VIN 码 |
| tenant_id | BIGINT | NULL, FK→tenants.id | 当前归属租户（NULL=未划拨） |
| device_id | VARCHAR(32) | NULL | 已绑设备 ID（有设备不可删） |
| channel_code | VARCHAR(64) | NOT NULL | IOT 同步渠道标识 |
| synced_at | TIMESTAMP | NOT NULL | 首次同步入库时间 |
| INDEX | | (tenant_id), (channel_code) | |

### 1.2.7 `asset_transfer_records`（资产划拨记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin CHAR(17) FK→assets.vin | | |
| from_tenant_id BIGINT NULL | 划拨前租户（NULL=未划拨） |
| to_tenant_id BIGINT | 划拨后租户 |
| operator_id VARCHAR(32) | 变更人 |
| transferred_at TIMESTAMP | 划拨时间 |
| INDEX (vin, transferred_at) | |

## 1.3 车辆与设备

### 1.3.1 `vehicles`（车辆主档 — 租户名下）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| vin | CHAR(17) | PK | |
| tenant_id | BIGINT | NOT NULL, FK | 归属租户 |
| plate | VARCHAR(16) | NULL | 车牌号（明文存储） |
| device_id | VARCHAR(32) | NULL | 绑定 OBD 设备（多设备时取最早安装者） |
| model | VARCHAR(64) | NULL | 车型 |
| color | VARCHAR(32) | NULL | 外观 |
| battery_version | VARCHAR(32) | NULL | 电池版本 |
| purchased_at | DATE | NULL | 购车时间 |
| car_age_years | DECIMAL(4,1) | NULL | **派生字段**：= (today - purchased_at)/365，保留 1 位；查询时计算或定时刷新，**非用户录入** |
| total_mileage_km | INT | DEFAULT 0 | 总里程（km 取整） |
| last_lat | DECIMAL(10,7) | NULL | 最后位置 |
| last_lng | DECIMAL(10,7) | NULL | |
| last_address | VARCHAR(255) | NULL | 逆地址（街道/路口级，移除门牌号） |
| last_located_at | TIMESTAMP | NULL | |
| added_at | TIMESTAMP | NOT NULL | 入库时间（列表排序） |
| INDEX | | (tenant_id, added_at) | |

> 地址展示规则：列表 `last_address` **截断至 20 字符 + 省略号**；点击气泡/详情接口返回完整 address（见 §1.14）。

### 1.3.2 `devices`（OBD 设备）
| 字段 | 类型 | 说明 |
|------|------|------|
| id VARCHAR(32) PK | | |
| name VARCHAR(64) | 设备名称 |
| type VARCHAR(32) | 设备类型 |
| model VARCHAR(64) | 设备型号 |
| vin CHAR(17) NULL FK→vehicles.vin | 安装车辆 |
| installed_at TIMESTAMP | 安装时间（用于多设备取最早判定） |
| status TINYINT | 1=在线 0=离线 |
| last_heartbeat_at TIMESTAMP | 最近心跳 |

> 在线/离线判定（R4-M6）：`status` 为**查询时实时计算**（`CASE WHEN last_heartbeat_at IS NOT NULL AND TIMESTAMPDIFF(MINUTE, last_heartbeat_at, NOW()) <= 5 THEN 1 ELSE 0 END`），非定时更新存储字段；接口返回时实时计算。
> **PM 确认（R3-H2）**：每辆车有且仅有 1 个设备，设备数=车辆数，故首页"在线/离线"按设备数与按车辆数统计结果一致。PRD §轨迹回放"多设备取最早设备状态"为预留扩展规则，当前业务不触发。

### 1.3.3 `vehicle_import_logs`（批量导入日志）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| tenant_id BIGINT | |
| total INT | 总行数 |
| success INT | 成功条数 |
| failed INT | 失败条数 |
| failure_detail_url VARCHAR(255) | 失败明细 Excel 下载链接 |
| operator_id VARCHAR(32) | |
| created_at TIMESTAMP | |

## 1.4 围栏（fence）

### 1.4.1 `fences`（围栏）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| tenant_id | BIGINT | NOT NULL, FK | |
| name | VARCHAR(30) | NOT NULL | ≤30 |
| type | TINYINT | NOT NULL | 1=中心点 2=自定义 |
| alert_type | VARCHAR(8) | NOT NULL | 围栏预警类型存储码，见 §0.1.5（`OUT`=出栏预警 / `IN`=入栏预警） |
| center_lat / center_lng | DECIMAL(10,7) | NULL | 中心点围栏必填；自定义围栏强制 NULL |
| radius_km | DECIMAL(6,2) | NULL | 中心点围栏必填，0<≤100；自定义围栏强制 NULL |
| polygon_points | JSON | NULL | 自定义围栏点位（**3 ≤ 点数 ≤ 99**，提交时自动闭合首尾相连）；中心点围栏强制 NULL |
| address | VARCHAR(255) | NULL | 中心点围栏地址；自定义显示"--" |
| status | TINYINT | DEFAULT 0 | 1=生效中 0=未生效 |
| operator_id | VARCHAR(32) | | 最近操作人（新建/编辑/开关均更新） |
| operated_at | TIMESTAMP | | 最近操作时间（**列表"操作时间"筛选字段**，见 §2.10） |
| created_at | TIMESTAMP | | 列表排序字段（倒序） |
| deleted_at | TIMESTAMP | NULL | |
| INDEX | | (tenant_id, created_at), (operated_at) | |

> 围栏规则：
> - **关闭时**才可编辑/删除（status=未生效），否则 40902「请先关闭围栏」。
> - 自定义围栏闭合校验：`3 ≤ len(polygon_points) ≤ 99`，提交时自动闭合（首尾相连，无需用户重复标首点）。
> - 围栏名称 ≤30 字符（按 Unicode 码点）。
> - 开关/编辑/删除均写审计。

### 1.4.2 `fence_vehicles`（围栏-车辆配置）
| 字段 | 类型 | 说明 |
|------|------|------|
| fence_id BIGINT FK | | |
| vin CHAR(17) FK | | |
| added_at TIMESTAMP | |
| PRIMARY (fence_id, vin) | | |

## 1.5 风控预警（risk）

> 三类预警按类型分表，便于按枚举筛选；都带 `status`（存储码 `PENDING`/`IN_REPAIR`/`COMPLETED`）以联动维修（见 §3.1）。

### 1.5.1 `fence_alerts`（围栏预警）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin CHAR(17) FK | | |
| device_id VARCHAR(32) | | |
| fence_id BIGINT FK | | |
| alert_type VARCHAR(8) | `OUT`=出栏预警 / `IN`=入栏预警（见 §0.1.5） |
| lat/lng DECIMAL | 触发位置 |
| address VARCHAR(255) | 街道/路口级 |
| speed_kmh DECIMAL(5,1) | 预警时车速 |
| created_at TIMESTAMP | 预警时间 |

### 1.5.2 `fault_alerts`（故障预警 — 9 种）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin / device_id | | |
| type | VARCHAR(32) | 故障类型**存储码**，见 §0.1.1（VDC/CDCU/.../HV_INTERLOCK）；前端按 i18n key 渲染"VDC故障报警"等原文文案 |
| content | VARCHAR(255) | 解析信号 |
| status | VARCHAR(16) | `PENDING`(未处理) / `IN_REPAIR`(维修中) / `COMPLETED`(维修完成)；DEFAULT PENDING |
| source_repair_id | BIGINT NULL | 关联维修单（一键报修生成） |
| created_at TIMESTAMP | | |

### 1.5.3 `battery_alerts`（电池预警 — 14 种）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin / device_id | | |
| type | VARCHAR(32) | 电池类型**存储码**，见 §0.1.2（SOC_LOW/HIGH_TEMP/.../STORAGE_TYPE_OVERCHARGE）；前端渲染"SOC低报警"等原文 |
| content | VARCHAR(255) | |
| status | VARCHAR(16) | `PENDING` / `IN_REPAIR` / `COMPLETED`；DEFAULT PENDING |
| source_repair_id | BIGINT NULL | |
| created_at TIMESTAMP | | |

> **首页"今日低电预警"** = battery_alerts 中 `type='SOC_LOW'`（即"SOC低报警"）且 `created_at >= 今日 00:00`。
> 一辆车装多设备时，按设备维度产生多条预警（PRD 全局规则）。

## 1.6 驾驶行为（driving）

### 1.6.1 `driving_alerts`（驾驶预警 — 6 种 ADAS）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin / device_id | | |
| plate VARCHAR(16) | 冗余便于查询 |
| type | VARCHAR(16) | 驾驶预警**存储码**，见 §0.1.3（CAR_L1/CAR_L2/CAR_AEB/PERSON_L1/PERSON_L2/PERSON_AEB） |
| lat/lng/address | | 触发位置（**默认收起**，点击"查看位置"展开，见 §1.14） |
| speed_kmh | DECIMAL(5,1) | 行车速度 |
| created_at TIMESTAMP | | |

### 1.6.2 `driving_reports`（驾驶报告 — 周报/月报）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin CHAR(17) | | |
| plate VARCHAR(16) | | |
| period_type | TINYINT | 1=周报 2=月报 |
| period_year | INT | 报告年份 |
| period_seq | INT | 报告序号（周报=周号如 21；月报=月号如 2） |
| period_label | VARCHAR(32) | 由前端按 locale 拼装：zh="2025年第21周"/"2025年2月"，en="Week 21, 2025"/"Feb 2025" |
| period_start / period_end | DATE | |
| km | DECIMAL(10,1) | **报告周期内行驶里程**（PM 确认 R4-M3：列表"行驶里程"=本报告时间段内车辆行驶里程；≠详情"累计行驶里程"） |
| cumulative_hours | DECIMAL(8,1) | 累计行驶时长(h) |
| avg_speed | DECIMAL(5,1) | 平均车速 |
| risk_count | INT | 触发风险数 |
| risk_level | VARCHAR(8) | 驾驶风险**存储码**，见 §0.1.7（SAFE/LOW/MID/HIGH） |
| score | INT | 驾驶评分（取整） |
| mileage_trend | JSON | 每日里程（折线图：周报 X=周一~周日 / 月报 X=当月每日） |
| region_distribution | JSON | 各城市里程（柱状图） |
| suggestions | JSON | 改善建议数组（数据驱动，有兜底）。**兜底规则（R3-L15）**：当某维度无数据（如新车首次报告）时，该项建议显示"本周期暂无{维度}数据，暂无改善建议" |
| created_at TIMESTAMP | | 按报告时间倒序 |

### 1.6.3 `driving_report_items`（驾驶评分明细）
| 字段 | 说明 |
|------|------|
| report_id FK | |
| dimension | VARCHAR(8) | 评分维度**存储码**：`HARD_ACCEL`(急加速) / `HARD_BRAKE`(急减速) / `SHARP_TURN`(急转弯) / `FATIGUE`(疲劳驾驶) / `AEB`(AEB制动) |
| value | DECIMAL(8,1) | 急加速/急减速/急转弯/AEB = 次数；疲劳驾驶 = 时长(h) |
| unit | VARCHAR(4) | `次` / `时`（区分维度单位） |
| score INT | 该项得分 |

> 评分规则：5 项各 20% 权重，总分取整（**四舍五入**，R4-L1）。
> 急加速/急减速/急转弯/AEB 制动（次数）：0→100、1→100（n≤1 归 100 档，R3-L5）、2→90、4→80、6→70、7-10→60、>10→50。
> **疲劳驾驶（PM 确认 R3-H1）**：按**时长（小时）**评分，非按次数。0h→100、1h→90、2h→80、3h→70、4h→60、≥5h→50。疲劳驾驶时长 = 报告周期内单次连续驾驶超过疲劳阈值（建议 4h，参考国标 GB/T 19056，**可配置**）的累计时长。PRD 原文"单次连续驾驶时长＞**小时"中"**"为占位符未填，本 Spec 采用 4h 为默认值，PM 确认"不是按次算的，是时长越长评分越低"。
> **单次连续驾驶判定逻辑（R4-M4）**：与行程定义对齐——开始=GPS 持续上报≥5min，结束=超 10min 无定位或车速持续为 0。疲劳驾驶累计时长 = Σ(max(0, 单次连续驾驶时长 − 4h))，即仅累计超阈值部分。
> **报告周期定义（R4-M5）**：周报按 ISO 8601 周（**周一为第一天，周日为最后一天**，与 PRD"星期一到星期日"一致）；月报按自然月（1 日到最后一天）；`period_year + period_type + period_seq` 唯一标识一份报告。
> **触发风险数定义（R4-L12）**：`risk_count` = 报告周期内 5 个评分维度（急加速+急减速+急转弯+疲劳驾驶+AEB）触发次数之和，≠驾驶预警 6 种 ADAS 次数。

## 1.7 电池管理（battery）

### 1.7.1 `battery_monitor`（电池监控快照 — 每车一条最新）
| 字段 | 类型 | 说明 |
|------|------|------|
| vin CHAR(17) PK/FK | | |
| plate VARCHAR(16) | | |
| soc | DECIMAL(4,1) | SOC(%) |
| soh | DECIMAL(4,1) | 健康度(%) |
| temperature | DECIMAL(4,1) | 电池温度(℃) |
| range_km | INT | 续航 |
| daily_consumption | DECIMAL(6,2) | 日均电耗(kWh/100km)，里程 0 时为 0 |
| charge_count | INT | 累计充电次数（按 VIN **全生命周期累计，不随租户划拨重置**；**PM 确认 R3-L14**） |
| charge_status | VARCHAR(20) | 充电状态**存储码**，见 §0.1.4（NOT_CHARGING/PREPARING/CHARGING/DISCHARGING_OTHER/FAULT） |
| updated_at TIMESTAMP | 最近上报 |
| added_at TIMESTAMP | 入库时间（列表倒序） |

> 聚合指标（列表头部）：平均 SOC / 平均温度 / 平均续航 / 低电预警数（type=SOC_LOW 计数）由查询实时计算。
>
> **日均电耗口径**（列表 vs 详情）：
> - 列表快照 `daily_consumption` = (当日 0:00 累计电耗 − 昨日 0:00 累计电耗) ÷ (当日 0:00 累计里程 − 昨日 0:00 累计里程) × 100；里程为 0 时显示 0。
> - 详情趋势 `battery_consumption_daily` = 当日 23:59:59 累计耗电 − 当日 00:00:00 累计耗电 = 日放电量；再 ÷ 日里程 × 100。

### 1.7.2 `battery_consumption_daily`（日均电耗趋势 — 详情折线 30 天）
| 字段 | 说明 |
|------|------|
| vin CHAR(17) FK | |
| date DATE | |
| daily_kwh DECIMAL(8,2) | 日放电量 |
| daily_km DECIMAL(10,1) | 日里程 |
| consumption DECIMAL(6,2) | = kwh/km*100 |

> **插值规则（R3-L6）**：日放电量/日里程取当日 00:00:00 和 23:59:59 的累计值；**若该时刻无数据，取当天内时间戳最接近该时刻的值插入**（PRD §电池监控详情原文）。

### 1.7.3 `charge_records` / `discharge_records`（充/放电记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin / plate | | |
| voltage DECIMAL(6,1) | 平均电压(V) |
| current DECIMAL(6,1) | 平均电流(A)；**带符号：充电>0，放电<0** |
| power DECIMAL(6,2) | 平均功率(kW) |
| soc_before / soc_after | DECIMAL(4,1) | 充/放电前/后电量 |
| duration_min INT | 时长(分钟)，展示 HH:mm |
| created_at TIMESTAMP | 记录时间（倒序） |

> 充电判定：充电状态 ∈ {0100b,0011b} 且 电流 **>+2A** 持续 1min；
> 放电判定：充电状态=0000b 且 电流 **<-2A** 且 车速>0 持续 1min。

## 1.8 行程（trip）

### 1.8.1 `trips`（行程记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin / plate | | |
| start_at / end_at | TIMESTAMP | |
| start_lat/start_lng/start_address | | 起点（默认收起） |
| end_lat/end_lng/end_address | | 终点（默认收起） |
| mileage_km | DECIMAL(10,1) | 行驶里程 |
| duration_min | INT | 行程时长（HH:mm） |
| avg_speed | DECIMAL(5,1) | 平均车速 |
| max_speed / min_speed | DECIMAL(5,1) | 详情页用 |
| alert_count | INT | 本行程预警总数（围栏+故障+电池+驾驶，**含所有状态**：未处理/维修中/维修完成均计入） |
| expired | TINYINT(1) | 是否超 30 天（地图占位符） |
| INDEX (vin, end_at) | | |

> 行程定义：开始=GPS 持续≥5min；结束=超 10min 无定位。
> 轨迹保留 **30 天**，超期 `expired=1`，详情页地图显示占位符"行驶轨迹已过期"。

### 1.8.2 `trip_tracks`（行程轨迹点）
| 字段 | 说明 |
|------|------|
| trip_id FK | |
| seq INT | 顺序 |
| lat/lng | |
| speed_kmh | |
| ts TIMESTAMP | |

## 1.9 维修（repair）

### 1.9.1 `repairs`（维修工单）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK | |
| vin | CHAR(17) | FK | |
| plate | VARCHAR(16) | | 冗余 |
| type | TINYINT | NOT NULL | 1=故障类(`FAULT`) 2=电池类(`BATTERY`)（见 §0.1.6） |
| description | VARCHAR(255) | NOT NULL | **来源规则**：① 一键报修 → 自动取预警类型原文文案（如"VDC故障报警"/"SOC低报警"）；② 手动新建 → 从对应枚举中**单选**一个预警类型，description = 所选类型文案。**非 TextArea 自由输入**。 |
| status | VARCHAR(16) | DEFAULT 'IN_PROGRESS' | 存储码：`IN_PROGRESS`(维修中) / `COMPLETED`(维修完成)。**筛选下拉统一文案"维修完成"**（PRD"已完成"为笔误，PM 确认）。 |
| source_alert_type | VARCHAR(16) | NULL | `'fault'`/`'battery'`（仅一键报修生成时有值） |
| source_alert_id | BIGINT | NULL | 反向定位预警（仅一键报修有值） |
| operator_id | VARCHAR(32) | NOT NULL | 最近操作人；**创建和完成维修时均更新为此操作者** |
| started_at | TIMESTAMP | NOT NULL | 开始时间 = 生成时间 |
| completed_at | TIMESTAMP | NULL | 完成维修时间（PUT /repairs/{id}/complete 时写入） |
| created_at | TIMESTAMP | | |
| INDEX | | (vin, created_at) | |

> **无编辑功能**（PRD V5 删除"编辑维修"）。
> **删除回退规则**（见 §3.1）：仅当 `source_alert_id IS NOT NULL`（来自一键报修）才回退对应预警状态为 `PENDING`；手动创建的 repair 删除时不影响任何预警。

## 1.10 实时监控（monitor）

### 1.10.1 `vehicle_realtime`（车辆实时位置 — 内存/Redis 优先）
| 字段 | 说明 |
|------|------|
| vin CHAR(17) PK | |
| tenant_id BIGINT | |
| plate / company_name | | |
| lat / lng | |
| speed_kmh | |
| soc | |
| device_name | |
| device_status TINYINT | 在线/离线 |
| reported_at TIMESTAMP | 数据上报时间 |

> 实时位置数据范围 = **当前租户 + 所有下级**。轨迹回放仅允许查最近 30 天。

## 1.11 车辆数据（vehicle_data）

### 1.11.1 `vehicle_signals`（车辆信号明细 — 时序大表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| vin CHAR(17) | INDEX | |
| device_id / device_name | | |
| plate | | |
| reported_at TIMESTAMP | | 上报时间 |
| signal_group | VARCHAR(16) | 电池/充电/风控预警/驾驶预警 |
| signal_code | VARCHAR(32) | 信号码 |
| signal_value | VARCHAR(64) | 信号值 |
| INDEX (vin, reported_at) | | |

> 同 vin+同时间戳的所有信号 pivot 成行（行键 = vin + reported_at）；缺失信号值返回 null，前端渲染为 "--"。信号枚举见 §6.1。

### 1.11.2 `export_tasks`（导出任务）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| file_name | VARCHAR(128) | 车辆信号数据_YYYYMMDDHHmmss.csv |
| row_count | INT | 实际导出数据条数 |
| filters | JSON | 筛选条件快照 |
| status | TINYINT | 0=处理中 1=已完成 2=已失败 3=已过期 |
| file_url | VARCHAR(255) | 下载链接 |
| created_at TIMESTAMP | 创建时间 |
| expired_at | TIMESTAMP | = created_at + 7 天 |
| operator_id VARCHAR(32) | |

> **过期判定**：
> - 列表 `status` 由**定时任务每日扫描**，将 `now > expired_at` 且 `status=1` 的记录更新为 `status=3(已过期)`。
> - 下载接口**二次校验** `now < expired_at && status=1`，否则拒绝。
> 预估行数 > 20 万不创建任务（见 §2.13 两步预估）。

## 1.12 系统管理（sys）

> 系统管理模块的用户/角色表结构与业务管理相同，仅**数据范围=仅当前租户**（业务管理=全应用）。复用 `users`/`roles`，通过接口层区分范围。

### 1.12.1 `audit_logs`（审计日志 — 47 项映射）
| 字段 | 类型 | 说明 |
|------|------|------|
| id BIGINT PK | | |
| operator_id VARCHAR(32) | | 操作人 ID |
| operator_name VARCHAR(64) | | 操作人昵称 |
| operator_email VARCHAR(128) | | 操作账号 |
| tenant_id BIGINT | | 所属租户 |
| tenant_name VARCHAR(128) | | 所属租户名称 |
| menu VARCHAR(32) | | 操作菜单（一级菜单） |
| action VARCHAR(32) | | 操作功能（枚举，见 §5.2 完整 47 项） |
| content TEXT | | 操作内容（按 §5.2 模板拼装，VIN 一律脱敏） |
| result TINYINT | 1=成功 0=失败 |
| created_at TIMESTAMP | 倒序，保留≥180 天 |
| INDEX (tenant_id, created_at), (menu) | | |

> **数据范围（PM 确认 R4-H1）**：审计日志数据范围 = **仅当前租户**（与 §4.1 数据范围矩阵一致）。
> PRD §搜索筛选"所属租户=当前应用下所有租户名称"为描述偏差，实际查询仅返回当前租户的日志；"所属租户"下拉**仅展示当前租户自身**（无下级可选），"全部"选项等同当前租户。

## 1.13 仪表盘（dashboard）— 无独立表，聚合查询

> `/dashboard/*` 接口从 vehicle_realtime / driving_alerts / fence_alerts / fault_alerts / battery_alerts / vehicles 实时聚合。

## 1.14 脱敏与存储规则（跨表通用）

| 字段 | 存储 | 接口返回 | 导出/下载 |
|------|------|---------|----------|
| VIN（17 位） | 明文 | 前 6 + `*******`(7) + 后 4 | **明文** |
| 车牌（≥5 位） | 明文 | 首 2 + `*`(中) + 尾 2；≤4 位不脱敏 | **明文** |
| 经纬度 | 明文 | — | — |
| 地址（逆地址解析） | 明文（街道/路口级，移除门牌号） | **默认收起不返回**，点击"查看位置"时返回完整地址 | — |
| 新建维修的 VIN/车牌 | 明文 | **不脱敏，明文展示**（PRD 明确） | — |

> 地址截断规则：车辆列表 `last_address` 截断至 **20 字符 + "…"**（省略号）；气泡/详情接口返回完整 address。
> 搜索匹配：支持明文精确匹配 + 脱敏后可见字符模糊匹配（见 §0 `matchMasked`）。

> 后端按请求上下文决定返回脱敏值还是明文（导出接口返回明文）；前端只需渲染。
> **注（R3-L3）**：PRD §检索匹配规则原文为"前端再执行脱敏渲染"，本 Spec 采用**后端脱敏**方案（比 PRD"前端脱敏"更安全，避免明文泄露到前端 JS 内存），导出接口返回明文。
>
> **复制到剪贴板（L2）**：PRD 多处「复制信息 → toast 复制成功」（开通账号复制邮箱+密码/昵称、租户编码复制等）均为**纯前端** `navigator.clipboard.writeText()` 实现，后端无需提供复制接口；后端只负责返回待复制内容（如初始密码、昵称），前端完成复制动作。

---

# 第二部分 · API 契约定义

> 风格：RESTful + 资源化路径；统一前缀 `/api`；统一响应包络。

## 2.1 统一响应包络

```jsonc
// 成功
{ "code": 0, "message": "ok", "data": { ... }, "traceId": "xxx" }
// 分页
{ "code": 0, "data": {
    "list": [ ... ],
    "total": 128,
    "page": 1,
    "pageSize": 20
  }}
// 失败
{ "code": 40101, "message": "账号密码错误", "data": null, "traceId": "xxx" }
```

### 2.1.1 错误码段位规划
| 段位 | 含义 |
|------|------|
| 0 | 成功 |
| 400xx | 参数错误（40001 缺参 / 40002 格式 / 40003 业务校验失败） |
| 401xx | 认证失败（40101 账号密码错误 / 40102 验证码错误 / 40103 token 失效） |
| 403xx | 权限不足（40301 无功能权限 / 40302 越权访问租户） |
| 404xx | 资源不存在 |
| 409xx | 冲突（40901 唯一性冲突 / 40902 状态不允许操作） |
| 429xx | 限流 |
| 500xx | 服务端错误 |

### 2.1.2 公共 Query 约定
- 分页：`page`, `pageSize`（10/20/50/100）；**默认值由各接口定义，参见 §0**（R4-M1）
- 时间范围：`startTime`, `endTime`（智利时区，秒级）
- 排序：`sort=created_at,desc`（默认）
- 语言：Header `Accept-Language: zh|en`

## 2.2 认证与基础能力

| Method | Path | 说明 | 请求要点 |
|--------|------|------|---------|
| POST | `/auth/login` | 登录 | `{email, password, captcha, captchaId}`；**校验优先级**：① 先验 captchaId+captcha（错→40102"验证码错误"） ② 再验 email+password（错→40101"账号密码错误"，账号不存在也返回此文案）；成功返回 `{token, user, mustChangePassword}`。**mustChangePassword=true 时前端拦截进入主界面**，强制弹出改密弹窗且不可关闭，改密成功后才可进入（R3-L9） |
| POST | `/auth/logout` | 退出 | 写审计 |
| PUT | `/auth/change-password` | 修改密码 | `{currentPassword, newPassword, confirmPassword}`；**服务端校验**（兜底）：① currentPassword 正确（错→40002"当前密码错误"） ② newPassword 长度 8~18 + 数字/英文/特殊字符 ③ newPassword ≠ currentPassword（同→40002"新密码不能与当前密码相同"） ④ **newPassword === confirmPassword**（不等→40002"新密码不一致"） |
| POST | `/auth/reset-password` | 管理员重置 | `{userId, tenantId}`；生成大写+数字 8 位随机密码；返回 `{newPassword}` |
| GET | `/auth/captcha` | 验证码 | 返回 `{captchaId, imageBase64}`；**有效期 5 分钟**，存储 Redis，一次性消费 |
| GET | `/auth/my-tenants` | 我关联的租户 | 平铺（按 related_at 升序，最新在下）；每项含 `{tenantId, tenantName, isExpired}`（**service_expire_at 是否已过期**）；**仅 1 个租户时前端隐藏切换按钮** |
| PUT | `/auth/current-tenant` | 切换租户 | `{tenantId}`；记录最近选择；**若所选租户已过期 → 403"该租户服务已过期"** |

**异常文案**：`账号密码错误` / `验证码错误` / `当前密码错误` / `请输入8~18位字符，支持数字、英文、特殊字符` / `新密码不能与当前密码相同` / `新密码不一致`。
> **租户到期逻辑**（见 §3.8）：① 登录后默认选中最近租户 → 已过期则自动选下一个未过期租户 → 全部过期则拒绝进入 ② Topbar 列表中已过期租户显示"服务过期"标签 ③ 到期租户的**一级及其全部下级**均显示过期。

## 2.3 业务管理（biz）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/biz/tenant-tree` | 租户层级树（根+一级只读，二级及以下增删改） |
| POST | `/biz/tenant-tree` | 新增层级（`{parentId, name}`） |
| PUT | `/biz/tenant-tree/{id}` | 编辑名称 |
| DELETE | `/biz/tenant-tree/{id}` | 删除（有下级拒绝） |
| GET | `/biz/tenant-tree/{id}/permissions` | 取该层级模板/租户权限 |
| PUT | `/biz/tenant-tree/{id}/permissions` | 配置功能权限（根级拒绝） |
| GET | `/biz/tenant-info` | 租户信息树（模糊搜索 `keyword`） |
| GET | `/biz/tenant-info/{id}` | 租户详情（基础信息+管理员） |
| GET | `/biz/assets` | 资产列表（`vin`精准 / `tenantIds`多选含'未划拨' / `syncStart`,`syncEnd`） |
| POST | `/biz/assets/sync` | 从 IOT 同步（按 channel_code）。**增量规则（R3-L10）**：以 VIN 为唯一标识，已存在则跳过（不更新），不存在则入库；返回 `{newCount, skipCount, totalCount}` |
| POST | `/biz/assets/transfer` | 单条划拨 `{vin, toTenantId}` |
| POST | `/biz/assets/batch-transfer` | 批量划拨 `{vins[], toTenantId}`；未勾选返回"请选择指定数据操作"；**toTenantId 可选范围=全应用租户树任意层级节点（R3-L11，PRD"无层级限制"）** |
| GET | `/biz/assets/{vin}/transfer-records` | 划拨记录 |
| DELETE | `/biz/assets/{vin}` | 删除资产（有设备拒绝） |
| GET | `/biz/users` | 用户列表（`tenantId`,`nickname`,`email`,`roleIds[]`,`start`,`end`） |
| POST | `/biz/users/check-email` | 校验邮箱是否已存在（创建账号第一步"下一步"） |
| POST | `/biz/users` | 新建（`{tenantId,nickname,email,roleIds[]}`）；返回初始密码或已存在用户信息 |
| PUT | `/biz/users/{userTenantId}` | 编辑（管理员角色置灰）；**编辑邮箱唯一性校验=全局唯一（users.email），排除当前 user_id（R3-L19）** |
| DELETE | `/biz/users/{userTenantId}` | 删除（管理员拒绝；仅删该租户关系） |
| POST | `/biz/users/{userTenantId}/reset-password` | 重置密码 |
| GET | `/biz/roles` | 角色列表（按租户，正序） |
| POST | `/biz/roles` | 新增（`{tenantId,name}`，唯一校验，≤10） |
| PUT | `/biz/roles/{id}` | 编辑 |
| DELETE | `/biz/roles/{id}` | 删除（按是否关联用户给不同提示：未关联→"删除后数据无法恢复，是否继续？"；已关联→"该角色已关联用户，删除后用户无相关权限，是否继续？" R3-L12） |
| PUT | `/biz/roles/{id}/permissions` | 编辑功能权限 |

## 2.4 租户管理（tenant）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/tenants` | 下级租户列表（`code`精准/`name`模糊/`adminAccount`精准/`start`,`end`） |
| POST | `/tenants` | 新增（`code`唯一/`name`唯一） |
| PUT | `/tenants/{id}` | 编辑（`code`置灰） |
| DELETE | `/tenants/{id}` | 删除（已开通主账号拒绝） |
| POST | `/tenants/{id}/activate` | 开通主账号（第一步：`{nickname,email}`；第二步返回初始密码或已存在用户） |

## 2.5 车辆管理（vehicle）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/vehicles` | 列表（VIN/车牌/设备ID/电池版本 模糊；车龄 min-max） |
| GET | `/vehicles/{vin}` | 详情（静态+动态+设备） |
| POST | `/vehicles/import` | 批量导入（multipart；返回成功/失败条数 + 失败明细 URL） |
| GET | `/vehicles/import/template` | 下载模板 |
| GET | `/vehicles/{vin}/alerts` | 风控预警记录 tab（围栏 2 + 故障 9 + 电池 14 = **25 种**汇总，R3-M6） |
| GET | `/vehicles/{vin}/driving-alerts` | 驾驶预警记录 tab（6 种，含位置车速） |
| GET | `/vehicles/{vin}/battery` | 电池监控信息 tab |
| GET | `/vehicles/{vin}/charges` | 充电记录 tab |
| GET | `/vehicles/{vin}/trips` | 行程记录 tab（起终点默认收起） |
| GET | `/vehicles/{vin}/repairs` | 维修记录 tab |
| GET | `/vehicles/{vin}/mileage` | 里程报表（`dimension=day|week|month|year`；**各维度默认展示范围（R3-M8）**：day→近30天 / week→近30周 / month→近12个月 / year→近3年） |

**批量导入覆盖规则**：
- 可覆盖：`车牌号、外观、车型、购车时间`
- 不可覆盖：`VIN、设备ID、车龄、总里程、电池版本、最后位置`
- 文件校验：格式非 xls/xlsx/csv → 整文件失败"请上传正确的 Excel 文件格式"；>50MB → "文件过大，请分批导入"。
- **同文件 VIN 重复处理（H8 · 保留首行）**：按文件行序逐行处理，**VIN 首次出现即入库**；后续重复行**跳过不入库**，并写入失败明细 `failure_detail`（失败原因="VIN 重复"）。VIN 空/非 17 位/租户无此 VIN → 同样跳过该行并写入失败明细。失败明细 Excel 字段：`行号 / VIN / 失败原因`。

## 2.6 风控预警（risk）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/risk/fence-alerts` | 围栏预警列表 |
| GET | `/risk/fence-alerts/{id}` | 围栏预警详情（含地图围栏范围） |
| GET | `/risk/fault-alerts` | 故障预警（`type[]`多选，存储码见 §0.1.1 共 9 种；`status` 见 §1.5.2） |
| POST | `/risk/fault-alerts/{id}/repair` | 一键报修（状态→维修中，生成 repair，回写 source_alert） |
| GET | `/risk/battery-alerts` | 电池预警（`type[]`多选，存储码见 §0.1.2 共 14 种；`status` 见 §1.5.3） |
| POST | `/risk/battery-alerts/{id}/repair` | 一键报修 |

## 2.7 驾驶行为（driving）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/driving/alerts` | 驾驶预警（`plate`模糊/`start`,`end`/`type`单选含全部） |
| GET | `/driving/reports` | 驾驶报告（`tab=weekly|monthly`，**默认 weekly（R3-L4）** /`plate`/`period`/**仅允许选择 `now-1年` 以内的周/月（R3-M4）**；`tab=weekly` 时默认 `period=上周`，`tab=monthly` 时默认 `period=上月`；`period` 格式：周报 `YYYY-Www`（如 2025-W21），月报 `YYYY-MM` / **`riskLevel`** 单选，枚举 `{all,safe,low,mid,high}` 见 §0.1.7 存储码，**默认 `all`**） |
| GET | `/driving/reports/{id}` | 报告详情（指标+里程趋势+区域分布+建议）；**详情 JOIN vehicles 表返回 model/color/car_age_years（R3-L7，PRD 详情字段含车型/外观/车龄）**。**详情"累计行驶里程"= `vehicles.total_mileage_km`（PM 确认 R4-M3：≠列表"行驶里程"，列表为报告周期内里程，详情累计为车辆总里程）；"累计行驶时长"=本报告周期内累计行驶时长** |

## 2.8 电池管理（battery）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/battery/monitor` | 监控列表（含 4 项聚合：平均 SOC/温度/续航/低电预警数；`plate`模糊） |
| GET | `/battery/monitor/{vin}` | 监控详情（含 30 天日均电耗趋势） |
| GET | `/battery/charges` | 充电记录（`plate`/`start`,`end`） |
| GET | `/battery/discharges` | 放电记录（`plate`/`start`,`end`） |

## 2.9 行程管理（trip）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/trips` | 行程列表（`plate`/`start`,`end`） |
| GET | `/trips/{id}` | 行程详情（含轨迹；超 30 天地图占位"行驶轨迹已过期"） |

## 2.10 围栏管理（fence）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/fences` | 列表（`name`模糊/`type`/`status`/`operatedStart`,`operatedEnd` 最长 1 年）；**每项返回聚合字段 `vehicleCount`**（由 fence_vehicles 表 COUNT 聚合，非存储字段，R3-L13） |
| POST | `/fences` | 新建（中心点：name/type/alertType/address/radius≤100>0；自定义：polygon≤99 闭合） |
| PUT | `/fences/{id}` | 编辑（仅 status=未生效） |
| DELETE | `/fences/{id}` | 删除（仅 status=未生效；二次确认） |
| PUT | `/fences/{id}/toggle` | 启用/停用（关闭需二次确认） |
| GET | `/fences/{id}` | 详情 |
| GET | `/fences/{id}/vehicles` | 围栏车辆（`vin`/`plate`模糊） |
| POST | `/fences/{id}/vehicles` | 添加车辆 |
| DELETE | `/fences/{id}/vehicles/{vin}` | 删除车辆 |

## 2.11 维修管理（repair）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/repairs` | 列表（`plate`/`type`/`status`/`start`,`end`） |
| POST | `/repairs` | 新建（`{vin,type,description}`；无编辑） |
| PUT | `/repairs/{id}/complete` | 完成维修（状态→维修完成，置 completed_at） |
| DELETE | `/repairs/{id}` | 删除（预警状态回退→未处理） |

## 2.12 实时监控（monitor）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/monitor/realtime` | 实时位置列表（`keyword`企业名/VIN 模糊；范围=当前租户+下级）。**列表接口仅返回轻量字段 `{vin, status(在线/离线)}`**（N-M8）；支持 `zoom` 参数做地图聚合（M5）：低 zoom 返回 cluster 聚合点 `{lat,lng,count}`，高 zoom 返回明细；**刷新周期建议 30s** |
| GET | `/monitor/enterprise-vehicles` | **企业-车辆层级树（R3-M3）**：返回按企业层级分组的树结构 `[{tenantId, tenantName, vehicleCount, vehicles:[{vin, status}]}]`，支持按 tenantId 筛选下级。前端用于左侧"企业树+车辆列表+多选联动+一键全选企业下车辆"交互（PRD §实时位置原文） |
| GET | `/monitor/realtime/{vin}` | 单车详情气泡（完整字段：VIN/车牌/企业/设备名/设备状态/车速/上报时间） |
| GET | `/monitor/trajectory` | 轨迹回放（`vin`必选/`start`,`end` ≤30 天）。**默认时间范围（N-M9）**：未传时 `startTime=当日 00:00:00`，`endTime=now`；起点=该时间范围 tracks 的首个轨迹点，终点=末个轨迹点。**仅支持按车辆单选，不支持按企业选择（R3-L17，与实时位置不同）**。**倍速播放（1/2/4/8x）为纯前端播放器能力，轨迹数据接口仅返回点位序列（R3-L1）** |
| GET | `/monitor/trajectory/{vin}/trips` | 该车轨迹回放行程记录列表。**该接口 duration 格式为 `HH:mm:ss`（R3-L2，PRD §轨迹回放要求"时-分-秒"，与行程管理列表 `HH:mm` 不同）** |

## 2.13 车辆数据（vehicle-data）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/vehicle-data/signals` | 信号数据（`vins[]`≤10/`signalCodes[]`/`start`,`end` ≤180 天，默认近 7 天） |
| POST | `/vehicle-data/exports/estimate` | **预估行数（H9 第一步）**：入参与创建接口一致；返回 `{estimatedRows, allowed}`。预估算法 = 以相同筛选条件执行 `COUNT(*)`；`estimatedRows > 200000` 时 `allowed=false` |
| POST | `/vehicle-data/exports` | 创建导出任务（**前端须先调 estimate 且 `allowed=true` 才可调用**；后端二次校验预估 >20 万则 40903「预估行数超限，请缩小筛选范围」） |
| GET | `/vehicle-data/exports` | 导出记录列表（`start`,`end` 默认近 7 天） |
| GET | `/vehicle-data/exports/{id}/download` | 下载（状态≠已完成 或 已过期 7 天拒绝） |

## 2.14 系统管理（sys）

| Method | Path | 说明 |
|--------|------|------|
| GET/POST/PUT/DELETE | `/sys/users[...]` | 用户 CRUD（范围=仅当前租户，参数与业务管理同） |
| GET/POST/PUT/DELETE | `/sys/roles[...]` | 角色 CRUD |
| GET | `/sys/audit-log` | 日志（`operatorName`/`operatorEmail`模糊/`tenantId`（**R4-M7：不传或空=全部=当前租户，PM 确认数据范围仅当前租户**）/`menu[]`多选（**13 个一级菜单枚举见 §6.3，R4-L11**）/`action[]`/`start`,`end`≤180 天默认近 7 天/`result`） |
| GET | `/sys/audit-log/actions` | **操作功能枚举（H6/N-M10）**：接收 `menus` 参数（逗号分隔的一级菜单名数组，如 `?menus=业务管理,系统管理`），**仅返回这些菜单下的 action 列表**做联动过滤；未传 `menus` 时返回全部 47 项。返回结构 `AuditActionEnum[]`：`{ menu, action, label_zh, label_en }`（完整 47 项 menu↔action 映射见 §5.2）。前端"操作功能"下拉选中 menu 后调本接口刷新候选项 |

## 2.15 仪表盘（dashboard）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/dashboard/metrics` | 8 指标：车辆总数/在线/离线/今日里程/累计里程/今日驾驶预警/今日围栏预警/今日低电预警(`type=SOC_LOW` 即"SOC低报警"，见 §0.1.2)。**口径定义**：在线/离线——**PM 确认（R3-H2）每车1设备，设备数=车辆数**，故"OBD设备在线数"=在线车辆数，按 §1.3.2 设备 status 统计；**今日里程 = Σ(各车 `total_mileage_km` 当前值 − 今日 00:00 快照值)**（M15，需 vehicles 表记录每日 0 点里程快照或从 trips 当日 mileage 求和，二者等价取其一） |
| GET | `/dashboard/driving-chart` | 驾驶风险柱状图（`range=today|7d|30d`，**默认 `today`（R3-L20，PRD"默认选择今日"）**，X=6 种 ADAS，Y=数值） |
| GET | `/dashboard/ranking` | 今日预警排行榜（驾驶/围栏/故障/低电 + 总计，按总计倒序）。**返回字段（R4-L3）**：`[{plate, drivingCount, fenceCount, faultCount, lowBatteryCount, total}]`，按 total 倒序；**不分页**（PRD 未提分页，前端限制 Top 100） |
| GET | `/dashboard/realtime-map` | 实时位置地图数据。**返回字段（R4-L2）**：`[{vin, lat, lng, plate, soc, speed_kmh}]`，前端做地图打点（ICON+车牌号）+自动缩放至展示所有车辆 |

---

# 第三部分 · 核心业务状态机

## 3.1 维修 / 故障电池预警 联动状态机

```
                  [故障/电池预警]                          [维修记录手动新建]
                  status=未处理                             status=维修中
                       │                                        │
        一键报修 ──────┘                                        │
                       ▼                                        │
              status=维修中  ◄─────── 创建 repair(type,desc) ◄──┘
              repair.status=维修中
                       │
              完成维修 │ PUT /repairs/{id}/complete
                       ▼
              status=维修完成
              repair.status=维修完成 (completed_at=now)
              预警按钮隐藏

              ── 删除维修记录 (DELETE /repairs/{id}) ──
              若该 repair 来自 source_alert：
                  预警.status 回退 → 未处理
                  预警.source_repair_id = NULL
              repair 物理删除
```

**约束**：
- 故障/电池预警仅 `未处理` 展示「一键报修」
- 维修记录**无编辑**
- 一键报修必须自动带入车辆数据、生成 description（取预警类型名）
- **一键报修带入字段清单（N-M1）**：从预警记录自动填充 repair 以下字段，无需用户手填：
  - `vin` ← 预警.vin
  - `plate` ← 预警.vin 关联车辆.plate（冗余便于查询）
  - `type` ← `FAULT`（来自 fault_alerts）或 `BATTERY`（来自 battery_alerts）
  - `description` ← 预警类型**原文文案**（如"VDC故障报警"/"SOC低报警"，见 §0.1.1/§0.1.2，**非存储码**）
  - `source_alert_type` ← `'fault'` / `'battery'`
  - `source_alert_id` ← 预警.id（用于删除回退，见 §1.9.1）

## 3.2 围栏生命周期

```
   新建围栏 ──▶ status=未生效(默认)
        │
   开启 toggle ──▶ status=生效中 ──(关闭,二次确认)──▶ status=未生效
                                        │
                            未生效状态才允许：编辑 / 删除
```

**约束**：编辑/删除前置校验 `status==未生效`，否则 40902「请先关闭围栏」。

## 3.3 资产划拨

```
   IOT 同步 ──▶ assets.tenant_id=NULL (未划拨)
                     │
        单条/批量划拨 ──▶ assets.tenant_id=X
                     │     + 写 asset_transfer_records (from=NULL,to=X)
                     │
        再次划拨 ──▶ tenant_id=X→Y
                     + 写 record (from=X,to=Y)
```

**约束**：有 device_id 的资产不可删除（409「该资产已关联设备，不可删除」）。

**资产↔车辆数据流转（R4-M2）**：资产划拨到租户 X 时，**同步在 `vehicles` 表创建记录**（`vin`/`tenant_id`/`device_id` 从 `assets` 同步拷贝；`plate`/`model`/`color`/`battery_version`/`purchased_at` 等扩展字段初始为 NULL，待批量导入填充）。再次划拨（X→Y）时更新 `vehicles.tenant_id=Y`。

**删除级联（R4-M8）**：删除 `assets` 记录时，同步**物理删除**该 VIN 在 `vehicles`/`battery_monitor`/`driving_alerts`/`fault_alerts`/`battery_alerts`/`trips`/`repairs` 等关联表的数据，避免"幽灵车辆"。删除前校验 `device_id IS NULL`（已拆除设备才可删）。

## 3.4 账号开通（租户主账号 / 业务-系统用户）

> **PM 确认（N-M3）**：PRD 原文"赋予本用户**该租户下级**的管理员角色"中"下级"为笔误，实际为**当前租户**的管理员角色。开通账号 = 在**当前操作的租户**下创建/复用管理员角色并分配给该用户（不新建下级租户）。

```
第一步：填 {nickname, email(必填,邮箱校验), role(开通账号置灰=当前租户管理员角色; 普通用户多选)}
   │ 下一步: 按 email 查用户中心
   ▼
[账号不存在]                              [账号已存在]
   创建用户                               展示已存在 userId/email/nickname
   生成初始密码(大写+数字 8 位)            在已有角色基础上追加本次所选角色
   关联当前租户+管理员角色                 已存在的不重复添加
   返回 {userId,email,password}           返回 {userId,email,nickname}（无 password）
   ▼
复制信息 → 完成 → 跳回列表
```

**复制信息内容差异（M10）**：
- 账号不存在分支：复制 `{登录邮箱, 初始密码}` 到剪贴板，toast「复制成功」。
- 账号已存在分支：复制 `{登录邮箱, 用户昵称}` 到剪贴板（**无密码**），toast「复制成功」。

**保护规则**：管理员角色/账号不可删、不可编辑权限、编辑时角色置灰、新建用户时管理员角色置灰不可选。

## 3.5 导出任务状态机

> **预估算法（H9）**：以与创建接口**完全相同的筛选条件**执行 `SELECT COUNT(*) FROM vehicle_signals WHERE <filters>` 得到 `estimatedRows`。前端**必须先调** `POST /vehicle-data/exports/estimate`（见 §2.13），`allowed=true` 才可调创建接口；后端创建时二次校验，>20 万返回 40903。

```
   前端调 /exports/estimate ──▶ estimatedRows
                │
        estimatedRows > 20万? ──是──▶ allowed=false ──▶ 拦截(不创建) 提示"预估行数超限，请缩小筛选范围"
                │否 allowed=true
                ▼
          前端调 /exports 创建 ──▶ 后端二次 COUNT 校验 ──▶ status=处理中
                                   │
                          异步导出 ──▶ status=已完成 (file_url, 7 天有效)
                                       │
                                       ├─▶ status=已过期 (超 7 天，定时任务置位，拒绝下载)
                                       └─▶ status=已失败 (异常)
   仅"已完成"且未过期允许下载；导出明文不脱敏。
```

## 3.6 行程生成（信号驱动）

```
   GPS 上报持续 ≥5min ──▶ 开启新行程 trip.status=进行中
   超 10min 无定位     ──▶ 结束行程，落库（mileage/duration/avg/max/min speed/alert_count）
   行程轨迹保留 30 天  ──▶ 超 30 天 trip.expired=1，地图显示"行驶轨迹已过期"
```

## 3.7 充放电判定（信号驱动）

```
   充电状态∈{0100b,0011b} ∧ 电流>+2A 持续 1min ──▶ 生成 charge_record
   充电状态=0000b ∧ 电流<-2A ∧ 车速>0 持续 1min ──▶ 生成 discharge_record
```

## 3.8 租户服务到期状态机（H4）

> PRD §租户切换原文：① 记录用户最近一次切换的租户，退出登录默认选中最近租户；② **若最近一次切换的租户已到期，则默认选中下一个未到期的租户**；③ **若登录账户关联下的租户归属的一级租户服务到期，则该一级租户及二三级租户显示服务过期**。

```
   用户登录 / 切换租户
        │
        ▼
   GET /auth/my-tenants 返回 [{tenantId, tenantName, isExpired, level, parentId}]
        │
   选定"最近一次切换的租户"
        │
   该租户 isExpired? ──是──▶ 自动选下一个 isExpired=false 的租户
        │否                       │
        ▼                        ▼
   进入该租户              全部 isExpired=true? ──是──▶ 403"所有关联租户服务已过期"，拒绝进入
        │
        ▼
   Topbar 租户列表渲染：
     - isExpired=true 的租户显示「服务过期」标签（置灰不可选）
     - 一级租户 isExpired=true → 其全部二三级子租户均显示「服务过期」（继承父级到期状态）
        │
        ▼
   业务操作拦截：
     - 当前租户 isExpired=true 时，除「查看」外的新增/编辑/删除/开通账号等写操作 → 403「该租户服务已过期，不可操作」
     - 读操作（列表/详情/导出记录查看）允许，保证历史数据可查
```

**字段与接口支撑**：
- `tenants.service_expire_at`（§1.2.1）：到期时间戳；`now > service_expire_at` 即到期。
- `GET /auth/my-tenants`（§2.2）：每项返回 `isExpired`（当前租户自身到期 OR 其一级祖先到期 → `true`）。
- `PUT /auth/current-tenant`（§2.2）：切换到 `isExpired=true` 的租户 → 403「该租户服务已过期」。
- **到期继承计算**：`isExpired(tenant) = (tenant.service_expire_at != NULL AND now > tenant.service_expire_at) OR (存在祖先链中任一一级租户到期)`。一级租户到期时，其后端在 `my-tenants` 返回中将其自身及所有后代 `isExpired` 置 `true`。

---

# 第四部分 · 权限矩阵

## 4.1 数据范围矩阵（PRD 全局定义）

| 一级菜单 | 二级菜单 | 数据范围 |
|---------|---------|---------|
| 首页看板 | — | 仅当前租户 |
| 车辆管理 | 车辆列表/详情 | 仅当前租户 |
| 实时监控 | 实时位置 / 轨迹回放 | **当前租户 + 所有下级** |
| 风控预警 | 围栏/故障/电池 | 仅当前租户 |
| 驾驶行为 | 预警/报告 | 仅当前租户 |
| 电池管理 | 监控/充放电 | 仅当前租户 |
| 行程管理 | 行程记录 | 仅当前租户 |
| 围栏管理 | 围栏管理 | 仅当前租户 |
| 维修管理 | 维修记录 | 仅当前租户 |
| 租户管理 | 租户管理 | **当前租户 + 所有下级** |
| 业务管理 | 租户权限/信息/资产/用户/角色 | **全应用** |
| 车辆数据 | 信号/导出记录 | 仅当前租户 |
| 系统管理 | 用户/角色/日志 | 仅当前租户 |

> 后端实现：每次请求从 Token 取 `currentTenantId`；实时监控/租户管理查询时 union 下级 `tenant_id`；业务管理跳过租户过滤（仅根级管理员可见）。

## 4.2 功能权限树清单（配置粒度）

> 三级树：一级菜单 / 二级功能 / 三级按钮。编码格式 `模块.功能.按钮`。

| 一级 | 二级 | 三级（按钮权限） |
|------|------|----------------|
| 首页看板 | 基本/图表/地图/排行 | （查看级，无按钮） |
| 车辆管理 | 批量导入 | 导入/下载模板 |
| | 查看详情 | 风控预警记录/驾驶预警记录/电池监控信息/充电记录/行程记录/维修记录/里程报表 |
| 实时监控 | 实时位置 | — |
| | 轨迹回放 | — |
| 风控预警 | 围栏预警 | 查看详情 |
| | 故障预警 | 一键报修 |
| | 电池预警 | 一键报修 |
| 驾驶行为 | 驾驶预警 | — |
| | 驾驶报告 | 查看详情 |
| 电池管理 | 电池监控 | 查看详情 |
| | 充放电记录 | 充电记录/放电记录 |
| 行程管理 | 行程记录 | 查看详情 |
| 围栏管理 | 预警围栏信息 | 新建围栏/编辑围栏/删除围栏/围栏开关/查看详情/车辆配置 |
| 维修管理 | 维修记录 | 新建维修/完成维修/删除记录 |
| 租户管理 | 租户管理 | 新增租户/编辑租户/删除租户/开通账号 |
| 车辆数据 | 车辆信号数据 | 导出数据 |
| | 数据导出记录 | 下载文件 |
| 系统管理 | 用户管理 | 新增用户/编辑用户/删除用户/重置密码 |
| | 角色管理 | 新增角色/编辑角色/删除角色 |
| | 日志审计 | — |

## 4.3 RBAC 层级与配置规则

```
根级租户(苇渡) ─ 默认全权限，不可配置
   └ 一级租户   ─ 在"租户维度"配置，可选范围=应用全部功能权限（菜单+按钮）
        └ 二级及以下 ─ 在"租户层级模板"维度配置（批量定义同级权限模板）
```

- **租户权限** = 该租户最大权限范围
- **角色权限** = 角色在该范围内的子集（前端 Select 候选项受租户权限裁剪）
- **菜单可见性** = 用户在当前租户角色权限 ∩ 租户权限
- **操作按钮** = 同上，按三级按钮码控制

## 4.4 管理员保护矩阵

| 对象 | 编辑 | 删除 | 改权限 | 角色选择 |
|------|------|------|--------|---------|
| 管理员角色 | ✗ | ✗ | ✗ | — |
| 管理员账号 | ✓（角色置灰） | ✗ | ✗ | 置灰不可选 |
| 普通角色/账号 | ✓ | ✓（按关联用户提示） | ✓ | ✓ |

> **页面访问限制（M7）**：业务管理「租户信息」页（`/biz/tenant-info`）**仅 root tenant（根级苇渡）的 admin 角色可访问**，其余角色访问 → 403。该页面面向应用管理员，展示全应用租户层级与主管理员账号信息。
>
> **角色管理 UI 细节（M8）**：管理员角色行在 UI 层**不渲染**「编辑/删除」图标（非渲染后置灰），避免误操作入口；普通角色行鼠标移入显示编辑/删除图标。
>
> **删除用户语义（M9）**：业务管理/系统管理删除用户 = 仅删除 `app_user_tenants` 中该用户在**当前租户**下的关联行（含角色关系），**不删除 `users` 主记录**（保留用户中心账号，供其他租户继续关联）。`DELETE /biz/users/{userTenantId}` 与 `DELETE /sys/users/{userTenantId}` 路径参数 `userTenantId` 即 `app_user_tenants.id`，语义已体现"仅删该租户关系"。

## 4.5 鉴权与越权校验

1. 登录 → 颁发 JWT（含 `userId`、`tenantId`、`roleIds`、`permissions`、`lang`）
2. 请求中间件：
   - 验签 + 过期 → 40103
   - 功能权限码校验（按钮级）→ 40301
   - 数据范围校验（操作的 tenant_id 是否在可见集）→ 40302
3. 切换租户 → 后端重算 `permissions` 并刷新 Token 或返回新 Token

---

# 第五部分 · 业务对象定义

> 格式：对象名 / 职责 / 关键字段 / 业务规则。

## 5.1 跨模块枚举对象

> **强约束（N-H1/N-H2 闭环）**：本节枚举的**存储码**统一以 §0.1 枚举对照表为准；**展示文案**一律用 PRD 原文（严禁缩写）。以下对象定义仅为类型引用，**权威定义见 §0.1**。

### `FaultType`（故障预警类型，9 种）
```
// 存储码，见 §0.1.1；展示文案 = PRD 原文（如存储码 VDC → 展示"VDC故障报警"）
'VDC' | 'CDCU' | 'BDCU' | 'ADAS' |
'DC_DC_TEMP' | 'DC_DC_STATUS' |
'MOTOR_CTRL_TEMP' | 'MOTOR_TEMP' | 'HV_INTERLOCK'
```

### `BatteryAlertType`（电池预警类型，14 种）
```
// 存储码，见 §0.1.2；展示文案 = PRD 原文（如 SOC_LOW → "SOC低报警"；STORAGE_TYPE_OVERCHARGE → "车载储能装置类型过充"）
'TEMP_DIFF' | 'HIGH_TEMP' | 'STORAGE_OVERVOLTAGE' | 'STORAGE_UNDERVOLTAGE' |
'SOC_LOW' | 'CELL_OVERVOLTAGE' | 'CELL_UNDERVOLTAGE' | 'SOC_HIGH' | 'SOC_JUMP' |
'STORAGE_MISMATCH' | 'CELL_CONSISTENCY' | 'STORAGE_TYPE_OVERCHARGE' |
'INSULATION' | 'CHARGE_FAULT'
```

### `DrivingAlertType`（驾驶预警类型，6 种 ADAS）
```
// 存储码，见 §0.1.3；展示文案 = PRD 原文
'CAR_L1' | 'CAR_L2' | 'CAR_AEB' | 'PERSON_L1' | 'PERSON_L2' | 'PERSON_AEB'
```

### `ChargeStatus`（充电状态，5 种）
```
// 存储码，见 §0.1.4；展示文案 = PRD 原文
'NOT_CHARGING' | 'PREPARING' | 'CHARGING' | 'DISCHARGING_OTHER' | 'FAULT'
```

### `RiskLevel`（驾驶风险等级）
> 存储码见 §0.1.7。下表为整数等价表述（PRD 开区间 `1<n≤3` 即整数 2~3）。
| 存储码 | 文案 | 驾驶预警次数（整数） |
|--------|------|------------------|
| `SAFE` | 安全司机 | n ≤ 1 |
| `LOW` | 低危司机 | 2 ≤ n ≤ 3 |
| `MID` | 中危司机 | 4 ≤ n ≤ 6 |
| `HIGH` | 高危司机 | n ≥ 7 |

> ⚠️ 以 §0.1.7 为准，废弃 `PROJECT_CONTEXT.md` 第 243-248 行旧定义。

### `FenceAlertType`
存储码 `'OUT' | 'IN'`（见 §0.1.5）；展示文案"出栏预警"/"入栏预警"。（V5.1 约定：故障/电池用"报警"，围栏/模块标题用"预警"。）

## 5.2 审计日志操作映射对象（47 项）

> 对象名 `AuditAction`：`{ menu, action, contentTemplate }`。`menu` 一律一级菜单。
>
> **接口返回结构（H6 闭环）**：`GET /sys/audit-log/actions`（见 §2.14）返回 `AuditActionEnum[]` 数组，每项结构为 `{ menu, action, label_zh, label_en }`：
> - `menu`：一级菜单名（用于前端按菜单联动过滤）
> - `action`：操作功能码（与下表 `action` 列一致）
> - `label_zh` / `label_en`：操作功能的双语展示文案（供"操作功能"下拉渲染）
> - `contentTemplate`：审计内容模板（仅后端写日志时使用，不下发给前端下拉）
>
> 下表即 47 项 `menu ↔ action ↔ contentTemplate` 的权威映射，前端联动下拉的 `label` 由 i18n 资源按 `action` 取值。

| menu | action | content 模板 |
|------|--------|-------------|
| 账户 | 登录 | 登录系统 |
| 账户 | 退出 | 退出系统 |
| 账户 | 修改密码 | 修改密码 |
| 账户 | 重置密码 | 重置用户【{email}】的密码 |
| 业务管理 | 新增租户层级 | 新增租户层级【{name}】 |
| 业务管理 | 编辑租户层级 | 编辑租户层级【{old}】为【{new}】 |
| 业务管理 | 删除租户层级 | 删除租户层级【{name}】 |
| 业务管理 | 配置功能权限 | 配置【{name}】的功能权限 |
| 业务管理 | 同步资产 | 执行资产同步 |
| 业务管理 | 资产划拨 | 将车辆【{maskedVin}】从【{from}】划拨至【{to}】 |
| 业务管理 | 批量资产划拨 | 批量资产划拨：将【{n}】辆车划拨至【{to}】 |
| 业务管理 | 删除资产 | 删除车辆资产【{maskedVin}】 |
| 业务管理 | 新增用户 | 新增用户【{email}】，分配角色【{roles}】 |
| 业务管理 | 编辑用户 | 编辑用户【{email}】信息 |
| 业务管理 | 删除用户 | 删除用户【{email}】 |
| 业务管理 | 重置密码 | 重置用户【{email}】的密码 |
| 业务管理 | 新增角色 | 新增角色【{role}】 |
| 业务管理 | 编辑角色 | 编辑角色【{role}】 |
| 业务管理 | 删除角色 | 删除角色【{role}】 |
| 业务管理 | 编辑功能权限 | 编辑角色【{role}】的功能权限 |
| 租户管理 | 新增租户 | 新增租户【{name}】 |
| 租户管理 | 编辑租户 | 编辑租户【{name}】信息 |
| 租户管理 | 删除租户 | 删除租户【{name}】 |
| 租户管理 | 开通主账号 | 为租户【{name}】开通主账号【{email}】 |
| 车辆管理 | 批量导入 | 批量导入车辆信息：成功【{s}】条，失败【{f}】条 |
| 围栏管理 | 新建围栏 | 新建围栏【{name}】，类型【{type}】，预警【{alertType}】 |
| 围栏管理 | 编辑围栏 | 编辑围栏【{name}】 |
| 围栏管理 | 删除围栏 | 删除围栏【{name}】 |
| 围栏管理 | 启用围栏 | 启用围栏【{name}】 |
| 围栏管理 | 停用围栏 | 停用围栏【{name}】 |
| 围栏管理 | 添加车辆 | 为围栏【{name}】添加车辆【{vins}】 |
| 围栏管理 | 删除车辆 | 从围栏【{name}】移除车辆【{vins}】 |
| 风控预警 | 一键报修（故障类） | 一键报修（故障类）：车辆【{maskedVin}】，预警类型【{type}】 |
| 风控预警 | 一键报修（电池类） | 一键报修（电池类）：车辆【{maskedVin}】，预警类型【{type}】 |
| 维修管理 | 新建维修 | 新建维修记录：车辆【{maskedVin}】，类型【{type}】 |
| 维修管理 | 完成维修 | 标记维修完成：车辆【{maskedVin}】，类型【{type}】 |
| 维修管理 | 删除维修 | 删除维修记录：车辆【{maskedVin}】，类型【{type}】 |
| 系统管理 | 新增用户 | 新增用户【{email}】，分配角色【{roles}】 |
| 系统管理 | 编辑用户 | 编辑用户【{email}】信息 |
| 系统管理 | 删除用户 | 删除用户【{email}】 |
| 系统管理 | 重置密码 | 重置用户【{email}】的密码 |
| 系统管理 | 新增角色 | 新增角色【{role}】 |
| 系统管理 | 编辑角色 | 编辑角色【{role}】 |
| 系统管理 | 删除角色 | 删除角色【{role}】 |
| 系统管理 | 编辑功能权限 | 编辑角色【{role}】的功能权限 |
| 车辆数据 | 导出车辆信号数据 | 导出车辆【{maskedVins}】信号数据 |
| 车辆数据 | 下载导出文件 | 下载导出文件【{fileName}】 |

> 注：VIN 在审计内容中一律**脱敏**（`maskedVin`/`maskedVins`）；**无"编辑维修"**操作（PRD V5 删除）。本表为完整 **47 项**（R3-M2 修正：一键报修拆为故障/电池 2 条 action，系统管理 8 项逐行列出，确保与 PRD §日志审计数据映射表序号 1~47 一一对应）。

## 5.3 核心业务对象

### `Vehicle`（车辆）
- **职责**：承载车辆静态（VIN/车型/外观/购车时间/电池版本）+ 动态（总里程/最后位置）+ 设备绑定。
- **规则**：批量导入仅可覆盖 4 字段；车龄 = (today - purchased)/365 保留 1 位；总里程取整 km。

### `Device`（OBD 设备）
- **职责**：上报信号、判定在线/离线、驱动预警/行程/充放电。
- **规则**：一车多设备时，车辆在线状态取最早安装设备的状态。

### `Fence`（围栏）
- **职责**：定义电子围栏，生成出入栏预警。
- **规则**：中心点必填地址+半径(0<≤100km)；自定义≤99 点闭合；未生效才可编辑/删除；开关/编辑/删除均记审计与 operator。

### `FaultAlert` / `BatteryAlert`（故障/电池预警）
- **职责**：记录预警事件、联动维修状态。
- **规则**：仅 `未处理` 显示一键报修；删除维修记录回退预警状态为 `未处理`。

### `FenceAlert`（围栏预警）
- **职责**：车辆出入围栏触发，含触发位置/车速/围栏范围（详情地图）。
- **规则**：**围栏预警不联动维修，无 status 字段**（R4-L6）。

### `DrivingAlert`（驾驶预警）
- **职责**：记录 ADAS 风险事件，位置默认收起，含行车速度。
- **规则**：首页柱状图与排行榜数据源。**驾驶预警不联动维修，无 status 字段**（R4-L7）。

### `DrivingReport`（驾驶报告）
- **职责**：按周/月生成单车驾驶评分报告。
- **规则**：5 项各 20% 权重；评分映射表见 §1.6.3；含专属 `mileageTrend`/`regionDistribution`/`suggestions`（数据驱动有兜底）。
- **里程字段（R4-M3）**：列表"行驶里程"=报告周期内里程（`km` 字段）；详情"累计行驶里程"=车辆总里程（JOIN `vehicles.total_mileage_km`），二者不同。

### `BatteryMonitor`（电池监控）
- **职责**：每车最新电池看板（SOC/SOH/温度/续航/充电次数/状态）+ 详情 30 天日均电耗趋势。
- **规则**：日均电耗 = 日放电量/日里程×100，里程 0 时为 0；列表头部 4 项聚合实时计算。

### `ChargeRecord` / `DischargeRecord`（充/放电记录）
- **职责**：记录每次充放电明细。
- **规则**：充电/放电判定见 §3.7；时长格式 HH:mm。

### `TripRecord` / `TripDetail`（行程记录/详情）
- **职责**：行程维度汇总，详情含轨迹（30 天有效）。
- **规则**：起终点默认收起；超 30 天地图显示占位符；预警次数 = 围栏+故障+电池+驾驶。

### `RepairItem`（维修工单）
- **职责**：跟踪维修，反向联动预警状态。
- **字段**：vin/plate/type(故障/电池)/description/status/operator/started_at/completed_at/sourceAlertType/sourceAlertId。
- **规则**：**无编辑**；**description 来源（N-H3 闭环）**：① 一键报修 → 自动取预警类型**原文文案**（见 §3.1 带入字段清单）；② 手动新建 → 从对应枚举（故障 9 种见 §0.1.1 / 电池 14 种见 §0.1.2）**单选**一个预警类型，`description = 所选类型原文文案`，**非 TextArea 自由输入**；完成维修置 `completed_at` 并隐藏按钮；删除回退预警（仅 `source_alert_id` 非空时回退，见 §1.9.1/§3.1）。

### `Tenant` / `TenantNode`（租户 / 层级节点）
- **职责**：多层级组织，承载权限模板与数据隔离。
- **规则**：根级只读；一级只读（由租户管理维护）；二级及下级增删改；有下级不可删；未开通主账号可删。

### `Asset`（资产）
- **职责**：IOT 同步的 VIN 池，业务管理划拨到租户。
- **规则**：有 device 不可删；划拨写 transfer_records。

### `BizUser` / `BizRole`（业务用户/角色）
- **职责**：应用管理员视角的全应用用户与角色管理。
- **规则**：邮箱唯一标识用户中心用户；同邮箱可关联多租户多角色；管理员受保护。

### `SysUser` / `SysRole`（系统用户/角色）
- **职责**：当前租户视角的用户/角色管理（结构同 Biz，数据范围=仅当前租户）。

### `ExportTask`（导出任务）
- **职责**：异步导出车辆信号 CSV。
- **规则**：文件名 `车辆信号数据_YYYYMMDDHHmmss`；>20 万拦截；7 天过期；明文不脱敏。

### `AuditLog`（审计日志）
- **职责**：47 项关键操作留痕，180 天保留。
- **规则**：menu=一级菜单；操作内容按模板拼装；VIN 脱敏。

## 5.4 工具对象（脱敏/检索/时区）

### `Masking`
- `maskVin(vin)` → 前 6 + `*******` + 后 4
- `maskPlate(plate)` → ≤4 位原样；≥5 位首 2 + `*`(中) + 尾 2
- `truncateAddress(addr)` → 仅保留街道/路口级，移除门牌号
- `matchMasked(plain, query)` → 明文精确 OR 脱敏可见字符模糊

### `TimeFormat`
- 全局 `America/Santiago`；`formatTime(ts)` → `YYYY-MM-DD HH:mm:ss`
- `formatDuration(min)` → `HH:mm`；行程详情 `HH:mm:ss`

### `TrajectoryRetention`
- 保留 **30 天**，超出隐藏地图显示占位符"行驶轨迹已过期"

---

# 第六部分 · 附录

## 6.1 信号枚举清单（车辆数据动态列）

| 信号组 | 信号 | 信号值来源 |
|--------|------|-----------|
| 电池信号 | SOC / 电池健康度 / 电池温度（**整车平均温度 = (包1平均+包2平均+包3平均+包4平均+包5平均+包6平均) ÷ 6**，R3-L18）/ 续航里程 / 充电状态 | 读信号值 |
| 充电信号 | 充电状态 / 充电电压 / 充电电流 / 充电功率 / 充电前电量 / 充电后电量 | 读信号值 |
| 风控预警 | 故障 9 种（存储码见 §0.1.1：VDC/CDCU/BDCU/ADAS/DC_DC_TEMP/DC_DC_STATUS/MOTOR_CTRL_TEMP/MOTOR_TEMP/HV_INTERLOCK）；电池 14 种（存储码见 §0.1.2：TEMP_DIFF/HIGH_TEMP/STORAGE_OVERVOLTAGE/STORAGE_UNDERVOLTAGE/SOC_LOW/CELL_OVERVOLTAGE/CELL_UNDERVOLTAGE/SOC_HIGH/SOC_JUMP/STORAGE_MISMATCH/CELL_CONSISTENCY/STORAGE_TYPE_OVERCHARGE/INSULATION/CHARGE_FAULT）。**展示文案一律用 PRD 原文，严禁缩写**（如 SOC_LOW→"SOC低报警"，STORAGE_TYPE_OVERCHARGE→"车载储能装置类型过充"） | 读信号值 |
| 驾驶预警 | 6 种 ADAS（存储码见 §0.1.3：CAR_L1/CAR_L2/CAR_AEB/PERSON_L1/PERSON_L2/PERSON_AEB） | 读信号值 |

## 6.2 全局约束清单（实现 checklist）

- [x] 时区统一智利，夏/冬令时自动切换
- [x] VIN/车牌后端明文、前端脱敏、导出明文
- [x] 位置默认收起，街道级精度
- [x] 13 一级菜单 + 数据范围矩阵
- [x] 业务管理/实时监控 跨租户，其余仅当前租户
- [x] 维修无编辑，删除回退预警状态（**仅 `source_alert_id` 非空的一键报修单回退**，手动创建不回退，见 §1.9.1/§3.1）
- [x] 故障/电池仅"未处理"显示一键报修
- [x] 围栏未生效才可编辑/删除
- [x] 资产有设备不可删
- [x] 管理员角色/账号受保护（UI 层管理员角色行不渲染编辑/删除图标，见 §4.4）
- [x] 角色名同租户唯一（≤10，按 Unicode 码点计），角色列表正序
- [x] 导出 >20 万拦截（先 estimate 后 create 两步，见 §2.13/§3.5），文件 7 天过期
- [x] 轨迹保留 30 天
- [x] 审计 47 项，保留 ≥180 天，无"编辑维修"；**权限拒绝/参数校验失败不记审计，仅业务执行失败记**（L8）
- [x] 充电/放电判定按信号状态+电流+车速+持续 1min
- [x] 复制到剪贴板为纯前端 `navigator.clipboard`，后端无需实现（L2）
- [x] 枚举展示文案一律用 PRD 原文，存储码↔文案↔i18n key 对照见 §0.1（N-H1/N-H2）

## 6.3 字段约束（搜索筛选项汇总）

| 页面 | 字段 | 输入限制 | 匹配 |
|------|------|---------|------|
| 车辆列表 | VIN/设备ID/电池版本 | 17/20/20 字符 | 模糊 |
| | 车牌 | 8 字符 | 模糊 |
| | 车龄 | 0~100，1 位小数 | 范围 |
| 围栏 | 名称 | 不限 | 模糊 |
| | 类型/状态 | 枚举 | 精确单选 |
| | 操作时间 | 最长 1 年 | 区间 |
| 驾驶预警/电池/充放电/行程/维修 | 车牌 | 8 字符 | 模糊 |
| 各流水页 | 时间 | YYYY-MM-DD | 区间 |
| 实时监控 | 企业名/VIN | 20 字符 | 模糊 |
| 轨迹回放 | 时间 | ≤30 天 | 区间 |
| 车辆信号 | 车辆 | ≤10 辆，不可企业全选 | — |
| | 信号 | 分类树多选，可全选组/全部 | — |
| | 时间 | ≤180 天，默认近 7 天 | 区间 |
| 审计 | 操作人/账号 | 50 字符 | 模糊 |
| | 租户 | 全部+枚举 | 精确单选 |
| | 菜单 | 全部+一级菜单 | 精确多选 |
| | 功能 | 按 menu 联动 | 精确多选 |
| | 时间 | ≤180 天，默认近 7 天 | 区间 |
| | 结果 | 全部/成功/失败 | 精确单选 |

---

> **版本说明**：本 Spec 与 `PROJECT_CONTEXT.md`、PRD V6 对齐。如遇 PRD 变更，优先更新 §3 状态机与 §5.2 审计映射两处（最易漂移）。
