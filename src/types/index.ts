export interface Vehicle {
  vin: string;
  plate: string;
  model: string;
  color: string;
  batteryVersion: string;
  device: string;
  deviceName?: string;
  deviceType?: string;
  deviceModel?: string;
  purchase: string;
  totalKm: number;
  status: 'online' | 'offline';
  lat: number;
  lng: number;
  soc: number;
  soh: number;
  temp: number;
  range: number;
  charging: '未充电' | '准备充电' | '充电中' | '对方放电' | '故障&异常';
  tenantId?: string;
  tenant?: string;
}

export interface AlertRecord {
  plate: string;
  vin: string;
  type: string;
  content: string;
  time: string;
  status?: string;
  location?: string;
  speed?: number;
}

export interface FenceInfo {
  name: string;
  type: 'Center' | 'Custom';
  vehicleCount: number;
  status: 'Active' | 'Inactive';
  address: string;
  time: string;
}

export interface TripRecord {
  plate: string;
  start: string;
  end: string;
  startLocation?: string;
  endLocation?: string;
  km: number;
  duration: string;
  avgSpeed: number;
  alerts: number;
  vin: string;
}

export interface VehicleDetailTab {
  key: string;
  label: string;
}

export interface FenceAlert {
  id: string;
  plate: string;
  vin: string;
  type: 'in' | 'out';
  fence_name: string;
  location: string;
  time: string;
  device?: string;
  speed?: number;
}

export interface FaultAlert {
  id: string;
  plate: string;
  vin?: string;
  device?: string;
  type: FaultType;
  content: string;
  time: string;
  status: 'Pending' | 'WorkOrder' | 'Fixed';
}

export type FaultType = 'VDC' | 'CDCU' | 'BDCU' | 'ADAS'
  | 'DC-DC温度' | 'DC-DC状态' | '驱动电机控制器温度' | '驱动电机温度' | '高压互锁状态';

export interface BatteryAlert {
  id: string;
  plate: string;
  vin?: string;
  device?: string;
  type: 'SOC过低' | '电池高温' | 'SOC跳变' | '充电故障' | '温差报警'
    | '储能过压' | '储能欠压' | '单体过压' | '单体欠压' | 'SOC过高'
    | '储能不匹配' | '单体一致性差' | '绝缘报警' | '储能过充';
  content: string;
  time: string;
  status: 'Pending' | 'WorkOrder' | 'Fixed';
}

export type DrivingAlertType = '对车一级预警' | '对车二级预警' | '对车AEB制动'
  | '对人一级预警' | '对人二级预警' | '对人AEB制动';

export interface DrivingAlert {
  id: string;
  plate: string;
  vin: string;
  type: DrivingAlertType;
  position: string;
  speed: number;
  time: string;
}

export interface DrivingReport {
  id: string;
  plate: string;
  vin: string;
  period: string;
  km: number;
  risks: number;
  level: '安全司机' | '低危司机' | '中危司机' | '高危司机';
  score: number;
  cumulativeHours?: number;
  avgSpeed?: number;
  suggestions?: string[];
  mileageTrend?: { date: string; km: number }[];
  regionDistribution?: { city: string; km: number }[];
}

export interface BatteryMonitorItem {
  id: string;
  plate: string;
  vin: string;
  soc: number;
  soh: number;
  temp: number;
  range: number;
  charges: number;
  status: 'charging' | 'idle' | 'preparing' | 'discharging' | 'fault';
  dailyConsumption?: number;
}

export interface ChargeRecord {
  id: string;
  plate: string;
  vin?: string;
  count?: number;
  voltage: number;
  current: number;
  power: number;
  before: number;
  after: number;
  duration: string;
  time: string;
}

export interface DischargeRecord {
  id: string;
  plate: string;
  vin?: string;
  count?: number;
  voltage: number;
  current: number;
  power: number;
  before: number;
  after: number;
  duration: string;
  time: string;
}

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  time: string;
}

export interface TripInfo {
  id: string;
  plate: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: number;
}

export type PageKey = 'dashboard' | 'vehicles' | 'monitor' | 'risk' | 'driving' | 'battery' | 'trips' | 'fence' | 'repair' | 'tenant' | 'biz' | 'sys';
export type Lang = 'zh' | 'en' | 'es';

// --- New types for Trips, Fence, Repair, Tenant, Biz, Sys pages ---

export interface TripAlertItem {
  id: string;
  type: string;
  time: string;
}

export interface TripDetail {
  id: string;
  vin: string;
  plate: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: string;
  avgSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  alerts: TripAlertItem[];
  alertCount: number;
}

export interface FenceItem {
  id: string;
  name: string;
  type: 'center' | 'custom';
  vehicles: string[];
  alertType: '出栏预警' | '入栏预警';
  status: 'active' | 'inactive';
  address: string;
  time: string;
  radius?: number;
}

export interface RepairItem {
  id: string;
  plate: string;
  vin: string;
  type: '故障类' | '电池类';
  description: string;
  startDate: string;
  endTime?: string;
  recorder?: string;
  status: 'repairing' | 'completed';
  sourceAlertId?: string;
  sourceAlertType?: 'fault' | 'battery';
}

export interface TenantItem {
  id: string;
  code: string;
  name: string;
  admin: string;
  contact: string;
  phone: string;
  createdDate: string;
  address?: string;
  adminAccount?: string;
  expireDate?: string;
  expired?: boolean;
}

export interface AssetItem {
  id: string;
  vin: string;
  tenant: string;
  syncedDate: string;
  deviceId?: string | null;
}

export interface BizUserItem {
  id: string;
  nickname: string;
  email: string;
  role: string;
  created: string;
}

export interface BizRoleItem {
  id: string;
  name: string;
  type: string;
  permissions: string[];
}

// V1.2 日志审计（修订版）
export interface AuditLog {
  id: string;
  time: string;           // YYYY-MM-DD HH:mm:ss (Santiago时区)
  nickname: string;       // 操作人
  account: string;        // 操作账号(邮箱)
  tenant: string;         // 所属租户
  menu: string;           // 操作菜单（一级菜单名称）
  function: string;       // 操作功能（具象操作名称）
  content: string;        // 操作内容（按模板拼装的可读描述）
  result: 'success' | 'fail';
  failReason?: string;    // 失败原因（失败时展示）
}

// 车辆详情-风控预警记录tab（23种预警）
export interface VehicleAlertRecord {
  plate: string;
  vin: string;
  alertName: string;
  alertContent: string;
  time: string;
}

// 车辆详情-驾驶预警记录tab（6种预警）
export interface VehicleDrivingRecord {
  plate: string;
  vin: string;
  alertName: string;
  alertContent: string;
  speed: number;
  time: string;
}

// 车辆详情-电池监控信息tab
export interface VehicleBatteryRecord {
  plate: string;
  vin: string;
  soc: number;
  soh: number;
  temp: number;
  range: number;
  time: string;
}

// 导出任务
export interface ExportTask {
  id: string;
  filename: string;
  filterSummary: string;
  totalCount: number | null;
  createdAt: string;
  status: 'processing' | 'completed' | 'failed' | 'expired';
  expiredAt?: string;
  fileUrl?: string;
}

// 资产划拨记录
export interface TransferRecord {
  vin: string;
  fromTenant: string;
  toTenant: string;
  operator: string;
  transferTime: string;
}
