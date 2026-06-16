import type { Vehicle, FenceAlert, FaultAlert, FaultType4, BatteryAlert, DrivingAlert, DrivingReport, BatteryMonitorItem, ChargeRecord, DischargeRecord, TripInfo, TrajectoryPoint, TripDetail, TripAlertItem, FenceItem, RepairItem, TenantItem, AssetItem, BizUserItem, BizRoleItem, AuditLog } from '@/types';
import { maskVin } from '@/utils/masking';

const plates = ['KLTX56', 'BDFG78', 'PRHM23', 'SNWK91', 'LMCX44', 'VTRJ67', 'HZPY12', 'QBNF85', 'DRLG33', 'TWKC79'];
const models = ['苇渡E700'];
const colors = ['白色', '银色', '蓝色'];

const vehicles: Vehicle[] = Array.from({ length: 24 }, (_, i) => ({
  vin: 'LJ8T7AD' + String(100000 + i).padStart(10, '0'),
  plate: plates[i % 10] as string,
  model: models[0] as string,
  color: colors[i % 3] as string,
  batteryVersion: i % 2 === 0 ? '720km' : '1000km',
  device: 'OBD-' + String(8000 + i),
  deviceName: 'OBD-8000 网关',
  deviceType: 'OBD-II',
  deviceModel: 'WD-T100',
  purchase: '2025-' + String(Math.floor(i / 2) + 1).padStart(2, '0') + '-15',
  totalKm: Math.floor(8000 + Math.random() * 50000),
  status: i < 3 ? '离线' as const : '在线' as const,
  lat: -33.45 + Math.random() * 0.1,
  lng: -70.65 + Math.random() * 0.08,
  soc: Math.floor(Math.random() * 80 + 20),
  soh: Math.floor(Math.random() * 20 + 80),
  temp: Math.floor(Math.random() * 20 + 20),
  range: Math.floor(Math.random() * 150 + 100),
  charging: (['充电中', '未充电', '未知'] as const)[Math.floor(Math.random() * 3)]!,
}));

export function getVehicles(): Vehicle[] {
  return vehicles;
}

export function getVehicleByVin(vin: string): Vehicle | undefined {
  return vehicles.find((v) => v.vin === vin);
}

export function getDashboardStats() {
  const total = vehicles.length;
  const online = vehicles.filter((v) => v.status === '在线').length;
  return {
    totalVehicles: total,
    online,
    offline: total - online,
    todayMileage: Math.floor(3000 + Math.random() * 500),
    totalMileage: vehicles.reduce((s, v) => s + v.totalKm, 0),
    todayAlerts: Math.floor(30 + Math.random() * 40),
    fenceAlerts: Math.floor(10 + Math.random() * 20),
    lowBatteryAlerts: vehicles.filter((v) => v.soc <= 20).length,
    avgSoc: Math.floor(vehicles.reduce((s, v) => s + v.soc, 0) / vehicles.length),
    avgTemp: Math.floor(vehicles.reduce((s, v) => s + v.temp, 0) / vehicles.length),
    avgRange: Math.floor(vehicles.reduce((s, v) => s + v.range, 0) / vehicles.length),
  };
}

export function getAlertRanking() {
  return vehicles.slice(0, 8).map((v, i) => {
    const drive = (i * 7 + 3) % 12;
    const fence = (i * 5 + 1) % 6;
    const fault = (i * 3 + 2) % 4;
    const lowBat = v.soc <= 20 ? 1 : 0;
    return {
      rank: i + 1,
      plate: v.plate,
      drive,
      fence,
      fault,
      lowBat,
      total: drive + fence + fault + lowBat,
    };
  });
}

// --- Monitor page mock data ---
export function getOnlineVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.status === '在线');
}

export function getOfflineVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.status === '离线');
}

export function getTrajectoryPoints(): TrajectoryPoint[] {
  const baseLat = -33.45;
  const baseLng = -70.65;
  return Array.from({ length: 20 }, (_, i) => ({
    lat: baseLat + i * 0.002,
    lng: baseLng + i * 0.003,
    time: `2025-06-${String(10 + i).padStart(2, '0')}T08:${String(30 + i).padStart(2, '0')}:00`,
  }));
}

export function getTrips(): TripInfo[] {
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
  return vehicles.slice(0, 5).map((v, i) => ({
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
  const fenceNames = ['圣地亚哥中心仓库', '瓦尔帕莱索港区', '普罗维登西亚', '维塔库拉', '迈普'];
  return vehicles.slice(0, 8).map((v, i) => ({
    id: `fa-${i}`,
    plate: v.plate,
    vin: v.vin,
    type: i % 2 === 0 ? 'in' as const : 'out' as const,
    fence_name: fenceNames[i % 5] as string,
    location: ['智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号', '智利瓦尔帕莱索大区瓦尔帕莱索港码头', '智利奥伊金斯将军大区兰卡瓜市解放者大道', '智利马乌莱大区塔尔卡市一号公路', '智利比奥比奥大区康塞普西翁市自由大道'][i % 5]!,
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
  }));
}

export function getFaultAlerts(): FaultAlert[] {
  const faultTypes: FaultType4[] = ['VDC', 'CDCU', 'BDCU', 'ADAS'];
  const faultContents: Record<string, string> = {
    VDC: 'VDC电机控制器错误码0xE3',
    CDCU: 'CDCU数据链路错误',
    BDCU: 'BDCU继电器卡滞故障',
    ADAS: 'ADAS摄像头需要标定',
  };
  return vehicles.slice(0, 12).map((v, i) => ({
    id: `fu-${i}`,
    plate: v.plate,
    vin: v.vin,
    device: v.device,
    type: faultTypes[i % 4]!,
    content: faultContents[faultTypes[i % 4]!] || 'Unknown fault',
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'Fixed' as const : (i % 3 === 1 ? 'WorkOrder' as const : 'Pending' as const),
  }));
}

export function getBatteryAlerts(): BatteryAlert[] {
  const batTypes: BatteryAlert['type'][] = ['SOC过低', '电池高温', 'SOC跳变', '充电故障', '温差报警'];
  return vehicles.slice(0, 8).map((v, i) => ({
    id: `ba-${i}`,
    plate: v.plate,
    vin: v.vin,
    device: v.device,
    type: batTypes[i % 5]!,
    content: ['电量低于20%', '电池温度过高', 'SOC突变', '充电异常中断', '电芯温差过大'][i % 5] as string,
    time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + (i % 30)).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'Fixed' as const : (i % 3 === 1 ? 'WorkOrder' as const : 'Pending' as const),
  }));
}

// --- Driving page mock data ---
const alertTypes = ['Rapid Accel', 'Hard Brake', 'Sharp Turn', 'Fatigue', 'AEB', 'Rapid Accel'] as const;

export function getDrivingAlerts(): DrivingAlert[] {
  return vehicles.slice(0, 8).map((v, i) => ({
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
  return vehicles.slice(0, 8).map((v, i) => ({
    id: `dr-${i}`,
    plate: v.plate,
    vin: v.vin,
    period: i < 4 ? '2025年第23周' : '2025年6月',
    km: Math.floor(500 + Math.random() * 3000),
    risks: Math.floor(1 + Math.random() * 15),
    level: reportLevels[i % 4]!,
    score: Math.floor(60 + Math.random() * 40),
  }));
}

// --- Battery page mock data ---
export function getBatteryMonitorItems(): BatteryMonitorItem[] {
  return vehicles.slice(0, 10).map((v, i) => ({
    id: `bm-${i}`,
    plate: v.plate,
    vin: v.vin,
    soc: v.soc,
    soh: v.soh,
    temp: v.temp,
    range: v.range,
    charges: Math.floor(10 + Math.random() * 90),
    status: (['charging', 'idle', 'unknown'] as const)[Math.floor(Math.random() * 3)]!,
  }));
}

export function getChargeRecords(): ChargeRecord[] {
  return vehicles.slice(0, 8).map((v, i) => ({
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
  return vehicles.slice(0, 8).map((v, i) => ({
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
    { area: 'highway', km: 285 },
    { area: 'city', km: 120 },
    { area: 'rural', km: 95 },
  ];
}

export function getDailyConsumption(days: number = 30): number[] {
  return Array.from({ length: days }, () => Math.floor(5 + Math.random() * 20));
}

// ====== New mock data for Trips, Fence, Repair, Tenant, Biz, Sys pages ======

const tripData: TripDetail[] = [
  {
    id: 't1', vin: 'LJ8T7AD0000100000', plate: 'KLTX51',
    startTime: '2026-06-10 08:00', endTime: '2026-06-10 09:25',
    startLocation: '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号', endLocation: '智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号',
    distance: 115, duration: '01:25', avgSpeed: 81, maxSpeed: 95, minSpeed: 55,
    alerts: [
      { id: 'a1', type: '急加速', time: '2026-06-04 08:15' },
      { id: 'a2', type: '急减速', time: '2026-06-04 08:45' },
      { id: 'a3', type: '超速', time: '2026-06-04 09:00' },
    ],
    alertCount: 3,
  },
  {
    id: 't2', vin: 'LJ8T7AD0000100001', plate: 'BDFG78',
    startTime: '2026-05-28 07:30', endTime: '2026-05-28 10:10',
    startLocation: '智利圣地亚哥马伊普区工业大道5500号', endLocation: '智利圣地亚哥拉斯孔德斯区商业大道3200号',
    distance: 95, duration: '02:40', avgSpeed: 62, maxSpeed: 88, minSpeed: 40,
    alerts: [
      { id: 'b1', type: '急转弯', time: '2026-06-04 08:20' },
      { id: 'b2', type: '急加速', time: '2026-06-04 09:05' },
    ],
    alertCount: 2,
  },
  {
    id: 't3', vin: 'LJ8T7AD0000100002', plate: 'PRHM23',
    startTime: '2026-06-11 06:00', endTime: '2026-06-11 07:45',
    startLocation: '智利圣地亚哥普罗维登西亚区新普罗维登西亚街1050号', endLocation: '智利圣地亚哥首都大区阿图罗梅里诺贝尼特斯国际机场',
    distance: 88, duration: '01:45', avgSpeed: 73, maxSpeed: 92, minSpeed: 50,
    alerts: [],
    alertCount: 0,
  },
  {
    id: 't4', vin: 'LJ8T7AD0000100003', plate: 'SNWK91',
    startTime: '2026-05-25 09:00', endTime: '2026-05-25 12:30',
    startLocation: '智利圣地亚哥圣米格尔区大阿韦尼达街890号', endLocation: '智利奥伊金斯将军大区兰卡瓜市解放者大道901号',
    distance: 145, duration: '03:30', avgSpeed: 58, maxSpeed: 85, minSpeed: 35,
    alerts: [
      { id: 'd1', type: '疲劳驾驶', time: '2026-06-04 11:00' },
      { id: 'd2', type: '超速', time: '2026-06-04 10:30' },
      { id: 'd3', type: '急减速', time: '2026-06-04 09:45' },
    ],
    alertCount: 3,
  },
  {
    id: 't5', vin: 'LJ8T7AD0000100004', plate: 'LMCX44',
    startTime: '2026-06-12 10:00', endTime: '2026-06-12 11:20',
    startLocation: '智利瓦尔帕莱索大区比尼亚德尔马市海滨路789号', endLocation: '智利瓦尔帕莱索大区基略塔市中央大道345号',
    distance: 65, duration: '01:20', avgSpeed: 70, maxSpeed: 90, minSpeed: 45,
    alerts: [
      { id: 'e1', type: '急转弯', time: '2026-06-04 10:35' },
    ],
    alertCount: 1,
  },
  {
    id: 't6', vin: 'LJ8T7AD0000100005', plate: 'VTRJ67',
    startTime: '2026-06-09 05:30', endTime: '2026-06-09 08:00',
    startLocation: '智利圣地亚哥圣贝尔纳多市自由大道1200号', endLocation: '智利圣地亚哥梅利皮亚市港口路560号',
    distance: 120, duration: '02:30', avgSpeed: 65, maxSpeed: 82, minSpeed: 38,
    alerts: [
      { id: 'f1', type: '急加速', time: '2026-06-04 06:10' },
      { id: 'f2', type: '超速', time: '2026-06-04 07:00' },
      { id: 'f3', type: '急减速', time: '2026-06-04 07:30' },
      { id: 'f4', type: '疲劳驾驶', time: '2026-06-04 07:50' },
    ],
    alertCount: 4,
  },
  {
    id: 't7', vin: 'LJ8T7AD0000100006', plate: 'HZPY12',
    startTime: '2026-06-08 11:00', endTime: '2026-06-08 13:15',
    startLocation: '智利圣地亚哥普恩特阿尔托区南部大道4500号', endLocation: '智利圣地亚哥兰帕市北部公路2100号',
    distance: 105, duration: '02:15', avgSpeed: 75, maxSpeed: 96, minSpeed: 52,
    alerts: [],
    alertCount: 0,
  },
  {
    id: 't8', vin: 'LJ8T7AD0000100007', plate: 'QBNF85',
    startTime: '2026-06-07 08:30', endTime: '2026-06-07 11:45',
    startLocation: '智利圣地亚哥拉佛罗里达区瓦兰多街1780号', endLocation: '智利圣地亚哥科利纳市中央广场路680号',
    distance: 130, duration: '03:15', avgSpeed: 60, maxSpeed: 78, minSpeed: 30,
    alerts: [
      { id: 'h1', type: '急减速', time: '2026-06-04 09:15' },
    ],
    alertCount: 1,
  },
  {
    id: 't9', vin: 'LJ8T7AD0000100008', plate: 'DRLG33',
    startTime: '2026-06-11 12:00', endTime: '2026-06-11 14:00',
    startLocation: '智利圣地亚哥韦丘拉巴区改革大道3800号', endLocation: '智利圣地亚哥基利库拉市工业街1100号',
    distance: 55, duration: '02:00', avgSpeed: 55, maxSpeed: 80, minSpeed: 25,
    alerts: [
      { id: 'i1', type: '急加速', time: '2026-06-04 12:30' },
      { id: 'i2', type: '急转弯', time: '2026-06-04 13:00' },
      { id: 'i3', type: '超速', time: '2026-06-04 13:30' },
    ],
    alertCount: 3,
  },
  {
    id: 't10', vin: 'LJ8T7AD0000100009', plate: 'TWKC79',
    startTime: '2026-05-20 07:00', endTime: '2026-05-20 08:50',
    startLocation: '智利圣地亚哥中央火车站区解放者大道7200号', endLocation: '智利圣地亚哥普达韦尔市机场路4500号',
    distance: 78, duration: '01:50', avgSpeed: 68, maxSpeed: 86, minSpeed: 42,
    alerts: [
      { id: 'j1', type: '急减速', time: '2026-06-04 07:40' },
    ],
    alertCount: 1,
  },
];

export function getTripDetails(): TripDetail[] {
  return tripData;
}

export function getTripDetailById(id: string): TripDetail | undefined {
  return tripData.find((t) => t.id === id);
}

// --- Fence mock data ---
let fenceData: FenceItem[] = [
  { id: 'f1', name: 'Santiago Centro Warehouse', type: 'center', vehicles: ['KLTX51', 'KLTX52', 'KLTX55'], alertType: '出栏报警', status: '生效中', address: 'Av. Libertador Bernardo O\'Higgins 1500, Santiago', time: '2026-01-15 10:00' },
  { id: 'f2', name: 'Valparaiso Port Area', type: 'custom', vehicles: ['KLTX53', 'KLTX56'], alertType: '入栏报警', status: '生效中', address: 'Puerto Valparaiso, Valparaiso', time: '2026-02-20 14:30' },
  { id: 'f3', name: 'Maipu Logistics Park', type: 'custom', vehicles: ['KLTX54', 'KLTX57', 'KLTX58'], alertType: '出栏报警', status: '未生效', address: 'Camino a Melipilla 5000, Maipu', time: '2026-03-10 09:00' },
  { id: 'f4', name: 'Las Condes Depot', type: 'center', vehicles: ['KLTX59'], alertType: '入栏报警', status: '生效中', address: 'Av. Apoquindo 4000, Las Condes', time: '2026-03-22 16:45' },
  { id: 'f5', name: 'Quillota Distribution Center', type: 'custom', vehicles: ['KLTX60', 'KLTX61'], alertType: '出栏报警', status: '生效中', address: 'Ruta 5 Norte Km 120, Quillota', time: '2026-04-01 11:20' },
  { id: 'f6', name: 'Rancagua Service Point', type: 'center', vehicles: ['KLTX62'], alertType: '入栏报警', status: '未生效', address: 'Av. Libertador 800, Rancagua', time: '2026-04-10 08:30' },
];

export function getFenceItems(): FenceItem[] {
  return fenceData;
}

// --- Repair mock data ---
let repairData: RepairItem[] = [
  { id: 'r1', plate: 'KLTX51', vin: 'LJ8T7AD0000100000', type: '故障类', description: '电机控制器通信故障，错误码0xE3', startDate: '2026-05-20', endTime: '2026-05-21', recorder: 'Admin', status: '维修中' },
  { id: 'r2', plate: 'KLTX53', vin: 'LJ8T7AD0000100002', type: '电池类', description: '电池热管理系统故障，第7电芯温度异常', startDate: '2026-05-18', endTime: '2026-05-19', recorder: 'Admin', status: '维修完成' },
  { id: 'r3', plate: 'KLTX55', vin: 'LJ8T7AD0000100004', type: '故障类', description: '右前轮速传感器信号丢失', startDate: '2026-05-22', endTime: '2026-05-23', recorder: 'Admin', status: '维修中' },
  { id: 'r4', plate: 'KLTX57', vin: 'LJ8T7AD0000100006', type: '电池类', description: 'SOC校准漂移，更换BMS模块', startDate: '2026-05-15', endTime: '2026-05-16', recorder: 'Admin', status: '维修完成' },
  { id: 'r5', plate: 'KLTX59', vin: 'LJ8T7AD0000100008', type: '故障类', description: '高压接触器卡滞断开，逆变器故障', startDate: '2026-05-25', endTime: '2026-05-26', recorder: 'Admin', status: '维修中' },
  { id: 'r6', plate: 'KLTX52', vin: 'LJ8T7AD0000100001', type: '电池类', description: '绝缘电阻偏低，电池包疑似进水', startDate: '2026-05-28', endTime: '2026-05-29', recorder: 'Admin', status: '维修中' },
  { id: 'r7', plate: 'KLTX60', vin: 'LJ8T7AD0000100009', type: '故障类', description: 'DC-DC转换器输出电压超出范围', startDate: '2026-05-10', endTime: '2026-05-11', recorder: 'Admin', status: '维修完成' },
  { id: 'r8', plate: 'KLTX62', vin: 'LJ8T7AD0000100011', type: '电池类', description: '更换电池模组及固件升级', startDate: '2026-05-30', endTime: '2026-05-31', recorder: 'Admin', status: '维修中' },
  { id: 'r9', plate: 'KLTX56', vin: 'LJ8T7AD0000100005', type: '故障类', description: '制动助力真空泵故障', startDate: '2026-06-01', endTime: '2026-06-02', recorder: 'Admin', status: '维修中' },
  { id: 'r10', plate: 'KLTX58', vin: 'LJ8T7AD0000100007', type: '故障类', description: '冷却液泵停转，电机温度过高', startDate: '2026-05-12', endTime: '2026-05-13', recorder: 'Admin', status: '维修完成' },
];

export function getRepairItems(): RepairItem[] {
  return repairData;
}

// --- Tenant mock data ---
let tenantData: TenantItem[] = [
  { id: 'ten1', code: 'WD-CL-001', name: '智利物流集团', admin: 'Carlos Gomez', contact: 'carlos.gomez@wd-logistics.cl', phone: '+56 9 1234 5678', createdDate: '2025-06-01', address: 'Av. Costanera Sur 2730, Santiago', adminAccount: 'carlos_admin' },
  { id: 'ten2', code: 'WD-CL-002', name: 'Santiago Transport', admin: 'Maria Gonzalez', contact: 'maria.g@stgo-transport.cl', phone: '+56 9 2345 6789', createdDate: '2025-07-15', address: 'Las Condes 100, Santiago', adminAccount: 'maria_admin' },
  { id: 'ten3', code: 'WD-CL-003', name: 'Valparaiso Logistics', admin: 'Juan Perez', contact: 'juan.perez@vap-log.cl', phone: '+56 9 3456 7890', createdDate: '2025-08-20', address: 'Puerto Valparaiso, Valparaiso', adminAccount: 'juan_admin' },
  { id: 'ten4', code: 'WD-CL-004', name: 'Rancagua Fleet Services', admin: 'Ana Martinez', contact: 'ana.m@rf-svc.cl', phone: '+56 9 4567 8901', createdDate: '2025-09-10', address: 'O\'Higgins 800, Rancagua', adminAccount: 'ana_admin' },
  { id: 'ten5', code: 'WD-CL-005', name: 'Quillota Transporte', admin: 'Pedro Silva', contact: 'pedro.s@qt.cl', phone: '+56 9 5678 9012', createdDate: '2025-10-05', address: 'Ruta 5 Km 120, Quillota', adminAccount: 'pedro_admin' },
];

export function getTenantItems(): TenantItem[] {
  return tenantData;
}

// --- Assets mock data ---
const assetData: AssetItem[] = [
  { id: 'a1', vin: 'LJ8T7AD0000100000', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a2', vin: 'LJ8T7AD0000100001', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a3', vin: 'LJ8T7AD0000100002', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a4', vin: 'LJ8T7AD0000100003', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a5', vin: 'LJ8T7AD0000100004', tenant: 'Valparaiso Logistics', syncedDate: '2026-05-20 09:15' },
  { id: 'a6', vin: 'LJ8T7AD0000100005', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a7', vin: 'LJ8T7AD0000100006', tenant: 'Rancagua Fleet Services', syncedDate: '2026-05-25 11:00' },
  { id: 'a8', vin: 'LJ8T7AD0000100007', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a9', vin: 'LJ8T7AD0000100008', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a10', vin: 'LJ8T7AD0000100009', tenant: 'Quillota Transporte', syncedDate: '2026-05-30 08:00' },
];

export function getAssetItems(): AssetItem[] {
  return assetData;
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
    soc: Math.min(v.soc + i * 2, 100),
    soh: Math.max(v.soh - i, 60),
    temp: v.temp + (i % 8) - 3,
    range: Math.max(v.range - i * 8, 50),
    status: v.charging,
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
    alerts: i % 4,
  }));
}
export function getVehicleRepairs() {
  const types = ['故障维修', '电池维修'];
  const descs = ['VDC故障维修', '电池高温维修', 'BDCU故障维修', 'ADAS故障维修', 'SOC过低维修', '充电故障维修'];
  const statuses = ['维修中', '已完成'];
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
export function addRepairItem(plate: string, vin: string, type: string, description: string) {
  const newItem: RepairItem = {
    id: `r${_nextRepairId++}`,
    plate,
    vin,
    type: type as '故障类' | '电池类',
    description,
    startDate: new Date().toISOString().slice(0, 10),
    status: '维修中',
  };
  repairData.unshift(newItem);
  return newItem;
}

export function completeRepairItem(id: string) {
  const item = repairData.find((r) => r.id === id);
  if (item) item.status = '维修完成';
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

// --- V1.2 Audit Log mock data ---
interface AuditOpMapping {
  menu: string;
  function: string;
  contentTpl: string;
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
  { menu: '业务管理', function: '新增用户', contentTpl: '新增用户 new_operator@wd-logistics.cl，分配角色 Operator' },
  { menu: '业务管理', function: '编辑用户', contentTpl: '编辑用户 maria_op 信息' },
  { menu: '业务管理', function: '删除用户', contentTpl: '删除用户 temp_user@test.cl' },
  { menu: '业务管理', function: '重置密码', contentTpl: '重置用户 maria_op 的密码' },
  { menu: '业务管理', function: '新增角色', contentTpl: '新增角色 Dispatcher' },
  { menu: '业务管理', function: '编辑角色', contentTpl: '编辑角色 Operator' },
  { menu: '业务管理', function: '删除角色', contentTpl: '删除角色 TempRole' },
  { menu: '业务管理', function: '编辑功能权限', contentTpl: '编辑角色 Operator 的功能权限' },
  { menu: '租户管理', function: '新增租户', contentTpl: '新增租户【Rancagua Fleet Services】' },
  { menu: '租户管理', function: '编辑租户', contentTpl: '编辑租户【智利物流集团】信息' },
  { menu: '租户管理', function: '删除租户', contentTpl: '删除租户【Test Tenant】' },
  { menu: '租户管理', function: '开通主账号', contentTpl: '为租户【智利物流集团】开通主账号 admin@wd-logistics.cl' },
  { menu: '车辆管理', function: '批量导入', contentTpl: '批量导入车辆信息：成功 24 条，失败 2 条' },
  { menu: '围栏管理', function: '新建围栏', contentTpl: '新建围栏【圣地亚哥主干道围栏】，类型【中心围栏】，预警【出栏报警】' },
  { menu: '围栏管理', function: '编辑围栏', contentTpl: '编辑围栏【Valparaiso Port Area】' },
  { menu: '围栏管理', function: '删除围栏', contentTpl: '删除围栏【Test Geofence】' },
  { menu: '围栏管理', function: '启用围栏', contentTpl: '启用围栏【Maipu Logistics Park】' },
  { menu: '围栏管理', function: '停用围栏', contentTpl: '停用围栏【Maipu Logistics Park】' },
  { menu: '围栏管理', function: '添加车辆', contentTpl: `为围栏【圣地亚哥中心仓库】添加车辆 ${maskVin('LJ8T7AD0000100005')}` },
  { menu: '围栏管理', function: '删除车辆', contentTpl: `从围栏【圣地亚哥中心仓库】移除车辆 ${maskVin('LJ8T7AD0000100006')}` },
  { menu: '风控预警', function: '一键报修（故障类）', contentTpl: `一键报修（故障类）：车辆 ${maskVin('LJ8T7AD0000100003')}，报警类型 VDC故障` },
  { menu: '风控预警', function: '一键报修（电池类）', contentTpl: `一键报修（电池类）：车辆 ${maskVin('LJ8T7AD0000100005')}，报警类型 SOC过低` },
  { menu: '维修管理', function: '新建维修', contentTpl: `新建维修记录：车辆 ${maskVin('LJ8T7AD0000100001')}，类型 故障类` },
  { menu: '维修管理', function: '完成维修', contentTpl: `标记维修完成：车辆 ${maskVin('LJ8T7AD0000100001')}，类型 故障类` },
  { menu: '维修管理', function: '编辑维修', contentTpl: `编辑维修记录：车辆 ${maskVin('LJ8T7AD0000100002')}` },
  { menu: '维修管理', function: '删除维修', contentTpl: `删除维修记录：车辆 ${maskVin('LJ8T7AD0000100003')}，类型 电池类` },
  { menu: '系统管理', function: '新增用户', contentTpl: '新增用户 sys_operator@weidu.cl，分配角色 System Admin' },
  { menu: '系统管理', function: '编辑用户', contentTpl: '编辑用户 sys_operator 信息' },
  { menu: '系统管理', function: '删除用户', contentTpl: '删除用户 temp_sys@weidu.cl' },
  { menu: '系统管理', function: '重置密码', contentTpl: '重置用户 sys_operator 的密码' },
  { menu: '系统管理', function: '新增角色', contentTpl: '新增角色 System Auditor' },
  { menu: '系统管理', function: '编辑角色', contentTpl: '编辑角色 System Admin' },
  { menu: '系统管理', function: '删除角色', contentTpl: '删除角色 Temp Sys Role' },
  { menu: '系统管理', function: '编辑功能权限', contentTpl: '编辑角色 System Admin 的功能权限' },
  { menu: '车辆数据', function: '导出车辆信号数据', contentTpl: `导出车辆 ${maskVin('LJ8T7AD0000100001')} 信号数据` },
  { menu: '车辆数据', function: '下载导出文件', contentTpl: '下载导出文件 vehicle_signal_20260601.csv' },
];

const auditNicknames = ['root_admin', 'carlos_admin', 'maria_op', 'juan_mon', 'ana_disp', 'pedro_op', 'sys_op1', 'auditor'];
const auditAccounts = ['root@weidu.cl', 'carlos.gomez@wd-logistics.cl', 'maria.g@stgo-transport.cl', 'juan.perez@vap-log.cl', 'ana.m@rf-svc.cl', 'pedro.s@qt.cl', 'sysop1@weidu.cl', 'auditor@weidu.cl'];
const auditTenants = ['苇渡根租户', '智利物流集团', 'Santiago Transport', 'Valparaiso Logistics', 'Rancagua Fleet Services', 'Quillota Transporte'];

const auditLogData: AuditLog[] = Array.from({ length: 40 }, (_, i) => {
  const mapping = AUDIT_OP_MAPPINGS[i % AUDIT_OP_MAPPINGS.length]!;
  const nickIdx = i % auditNicknames.length;
  const nickname = auditNicknames[nickIdx] as string;
  const isFail = i % 5 === 0;
  const daysAgo = Math.floor(i * 4.5);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + (i % 12), (i * 7) % 60, (i * 3) % 60);
  return {
    id: `al-${i + 1}`,
    time: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
    nickname,
    account: auditAccounts[nickIdx] as string,
    tenant: auditTenants[i % auditTenants.length] as string,
    menu: mapping.menu,
    function: mapping.function,
    content: mapping.contentTpl,
    result: isFail ? '失败' : '成功',
    ...(isFail ? { failReason: ['ERR_AUTH_DENIED', 'ERR_NETWORK', 'ERR_PARAM_INVALID', 'ERR_NOT_FOUND'][i % 4] } : {}),
  };
});

export function getAuditLogs(): AuditLog[] {
  return auditLogData;
}
