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
  status: '在线' | '离线';
  lat: number;
  lng: number;
  soc: number;
  soh: number;
  temp: number;
  range: number;
  charging: '充电中' | '未充电' | '未知';
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
  type: FaultType4;
  content: string;
  time: string;
  status: 'Pending' | 'WorkOrder' | 'Fixed';
}

export type FaultType4 = 'VDC' | 'CDCU' | 'BDCU' | 'ADAS';

export interface BatteryAlert {
  id: string;
  plate: string;
  vin?: string;
  device?: string;
  type: 'SOC过低' | '电池高温' | 'SOC跳变' | '充电故障' | '温差报警';
  content: string;
  time: string;
  status: 'Pending' | 'WorkOrder' | 'Fixed';
}

export interface DrivingAlert {
  id: string;
  plate: string;
  vin: string;
  type: string;
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
  status: 'charging' | 'idle' | 'unknown';
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
  alertType: '出栏报警' | '入栏报警';
  status: '生效中' | '未生效';
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
  status: '维修中' | '维修完成';
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
  result: '成功' | '失败';
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

// 资产划拨记录
export interface TransferRecord {
  vin: string;
  fromTenant: string;
  toTenant: string;
  operator: string;
  transferTime: string;
}
