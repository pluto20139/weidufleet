import { describe, it, expect } from 'vitest';
import {
  getVehicles,
  getDashboardStats,
  getBatteryMonitorItems,
  getChargeRecords,
  getDischargeRecords,
  getFenceAlerts,
  getFaultAlerts,
  getBatteryAlerts,
  getDrivingAlerts,
  getDrivingReports,
  getTripDetails,
  getRepairItems,
  getAlertRanking,
  getTrips,
} from '../api/mock';

describe('mock data integrity', () => {
  it('getVehicles returns non-empty array with required fields', () => {
    const vehicles = getVehicles();
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach(v => {
      expect(v.vin).toBeTruthy();
      expect(v.plate).toBeTruthy();
      expect(v.model).toBeTruthy();
      expect(['在线', '离线']).toContain(v.status);
      expect(v.soc).toBeGreaterThanOrEqual(0);
      expect(v.soc).toBeLessThanOrEqual(100);
      // Fields added in the bug-fix commit
      expect(v.batteryVersion).toBeTruthy();
      expect(v.deviceName).toBeTruthy();
    });
  });

  it('getBatteryMonitorItems includes vin field', () => {
    const items = getBatteryMonitorItems();
    expect(items.length).toBeGreaterThan(0);
    items.forEach(item => {
      expect(item.vin).toBeTruthy();
      expect(item.plate).toBeTruthy();
      expect(item.soc).toBeGreaterThanOrEqual(0);
      expect(['charging', 'idle', 'unknown']).toContain(item.status);
    });
  });

  it('getChargeRecords has valid before/after values', () => {
    const records = getChargeRecords();
    records.forEach(r => {
      expect(r.before).toBeGreaterThanOrEqual(0);
      expect(r.before).toBeLessThanOrEqual(100);
      expect(r.after).toBeGreaterThanOrEqual(0);
      expect(r.after).toBeLessThanOrEqual(100);
      expect(r.vin).toBeTruthy();
    });
  });

  it('getFenceAlerts has required fields', () => {
    const alerts = getFenceAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach(a => {
      expect(a.id).toBeTruthy();
      expect(a.plate).toBeTruthy();
      expect(['in', 'out']).toContain(a.type);
      expect(a.fence_name).toBeTruthy();
    });
  });

  it('getFaultAlerts has valid status values', () => {
    const alerts = getFaultAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach(a => {
      expect(['Pending', 'WorkOrder', 'Fixed']).toContain(a.status);
    });
  });

  it('getBatteryAlerts has valid status and type values', () => {
    const alerts = getBatteryAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach(a => {
      expect(['Pending', 'WorkOrder', 'Fixed']).toContain(a.status);
      expect(['Low SOC', 'High Temp', 'SOC Jump', 'Charge Fault', 'Temp Diff']).toContain(a.type);
    });
  });

  it('getDrivingReports has valid scores within 0-100', () => {
    const reports = getDrivingReports();
    expect(reports.length).toBeGreaterThan(0);
    reports.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.vin).toBeTruthy();
      expect(r.plate).toBeTruthy();
    });
  });

  it('getTripDetails has vin field', () => {
    const trips = getTripDetails();
    expect(trips.length).toBeGreaterThan(0);
    trips.forEach(t => {
      expect(t.vin).toBeTruthy();
      expect(t.plate).toBeTruthy();
      expect(t.distance).toBeGreaterThan(0);
    });
  });

  it('getDashboardStats returns sensible averages', () => {
    const stats = getDashboardStats();
    expect(stats.totalVehicles).toBeGreaterThan(0);
    expect(stats.online + stats.offline).toEqual(stats.totalVehicles);
    expect(stats.avgSoc).toBeGreaterThanOrEqual(0);
    expect(stats.avgSoc).toBeLessThanOrEqual(100);
  });

  it('getAlertRanking has deterministic totals matching sum of parts', () => {
    const ranking = getAlertRanking();
    expect(ranking.length).toBe(8);
    ranking.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
      expect(entry.plate).toBeTruthy();
      expect(Number.isInteger(entry.drive)).toBe(true);
      expect(Number.isInteger(entry.fence)).toBe(true);
      expect(Number.isInteger(entry.fault)).toBe(true);
      expect(Number.isInteger(entry.lowBat)).toBe(true);
      // total must be the exact sum of its parts (data integrity constraint)
      expect(entry.total).toBe(entry.drive + entry.fence + entry.fault + entry.lowBat);
    });
  });

  it('getDrivingAlerts has required fields and valid alert types', () => {
    const alerts = getDrivingAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    const validTypes = ['FCW1', 'FCW2', 'AEB_V', 'PCW1', 'PCW2', 'AEB_P'];
    alerts.forEach(a => {
      expect(a.id).toBeTruthy();
      expect(a.plate).toBeTruthy();
      expect(a.vin).toBeTruthy();
      expect(validTypes).toContain(a.type);
      expect(a.position).toBeTruthy();
      expect(a.speed).toBeGreaterThanOrEqual(0);
      expect(a.time).toBeTruthy();
    });
  });

  it('getTrips returns valid trip info with real address content', () => {
    const trips = getTrips();
    expect(trips.length).toBeGreaterThan(0);
    trips.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.plate).toBeTruthy();
      expect(t.startLocation).toBeTruthy();
      expect(t.startLocation).toContain('智利');
      expect(t.endLocation).toBeTruthy();
      expect(t.endLocation).toContain('智利');
      expect(t.distance).toBeGreaterThan(0);
    });
  });
});
