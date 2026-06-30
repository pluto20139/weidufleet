import type { Vehicle, FenceAlert, FaultAlert, FaultType, BatteryAlert, DrivingAlert, DrivingAlertType, DrivingReport, BatteryMonitorItem, ChargeRecord, DischargeRecord, TripInfo, FenceItem, RepairItem, TenantItem, AssetItem, BizUserItem, BizRoleItem, ExportTask, TransferRecord } from '@/types';
import { useAppStore } from '@/store';
import { tenantHierarchy, getFilteredVehicles } from './vehicles';

// Re-export from domain modules (backward compat)
export { getTripDetails, getTripDetailById } from './trips';
export { getAuditLogs } from './audit';
export { getFilteredVehicles, getVehicles, getVehicleByVin, getOnlineVehicles, getOfflineVehicles, getTrajectoryPoints } from './vehicles';


export function getDashboardStats() {
  const tenantVehicles = getFilteredVehicles(false);
  const total = tenantVehicles.length;
  const online = tenantVehicles.filter((v) => v.status === 'online').length;
  const todayAlerts = tenantVehicles.reduce((s, v) => s + (v.soc <= 20 ? 1 : 0) + 2 + Math.floor(Math.random() * 3), 0);
  const fenceAlerts = tenantVehicles.reduce((s, v) => s + Math.floor(Math.random() * 2), 0);
  // P1-6: Use SOC_LOW alert type count from battery alerts instead of soc<=20 vehicle count
  const batteryAlerts = ensureBatteryAlertData();
  const today = new Date().toISOString().slice(0, 10);
  const lowBatteryAlerts = batteryAlerts.filter(a => a.type === 'SOC过低').length;
  const avgSoc = total > 0 ? Math.floor(tenantVehicles.reduce((s, v) => s + v.soc, 0) / total) : 0;
  const avgTemp = total > 0 ? Math.floor(tenantVehicles.reduce((s, v) => s + v.temp, 0) / total) : 0;
  const avgRange = total > 0 ? Math.floor(tenantVehicles.reduce((s, v) => s + v.range, 0) / total) : 0;

  return {
    totalVehicles: total,
    online,
    offline: total - online,
    todayMileage: Math.floor(300 + Math.random() * 50) * total,
    totalMileage: tenantVehicles.reduce((s, v) => s + v.totalKm, 0),
    todayAlerts,
    fenceAlerts,
    lowBatteryAlerts,
    avgSoc,
    avgTemp,
    avgRange,
  };
}

export function getAlertRanking() {
  const tenantVehicles = getFilteredVehicles(false);
  const rows = tenantVehicles.slice(0, 8).map((v, i) => {
    const drive = (i * 7 + 3) % 12;
    const fence = (i * 5 + 1) % 6;
    const fault = (i * 3 + 2) % 4;
    const lowBat = v.soc <= 20 ? 1 : 0;
    return { plate: v.plate, drive, fence, fault, lowBat, total: drive + fence + fault + lowBat };
  });
  return rows
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({ rank: i + 1, ...r }));
}


export function getTrips(isCrossTenant: boolean = false): TripInfo[] {
  const tenantVehicles = getFilteredVehicles(isCrossTenant);
  const locations = [
    '智利圣地亚哥首都大区解放者大道1449号',
    '智利圣地亚哥拉斯孔德斯区商业大道3200号',
    '智利圣地亚哥普罗维登西亚区新普罗维登西亚街1050号',
    '智利圣地亚哥维塔库拉区阿波斯托尔圣地亚哥街2020号',
    '智利圣地亚哥马伊普区工业大道5500号',
    '智利圣地亚哥纽尼奥阿区伊拉拉苏尔大道3600号',
    '智利圣地亚哥拉佛罗里达区瓦兰多街1780号',
    '智利圣地亚哥圣米格尔区大阿韦尼达街890号',
  ];
  return tenantVehicles.slice(0, 8).map((v, i) => ({
    id: `trip-${i}`,
    plate: v.plate,
    startLocation: locations[i % locations.length]!,
    endLocation: locations[(i + 3) % locations.length]!,
    startTime: '2025-06-10T08:30:00',
    endTime: '2025-06-10T12:45:00',
    duration: '4h15min',
    distance: Math.floor(80 + (i * 47 + 23) % 200),
  }));
}

// --- Risk page mock data ---
export function getFenceAlerts(): FenceAlert[] {
  const tenantVehicles = getFilteredVehicles(false);
  const fenceNames = ['圣地亚哥中心仓库', '瓦尔帕莱索港区', '普罗维登西亚', '维塔库拉', '迈普'];
  return tenantVehicles.slice(0, 8).map((v, i) => ({
    id: `fa-${i}`,
    plate: v.plate,
    vin: v.vin,
    type: i % 2 === 0 ? 'in' as const : 'out' as const,
    fence_name: fenceNames[i % 5] as string,
    location: ['智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号', '智利瓦尔帕莱索大区瓦尔帕莱索港码头', '智利奥伊金斯将军大区兰卡瓜市解放者大道', '智利马乌莱大区塔尔卡市一号公路', '智利比奥比奥大区康塞普西翁市自由大道'][i % 5]!,
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
  }));
}

// Module-level mutable alert data for Repair revert linkage
let _faultAlertData: FaultAlert[] | null = null;
let _batteryAlertData: BatteryAlert[] | null = null;

function ensureFaultAlertData(): FaultAlert[] {
  if (!_faultAlertData) {
    _faultAlertData = generateFaultAlerts();
  }
  return _faultAlertData;
}

function ensureBatteryAlertData(): BatteryAlert[] {
  if (!_batteryAlertData) {
    _batteryAlertData = generateBatteryAlerts();
  }
  return _batteryAlertData;
}

function generateFaultAlerts(): FaultAlert[] {
  const tenantVehicles = getFilteredVehicles(false);
  const faultTypes: FaultType[] = [
    'VDC', 'CDCU', 'BDCU', 'ADAS',
    'DC-DC温度', 'DC-DC状态', '驱动电机控制器温度', '驱动电机温度', '高压互锁状态'
  ];
  const faultContents: Record<string, string> = {
    VDC: 'VDC电机控制器错误码0xE3',
    CDCU: 'CDCU数据链路错误',
    BDCU: 'BDCU继电器卡滞故障',
    ADAS: 'ADAS摄像头需要标定',
    'DC-DC温度': 'DC-DC变换器温度超过阈值',
    'DC-DC状态': 'DC-DC变换器工作状态异常',
    '驱动电机控制器温度': '驱动电机控制器温度超过阈值',
    '驱动电机温度': '驱动电机温度超过阈值',
    '高压互锁状态': '高压互锁回路状态异常',
  };
  return tenantVehicles.slice(0, 18).map((v, i) => ({
    id: `fu-${i}`,
    plate: v.plate,
    vin: v.vin,
    device: v.device,
    type: faultTypes[i % 9]!,
    content: faultContents[faultTypes[i % 9]!] || 'Unknown fault',
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'Fixed' as const : (i % 3 === 1 ? 'WorkOrder' as const : 'Pending' as const),
  }));
}

function generateBatteryAlerts(): BatteryAlert[] {
  const tenantVehicles = getFilteredVehicles(false);
  const batTypes: BatteryAlert['type'][] = [
    'SOC过低', '电池高温', 'SOC跳变', '充电故障', '温差报警',
    '储能过压', '储能欠压', '单体过压', '单体欠压', 'SOC过高',
    '储能不匹配', '单体一致性差', '绝缘报警', '储能过充'
  ];
  return tenantVehicles.slice(0, 20).map((v, i) => ({
    id: `ba-${i}`,
    plate: v.plate,
    vin: v.vin,
    device: v.device,
    type: batTypes[i % 14]!,
    content: ['电量低于20%', '电池温度过高', 'SOC突变', '充电异常中断', '电芯温差过大',
      '车载储能装置电压过高', '车载储能装置电压过低', '单体电池电压过高', '单体电池电压过低', 'SOC超过上限',
      '可充电储能系统不匹配', '电池单体一致性差', '绝缘电阻过低', '车载储能装置过充'
    ][i % 14] as string,
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'Fixed' as const : (i % 3 === 1 ? 'WorkOrder' as const : 'Pending' as const),
  }));
}

export function getFaultAlerts(): FaultAlert[] {
  return ensureFaultAlertData();
}

export function getBatteryAlerts(): BatteryAlert[] {
  return ensureBatteryAlertData();
}

export function revertFaultAlertStatus(alertId: string) {
  const data = ensureFaultAlertData();
  const alert = data.find(a => a.id === alertId);
  if (alert) alert.status = 'Pending';
}

export function revertBatteryAlertStatus(alertId: string) {
  const data = ensureBatteryAlertData();
  const alert = data.find(a => a.id === alertId);
  if (alert) alert.status = 'Pending';
}

// --- Driving page mock data ---
const alertTypes: readonly DrivingAlertType[] = [
  '对车一级预警', '对车二级预警', '对车AEB制动',
  '对人一级预警', '对人二级预警', '对人AEB制动'
];

export function getDrivingAlerts(): DrivingAlert[] {
  const tenantVehicles = getFilteredVehicles(false);
  return tenantVehicles.slice(0, 8).map((v, i) => ({
    id: `da-${i}`,
    plate: v.plate,
    vin: v.vin,
    type: alertTypes[i % 6]!,
    position: ['智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号', '智利瓦尔帕莱索大区瓦尔帕莱索港码头', '智利奥伊金斯将军大区兰卡瓜市解放者大道', '智利马乌莱大区塔尔卡市一号公路', '智利比奥比奥大区康塞普西翁市自由大道'][i % 5]!,
    speed: Math.floor(30 + Math.random() * 70),
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
  }));
}

const reportLevels: DrivingReport['level'][] = ['安全司机', '低危司机', '中危司机', '高危司机'];

export function getDrivingReports(): DrivingReport[] {
  const calcCountScore = (count: number) => {
    if (count === 0) return 100;
    if (count <= 2) return 90;
    if (count <= 4) return 80;
    if (count <= 6) return 70;
    if (count <= 10) return 60;
    return 50;
  };
  const calcFatigueScore = (hours: number) => {
    if (hours <= 0) return 100;
    if (hours <= 1) return 90;
    if (hours <= 2) return 80;
    if (hours <= 3) return 70;
    if (hours <= 4) return 60;
    return 50;
  };

  const tenantVehicles = getFilteredVehicles(false);
  return tenantVehicles.slice(0, 8).map((v, i) => {
    const acc = Math.floor(Math.random() * 8);
    const dec = Math.floor(Math.random() * 8);
    const turn = Math.floor(Math.random() * 6);
    const aeb = Math.floor(Math.random() * 3);
    const fatigueHours = Math.floor(Math.random() * 4);
    
    const score = Math.round(
      calcCountScore(acc) * 0.2 +
      calcCountScore(dec) * 0.2 +
      calcCountScore(turn) * 0.2 +
      calcCountScore(aeb) * 0.2 +
      calcFatigueScore(fatigueHours) * 0.2
    );

    const risks = acc + dec + turn + aeb;
    let level: DrivingReport['level'] = '安全司机';
    if (risks > 6) level = '高危司机';
    else if (risks > 3) level = '中危司机';
    else if (risks > 1) level = '低危司机';

    return {
      id: `dr-${i}`,
      plate: v.plate,
      vin: v.vin,
      period: i < 4 ? '2026-W24' : '2026-05',
      km: Math.floor(500 + Math.random() * 3000),
      risks,
      level,
      score,
      cumulativeHours: +(Math.floor(500 + Math.random() * 3000) / 65).toFixed(1),
      avgSpeed: +((Math.floor(500 + Math.random() * 3000) / 7 * 0.65)).toFixed(1),
      suggestions: risks > 6
        ? ['需要改善驾驶行为，频繁的急加速/急减速影响安全', '建议立即参加驾驶培训', '建议每日查看报告']
        : risks > 3
        ? ['注意控制车速，减少急加速/急减速', '建议每周查看一次报告']
        : ['继续保持良好驾驶习惯', '建议每两周查看一次报告'],
      mileageTrend: Array.from({ length: 7 }, (_, d) => ({
        date: `2026-06-${String(10 + d).padStart(2, '0')}`,
        km: Math.floor(60 + Math.random() * 80 + risks * 5),
      })),
      regionDistribution: [
        { city: '圣地亚哥 (Santiago)', km: Math.floor(200 + Math.random() * 100) },
        { city: '瓦尔帕莱索 (Valparaíso)', km: Math.floor(80 + Math.random() * 60) },
        { city: '康塞普西翁 (Concepción)', km: Math.floor(50 + Math.random() * 50) },
        { city: '兰卡瓜 (Rancagua)', km: Math.floor(30 + Math.random() * 40) },
        { city: '基略塔 (Quillota)', km: Math.floor(20 + Math.random() * 30) },
      ],
    };
  });
}

// --- Battery page mock data ---
export function getBatteryMonitorItems(): BatteryMonitorItem[] {
  const tenantVehicles = getFilteredVehicles(false);
  return tenantVehicles.slice(0, 10).map((v, i) => ({
    id: `bm-${i}`,
    plate: v.plate,
    vin: v.vin,
    soc: v.soc,
    soh: v.soh,
    temp: v.temp,
    range: v.range,
    charges: Math.floor(10 + Math.random() * 90),
    status: (['charging', 'idle', 'preparing', 'discharging', 'fault'] as const)[i % 5]!,
    dailyConsumption: Math.floor(15 + (i * 3 + 7) % 25),
  }));
}

export function getChargeRecords(): ChargeRecord[] {
  const tenantVehicles = getFilteredVehicles(false);
  return tenantVehicles.slice(0, 8).map((v, i) => ({
    id: `cr-${i}`,
    plate: v.plate,
    vin: v.vin,
    count: Math.floor(10 + Math.random() * 50),
    voltage: Math.floor(300 + Math.random() * 100),
    current: Math.floor(50 + Math.random() * 100),
    power: Math.floor(30 + Math.random() * 50),
    before: Math.floor(10 + Math.random() * 30),
    after: Math.floor(70 + Math.random() * 30),
    duration: `${Math.floor(1 + Math.random() * 4)}h${Math.floor(Math.random() * 60)}m`,
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
  }));
}

export function getDischargeRecords(): DischargeRecord[] {
  const tenantVehicles = getFilteredVehicles(false);
  return tenantVehicles.slice(0, 8).map((v, i) => ({
    id: `ddr-${i}`,
    plate: v.plate,
    vin: v.vin,
    count: Math.floor(10 + Math.random() * 50),
    voltage: Math.floor(280 + Math.random() * 80),
    current: Math.floor(30 + Math.random() * 80),
    power: Math.floor(20 + Math.random() * 40),
    before: Math.floor(60 + Math.random() * 40),
    after: Math.floor(5 + Math.random() * 20),
    duration: `${Math.floor(1 + Math.random() * 3)}h${Math.floor(Math.random() * 60)}m`,
    energyConsumed: Math.floor(30 + Math.random() * 60),
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
  }));
}

export function getDrivingTimeDistribution(): { period: string; hours: number }[] {
  return [
    { period: 'morning', hours: 4.5 },
    { period: 'afternoon', hours: 5.2 },
    { period: 'evening', hours: 2.1 },
    { period: 'night', hours: 0.8 },
  ];
}

export function getDrivingAreaDistribution(): { area: string; km: number }[] {
  return [
    { area: '圣地亚哥 (Santiago)', km: 285 },
    { area: '瓦尔帕莱索 (Valparaíso)', km: 120 },
    { area: '康塞普西翁 (Concepción)', km: 95 },
    { area: '兰卡瓜 (Rancagua)', km: 60 },
    { area: '基略塔 (Quillota)', km: 40 },
  ];
}

export function getDailyConsumption(days: number = 30): number[] {
  return Array.from({ length: days }, () => Math.floor(5 + Math.random() * 20));
}

// ====== New mock data for Trips, Fence, Repair, Tenant, Biz, Sys pages ======


// --- Fence mock data ---
let fenceData: FenceItem[] = [
  { id: 'f1', name: 'Santiago Centro Warehouse', type: 'center', vehicles: ['KLTX51', 'KLTX52', 'KLTX55'], alertType: '出栏预警', status: 'active', address: 'Av. Libertador Bernardo O\'Higgins 1500, Santiago', time: '2026-01-15 10:00' },
  { id: 'f2', name: 'Valparaiso Port Area', type: 'custom', vehicles: ['KLTX53', 'KLTX56'], alertType: '入栏预警', status: 'active', address: 'Puerto Valparaiso, Valparaiso', time: '2026-02-20 14:30' },
  { id: 'f3', name: 'Maipu Logistics Park', type: 'custom', vehicles: ['KLTX54', 'KLTX57', 'KLTX58'], alertType: '出栏预警', status: 'inactive', address: 'Camino a Melipilla 5000, Maipu', time: '2026-03-10 09:00' },
  { id: 'f4', name: 'Las Condes Depot', type: 'center', vehicles: ['KLTX59'], alertType: '入栏预警', status: 'active', address: 'Av. Apoquindo 4000, Las Condes', time: '2026-03-22 16:45' },
  { id: 'f5', name: 'Quillota Distribution Center', type: 'custom', vehicles: ['KLTX60', 'KLTX61'], alertType: '出栏预警', status: 'active', address: 'Ruta 5 Norte Km 120, Quillota', time: '2026-04-01 11:20' },
  { id: 'f6', name: 'Rancagua Service Point', type: 'center', vehicles: ['KLTX62'], alertType: '入栏预警', status: 'inactive', address: 'Av. Libertador 800, Rancagua', time: '2026-04-10 08:30' },
];

export function getFenceItems(): FenceItem[] {
  const plates = new Set(getFilteredVehicles(false).map((v) => v.plate));
  return fenceData.filter((f) => f.vehicles.some((p) => plates.has(p)));
}

// --- Repair mock data ---
let repairData: RepairItem[] = [
  { id: 'r1', plate: 'KLTX51', vin: 'LJ8T7AD0000100000', type: '故障类', description: '电机控制器通信故障，错误码0xE3', startDate: '2026-05-20', endTime: '2026-05-21', recorder: 'Admin', status: 'repairing' },
  { id: 'r2', plate: 'KLTX53', vin: 'LJ8T7AD0000100002', type: '电池类', description: '电池热管理系统故障，第7电芯温度异常', startDate: '2026-05-18', endTime: '2026-05-19', recorder: 'Admin', status: 'completed' },
  { id: 'r3', plate: 'KLTX55', vin: 'LJ8T7AD0000100004', type: '故障类', description: '右前轮速传感器信号丢失', startDate: '2026-05-22', endTime: '2026-05-23', recorder: 'Admin', status: 'repairing' },
  { id: 'r4', plate: 'KLTX57', vin: 'LJ8T7AD0000100006', type: '电池类', description: 'SOC校准漂移，更换BMS模块', startDate: '2026-05-15', endTime: '2026-05-16', recorder: 'Admin', status: 'completed' },
  { id: 'r5', plate: 'KLTX59', vin: 'LJ8T7AD0000100008', type: '故障类', description: '高压接触器卡滞断开，逆变器故障', startDate: '2026-05-25', endTime: '2026-05-26', recorder: 'Admin', status: 'repairing' },
  { id: 'r6', plate: 'KLTX52', vin: 'LJ8T7AD0000100001', type: '电池类', description: '绝缘电阻偏低，电池包疑似进水', startDate: '2026-05-28', endTime: '2026-05-29', recorder: 'Admin', status: 'repairing' },
  { id: 'r7', plate: 'KLTX60', vin: 'LJ8T7AD0000100009', type: '故障类', description: 'DC-DC转换器输出电压超出范围', startDate: '2026-05-10', endTime: '2026-05-11', recorder: 'Admin', status: 'completed' },
  { id: 'r8', plate: 'KLTX62', vin: 'LJ8T7AD0000100011', type: '电池类', description: '更换电池模组及固件升级', startDate: '2026-05-30', endTime: '2026-05-31', recorder: 'Admin', status: 'repairing' },
  { id: 'r9', plate: 'KLTX56', vin: 'LJ8T7AD0000100005', type: '故障类', description: '制动助力真空泵故障', startDate: '2026-06-01', endTime: '2026-06-02', recorder: 'Admin', status: 'repairing' },
  { id: 'r10', plate: 'KLTX58', vin: 'LJ8T7AD0000100007', type: '故障类', description: '冷却液泵停转，电机温度过高', startDate: '2026-05-12', endTime: '2026-05-13', recorder: 'Admin', status: 'completed' },
];

export function getRepairItems(): RepairItem[] {
  const vins = new Set(getFilteredVehicles(false).map((v) => v.vin));
  return repairData.filter((r) => vins.has(r.vin));
}

// --- Tenant mock data ---
let tenantData: TenantItem[] = [
  { id: 'ten1', code: 'WD-CL-001', name: '智利物流集团', admin: 'Carlos Gomez', contact: 'carlos.gomez@wd-logistics.cl', phone: '+56 9 1234 5678', createdDate: '2025-06-01', address: 'Av. Costanera Sur 2730, Santiago', adminAccount: 'carlos_admin', expireDate: '2027-06-01', expired: false },
  { id: 'ten2', code: 'WD-CL-002', name: 'Santiago Transport', admin: 'Maria Gonzalez', contact: 'maria.g@stgo-transport.cl', phone: '+56 9 2345 6789', createdDate: '2025-07-15', address: 'Las Condes 100, Santiago', adminAccount: 'maria_admin', expireDate: '2027-07-15', expired: false },
  { id: 'ten3', code: 'WD-CL-003', name: 'Valparaiso Logistics', admin: 'Juan Perez', contact: 'juan.perez@vap-log.cl', phone: '+56 9 3456 7890', createdDate: '2025-08-20', address: 'Puerto Valparaiso, Valparaiso', adminAccount: 'juan_admin', expireDate: '2027-08-20', expired: false },
  { id: 'ten4', code: 'WD-CL-004', name: 'Rancagua Fleet Services', admin: 'Ana Martinez', contact: 'ana.m@rf-svc.cl', phone: '+56 9 4567 8901', createdDate: '2025-09-10', address: 'O\'Higgins 800, Rancagua', adminAccount: 'ana_admin', expireDate: '2025-01-01', expired: true },
  { id: 'ten5', code: 'WD-CL-005', name: 'Quillota Transporte', admin: 'Pedro Silva', contact: 'pedro.s@qt.cl', phone: '+56 9 5678 9012', createdDate: '2025-10-05', address: 'Ruta 5 Km 120, Quillota', adminAccount: 'pedro_admin', expireDate: '2027-10-05', expired: false },
];

export function getTenantItems(): TenantItem[] {
  const now = new Date();
  return tenantData.map(t => ({
    ...t,
    expired: t.expireDate ? new Date(t.expireDate) < now : false,
  }));
}

// --- Assets mock data ---
const assetData: AssetItem[] = [
  { id: 'a1', vin: 'LJ8T7AD0000100000', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00', deviceId: 'OBD-8000' },
  { id: 'a2', vin: 'LJ8T7AD0000100001', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00', deviceId: 'OBD-8001' },
  { id: 'a3', vin: 'LJ8T7AD0000100002', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30', deviceId: 'OBD-8002' },
  { id: 'a4', vin: 'LJ8T7AD0000100003', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30', deviceId: 'OBD-8003' },
  { id: 'a5', vin: 'LJ8T7AD0000100004', tenant: 'Valparaiso Logistics', syncedDate: '2026-05-20 09:15', deviceId: 'OBD-8004' },
  { id: 'a6', vin: 'LJ8T7AD0000100005', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00', deviceId: null },
  { id: 'a7', vin: 'LJ8T7AD0000100006', tenant: 'Rancagua Fleet Services', syncedDate: '2026-05-25 11:00', deviceId: null },
  { id: 'a8', vin: 'LJ8T7AD0000100007', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30', deviceId: null },
  { id: 'a9', vin: 'LJ8T7AD0000100008', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00', deviceId: null },
  { id: 'a10', vin: 'LJ8T7AD0000100009', tenant: 'Quillota Transporte', syncedDate: '2026-05-30 08:00', deviceId: null },
];

export function getAssetItems(): AssetItem[] {
  const currentTenantId = useAppStore.getState().tenant || 'ten1';
  if (currentTenantId === 'root') {
    return assetData;
  }
  const subTenantIds = tenantHierarchy[currentTenantId] || [currentTenantId];
  const subTenantNames = subTenantIds.map(id => tenantData.find(t => t.id === id)?.name).filter(Boolean) as string[];
  return assetData.filter((a) => subTenantNames.includes(a.tenant));
}

// --- Biz Users mock data ---
const bizUserData: BizUserItem[] = [
  { id: 'bu1', nickname: 'carlos_admin', email: 'carlos.gomez@wd-logistics.cl', role: 'Admin', created: '2025-06-01' },
  { id: 'bu2', nickname: 'maria_op', email: 'maria.g@stgo-transport.cl', role: 'Operator', created: '2025-07-15' },
  { id: 'bu3', nickname: 'juan_mon', email: 'juan.perez@vap-log.cl', role: 'Monitor', created: '2025-08-20' },
  { id: 'bu4', nickname: 'ana_disp', email: 'ana.m@rf-svc.cl', role: 'Dispatcher', created: '2025-09-10' },
  { id: 'bu5', nickname: 'pedro_op', email: 'pedro.s@qt.cl', role: 'Operator', created: '2025-10-05' },
  { id: 'bu6', nickname: 'luis_admin', email: 'luis.fernandez@wd-logistics.cl', role: 'Admin', created: '2025-11-01' },
];

export function getBizUserItems(): BizUserItem[] {
  return bizUserData;
}

// --- Biz Roles mock data ---
const bizRoleData: BizRoleItem[] = [
  {
    id: 'br1', name: 'Admin', type: 'admin', permissions: [
      'Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance', 'Monitor',
      'Tenant Config', 'User Management', 'Role Management', 'Asset Allocation',
    ],
  },
  {
    id: 'br2', name: 'Operator', type: 'operator', permissions: [
      'Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance',
    ],
  },
  {
    id: 'br3', name: 'Monitor', type: 'monitor', permissions: [
      'Monitor', 'Vehicles (Read)', 'Trips (Read)', 'Risk (Read)',
    ],
  },
  {
    id: 'br4', name: 'Dispatcher', type: 'dispatcher', permissions: [
      'Vehicles', 'Trips', 'Monitor', 'Fence', 'Driving',
    ],
  },
];

export function getBizRoleItems(): BizRoleItem[] {
  return bizRoleData;
}

// --- Sys Users mock data ---
const sysUserData: BizUserItem[] = [
  { id: 'su1', nickname: 'root_admin', email: 'root@weidu.cl', role: 'Admin', created: '2025-01-01' },
  { id: 'su2', nickname: 'sys_op1', email: 'sysop1@weidu.cl', role: 'Operator', created: '2025-01-15' },
  { id: 'su3', nickname: 'auditor', email: 'auditor@weidu.cl', role: 'Monitor', created: '2025-03-01' },
  { id: 'su4', nickname: 'dispatch_lead', email: 'dispatch@weidu.cl', role: 'Dispatcher', created: '2025-04-10' },
];

export function getSysUserItems(): BizUserItem[] {
  return sysUserData;
}

// --- Sys Roles mock data ---
const sysRoleData: BizRoleItem[] = [
  {
    id: 'sr1', name: 'System Admin', type: 'admin', permissions: [
      'Full System Access', 'User Management', 'Role Management', 'System Config', 'Audit Logs',
    ],
  },
  {
    id: 'sr2', name: 'System Operator', type: 'operator', permissions: [
      'Vehicle Management', 'Trip Management', 'Report Generation', 'Alert Management',
    ],
  },
  {
    id: 'sr3', name: 'System Monitor', type: 'monitor', permissions: [
      'Dashboard View', 'Report View', 'Alert View',
    ],
  },
  {
    id: 'sr4', name: 'System Dispatcher', type: 'dispatcher', permissions: [
      'Trip Dispatch', 'Vehicle Assignment', 'Route Planning',
    ],
  },
];

export function getSysRoleItems(): BizRoleItem[] {
  return sysRoleData;
}

// --- Vehicle Detail Mock Data ---
const vehicleAlertsData = [
  { alert: 'VDC Fault', content: 'CAN: VDC Fault', time: '2026-05-10 08:30:00' },
  { alert: 'CDCU Fault', content: 'CAN: CDCU Fault', time: '2026-05-11 08:30:00' },
  { alert: 'BDCU Fault', content: 'CAN: BDCU Fault', time: '2026-05-12 08:30:00' },
  { alert: 'ADAS Fault', content: 'CAN: ADAS Fault', time: '2026-05-13 08:30:00' },
  { alert: 'Temp Diff', content: 'CAN: Temp Diff', time: '2026-05-14 08:30:00' },
  { alert: 'High Temp', content: 'CAN: High Temp', time: '2026-05-15 08:30:00' },
];
const drivingEventsData = [
  { alert: 'L1 Vehicle', content: 'Collision risk', time: '2026-05-12 09:15:00' },
  { alert: 'AEB Brake', content: 'Collision risk', time: '2026-05-13 09:20:00' },
  { alert: 'L1 Pedestrian', content: 'Collision risk', time: '2026-05-14 09:25:00' },
  { alert: 'L2 Urgent', content: 'Collision risk', time: '2026-05-15 09:30:00' },
];

export function getVehicleAlerts() { return vehicleAlertsData; }
export function getVehicleDrivingEvents() { return drivingEventsData; }
export function getVehicleBatteryRecords(v: Vehicle) {
  return Array.from({ length: 50 }, (_, i) => ({
    soc: Math.min(v.soc + (i % 5) * 2, 100),
    soh: Math.max(v.soh - (i % 3), 60),
    temp: v.temp + (i % 8) - 3,
    range: Math.max(v.range - (i % 5) * 8, 50),
    status: (['charging', 'idle', 'preparing', 'discharging', 'fault'] as const)[i % 5]!,
    dailyConsumption: Math.floor(15 + (i * 3 + 7) % 25),
    time: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 14)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`,
  }));
}
export function getVehicleChargeRecords() {
  return Array.from({ length: 50 }, (_, i) => ({
    count: Math.floor(50 + i * 2.5),
    v: 370 + (i % 12) * 5,
    a: 40 + (i % 8) * 3,
    kw: (15 + (i % 6) * 0.5).toFixed(1),
    before: 10 + (i % 5) * 10,
    after: 75 + (i % 4) * 5,
    duration: `${1 + (i % 4)}h${String((i * 7) % 60).padStart(2, '0')}m`,
    time: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 14)).padStart(2, '0')}:${String((i * 3) % 60).padStart(2, '0')}:00`,
  }));
}
export function getVehicleTrips() {
  const locs = [
    '智利圣地亚哥解放者大道1449号', '智利圣地亚哥拉斯孔德斯商业大道3200号',
    '智利圣地亚哥普罗维登西亚新街1050号', '智利瓦尔帕莱索港码头大道150号',
    '智利圣地亚哥马伊普工业大道5500号', '智利圣地亚哥纽尼奥阿伊拉拉苏尔大道3600号',
  ];
  return Array.from({ length: 50 }, (_, i) => ({
    start: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 08:${String((i * 2) % 60).padStart(2, '0')}:00`,
    end: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(9 + Math.floor(i / 5) % 8).padStart(2, '0')}:${String((i * 3) % 60).padStart(2, '0')}:00`,
    km: (12 + i * 3.5).toFixed(1),
    duration: `${String(1 + Math.floor(i / 10)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
    avgSpeed: 40 + (i * 3) % 50,
    alerts: (i % 3) + (i % 2) + ((i + 1) % 3) + ((i + 2) % 4),
  }));
}
export function getVehicleRepairs() {
  const types = ['故障类', '电池类'];
  const descs = ['VDC故障', 'CDCU故障', 'BDCU故障', 'ADAS故障', 'DC-DC温度', 'DC-DC状态',
    '驱动电机控制器温度', '驱动电机温度', '高压互锁状态',
    'SOC过低', '电池高温', 'SOC跳变', '充电故障', '温差报警'];
  const statuses = ['repairing', 'completed'];
  return Array.from({ length: 50 }, (_, i) => ({
    type: types[i % 2],
    desc: descs[i % descs.length],
    start: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
    status: statuses[i % 2 === 0 ? 0 : 1],
  }));
}
export function getVehicleMileage() {
  return { labels: ['1月','2月','3月','4月','5月','6月'], data: [1200,1500,1100,1800,1600,900] };
}

// --- Mutable CRUD operations for demo linkage ---
let _nextRepairId = 11;
export function addRepairItem(plate: string, vin: string, type: '故障类' | '电池类', description: string, sourceAlertId?: string, sourceAlertType?: 'fault' | 'battery') {
  const newItem: RepairItem = {
    id: `r${_nextRepairId++}`,
    plate,
    vin,
    type,
    description,
    startDate: new Date().toISOString().slice(0, 10),
    status: 'repairing',
    sourceAlertId,
    sourceAlertType,
  };
  repairData.unshift(newItem);
  return newItem;
}

export function completeRepairItem(id: string) {
  const item = repairData.find((r) => r.id === id);
  if (item) {
    if (item.status !== 'repairing') {
      throw new Error('只能完成「维修中」状态的记录');
    }
    item.status = 'completed';
    item.endTime = new Date().toISOString().slice(0, 10);
  }
}

export function deleteRepairItem(id: string) {
  repairData = repairData.filter((r) => r.id !== id);
}

let _nextFenceId = 7;
export function addFenceItem(fence: Omit<FenceItem, 'id'>) {
  const newItem: FenceItem = { id: `f${_nextFenceId++}`, ...fence };
  fenceData.unshift(newItem);
  return newItem;
}

export function deleteFenceItem(id: string) {
  fenceData = fenceData.filter((f) => f.id !== id);
}

let _nextTenantId = 6;
export function addTenantItem(tenant: Omit<TenantItem, 'id'>) {
  const newItem: TenantItem = { id: `ten${_nextTenantId++}`, ...tenant };
  tenantData.unshift(newItem);
  return newItem;
}


const getPastDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const getCompactDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

// --- Export Task mock data ---
let _exportTasks: ExportTask[] = [
  {
    id: 'exp1',
    filename: `车辆信号数据_V001_${getCompactDate(1)}.csv`,
    filterSummary: '多车(2辆) | 1小时 | 8个信号',
    totalCount: null,
    createdAt: getPastDate(1),
    status: 'processing',
  },
  {
    id: 'exp2',
    filename: `车辆信号数据_V005_${getCompactDate(3)}.csv`,
    filterSummary: 'VIN: LFWDAU1... | 24小时 | 3个信号',
    totalCount: 27567,
    createdAt: getPastDate(3),
    status: 'completed',
    expiredAt: getPastDate(-4), // 7 days after creation (created 3 days ago, expires in 4 days)
    fileUrl: '/mock/exports/exp2.csv',
  },
  {
    id: 'exp3',
    filename: `车辆信号数据_V003_${getCompactDate(10)}.csv`,
    filterSummary: 'VIN: LFWDAU3... | 12小时 | 5个信号',
    totalCount: 15230,
    createdAt: getPastDate(10),
    status: 'completed',
    expiredAt: getPastDate(9), // already expired (past date)
    fileUrl: '/mock/exports/exp3.csv',
  },
  {
    id: 'exp4',
    filename: `车辆信号数据_V007_${getCompactDate(12)}.csv`,
    filterSummary: 'VIN: LFWDAU7... | 6小时 | 4个信号',
    totalCount: 0,
    createdAt: getPastDate(12),
    status: 'failed',
  },
];

export function getExportTasks(): ExportTask[] {
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return _exportTasks.map(t => {
    if (t.status === 'completed' && t.expiredAt && nowStr > t.expiredAt) {
      return { ...t, status: 'expired' as const };
    }
    return t;
  });
}

export function estimateExportRows(filters: { vehicles: number; hours: number; signals: number }): { estimatedRows: number; allowed: boolean } {
  const estimatedRows = filters.vehicles * filters.hours * filters.signals * 60;
  return { estimatedRows, allowed: estimatedRows <= 200000 };
}

let _nextExportId = 5;
export function createExportTask(filename: string, filterSummary: string, estimatedRows: number): ExportTask {
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const task: ExportTask = {
    id: `exp${_nextExportId++}`,
    filename,
    filterSummary,
    totalCount: estimatedRows,
    createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
    status: 'processing',
    expiredAt: expiredAt.toISOString().replace('T', ' ').slice(0, 19),
  };
  _exportTasks.unshift(task);
  // Simulate completion after 2s
  setTimeout(() => {
    const t = _exportTasks.find(e => e.id === task.id);
    if (t) {
      t.status = 'completed';
      t.fileUrl = `/mock/exports/${task.id}.csv`;
    }
  }, 2000);
  return task;
}

// --- Transfer Asset mock ---
let _transferRecords: TransferRecord[] = [
  { vin: 'LJ8T7AD0000100001', fromTenant: '苇渡根租户', toTenant: 'Santiago Transport', operator: 'Admin', transferTime: '2026-05-01 10:00' },
  { vin: 'LJ8T7AD0000100002', fromTenant: 'Santiago Transport', toTenant: 'Valparaiso Logistics', operator: 'Carlos', transferTime: '2026-04-15 14:30' },
];

export function getTransferRecords(): TransferRecord[] {
  return _transferRecords;
}

export function transferAsset(vin: string, toTenantId: string): TransferRecord {
  const asset = assetData.find(a => a.vin === vin);
  const fromTenant = asset?.tenant || '未知';
  const toTenant = tenantData.find(t => t.id === toTenantId)?.name || toTenantId;
  if (asset) {
    asset.tenant = toTenant;
  }
  const record: TransferRecord = {
    vin,
    fromTenant,
    toTenant,
    operator: useAppStore.getState().user?.name || 'Admin',
    transferTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  _transferRecords.unshift(record);
  return record;
}

export function batchTransferAssets(vins: string[], toTenantId: string): TransferRecord[] {
  return vins.map(vin => transferAsset(vin, toTenantId));
}
