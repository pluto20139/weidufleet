import type { Vehicle } from '@/types';
import { useAppStore } from '@/store';

const plates = ['KLTX56', 'BDFG78', 'PRHM23', 'SNWK91', 'LMCX44', 'VTRJ67', 'HZPY12', 'QBNF85', 'DRLG33', 'TWKC79'];
const models = ['苇渡E700'];
const colors = ['白色', '银色', '蓝色'];

const tenantNamesToIds: Record<string, string> = {
  '智利物流集团': 'ten1',
  'Santiago Transport': 'ten2',
  'Valparaiso Logistics': 'ten3',
  'Rancagua Fleet Services': 'ten4',
  'Quillota Transporte': 'ten5',
};

const tenantNames = ['智利物流集团', 'Santiago Transport', 'Valparaiso Logistics', 'Rancagua Fleet Services', 'Quillota Transporte'];

const vehicles: Vehicle[] = Array.from({ length: 24 }, (_, i) => {
  const tIndex = i % 5;
  const tenantName = tenantNames[tIndex]!;
  const tenantId = tenantNamesToIds[tenantName]!;

  return {
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
    status: i < 3 ? 'offline' as const : 'online' as const,
    lat: -33.45 + Math.random() * 0.1,
    lng: -70.65 + Math.random() * 0.08,
    soc: Math.floor(Math.random() * 80 + 20),
    soh: Math.floor(Math.random() * 20 + 80),
    temp: Math.floor(Math.random() * 20 + 20),
    range: Math.floor(Math.random() * 150 + 100),
    charging: (['未充电', '准备充电', '充电中', '对方放电', '故障&异常'] as const)[Math.floor(Math.random() * 5)]!,
    tenantId,
    tenant: tenantName,
  };
});

const tenantHierarchy: Record<string, string[]> = {
  'root': ['ten1', 'ten2', 'ten3', 'ten4', 'ten5'],
  'ten1': ['ten1', 'ten2', 'ten3'],
  'ten2': ['ten2', 'ten3'],
  'ten3': ['ten3'],
  'ten4': ['ten4'],
  'ten5': ['ten5'],
};

export function getFilteredVehicles(isCrossTenant: boolean = false): Vehicle[] {
  const currentTenantId = useAppStore.getState().tenant || 'ten1';
  if (currentTenantId === 'root') {
    return vehicles;
  }
  const allowedTenants = isCrossTenant
    ? (tenantHierarchy[currentTenantId] || [currentTenantId])
    : [currentTenantId];
  return vehicles.filter((v) => v.tenantId && allowedTenants.includes(v.tenantId));
}

export function getVehicles(isCrossTenant: boolean = false): Vehicle[] {
  return getFilteredVehicles(isCrossTenant);
}

export function getVehicleByVin(vin: string): Vehicle | undefined {
  return vehicles.find((v) => v.vin === vin);
}

export function getOnlineVehicles(isCrossTenant: boolean = false): Vehicle[] {
  return getFilteredVehicles(isCrossTenant).filter((v) => v.status === 'online');
}

export function getOfflineVehicles(isCrossTenant: boolean = false): Vehicle[] {
  return getFilteredVehicles(isCrossTenant).filter((v) => v.status === 'offline');
}

export function getTrajectoryPoints() {
  const baseLat = -33.45;
  const baseLng = -70.65;
  return Array.from({ length: 20 }, (_, i) => ({
    lat: baseLat + i * 0.002,
    lng: baseLng + i * 0.003,
    time: `2025-06-${String(10 + i).padStart(2, '0')}T08:${String(30 + i).padStart(2, '0')}:00`,
  }));
}

export { tenantHierarchy };
