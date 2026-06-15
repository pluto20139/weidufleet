import { describe, it, expect } from 'vitest';
import zh from '../i18n/zh';
import en from '../i18n/en';
import es from '../i18n/es';

describe('i18n consistency', () => {
  const zhKeys = Object.keys(zh);
  const enKeys = Object.keys(en);
  const esKeys = Object.keys(es);

  it('zh and en should have the same keys', () => {
    const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
    const extraInEn = enKeys.filter(k => !zhKeys.includes(k));
    expect(missingInEn).toEqual([]);
    expect(extraInEn).toEqual([]);
  });

  it('zh and es should have the same keys', () => {
    const missingInEs = zhKeys.filter(k => !esKeys.includes(k));
    const extraInEs = esKeys.filter(k => !zhKeys.includes(k));
    expect(missingInEs).toEqual([]);
    expect(extraInEs).toEqual([]);
  });

  it('no translation value should be empty string', () => {
    const emptyZh = zhKeys.filter(k => (zh as Record<string, string>)[k] === '');
    const emptyEn = enKeys.filter(k => (en as Record<string, string>)[k] === '');
    const emptyEs = esKeys.filter(k => (es as Record<string, string>)[k] === '');
    expect(emptyZh).toEqual([]);
    expect(emptyEn).toEqual([]);
    expect(emptyEs).toEqual([]);
  });

  it('critical keys for bug fixes should exist', () => {
    const criticalKeys = [
      'risk.alert_location', 'risk.alert_time', 'risk.status',
      'risk.pending', 'risk.fixed', 'risk.repairing',
      'risk.alert_content', 'risk.alert_content_battery',
      'risk.fence_detail_title', 'risk.alert_speed',
      'driving.safe', 'driving.low', 'driving.medium', 'driving.high',
      'driving.safe_text', 'driving.low_text', 'driving.medium_text', 'driving.high_text',
      'driving.risk_event', 'driving.view_position', 'driving.daytime', 'driving.nighttime',
      'battery.avg_temp', 'battery.temp', 'battery.charges',
      'battery.before', 'battery.after',
      'battery.discharge_before', 'battery.discharge_after',
      'battery.low_batt', 'battery.health',
      'battery.charging', 'battery.idle', 'battery.unknown',
      'trips.start_time', 'trips.end_time', 'trips.km', 'trips.duration',
      'repair.recorder', 'repair.status_name', 'repair.status_repairing',
      'repair.status_completed', 'repair.action.view_detail', 'repair.action.delete',
      'repair.fault', 'repair.battery', 'repair.repair_desc',
      'trip.start_location', 'trip.end_location', 'trip.alerts',
      'trip.detail_title', 'app.logo',
      'veh.battery_version', 'veh.last_location', 'veh.device_name',
      'fence.repair',
      'alert.FCW1', 'alert.FCW2', 'alert.AEB_V',
      'alert.PCW1', 'alert.PCW2', 'alert.AEB_P',
    ];
    for (const key of criticalKeys) {
      expect(zhKeys).toContain(key);
      expect(enKeys).toContain(key);
      expect(esKeys).toContain(key);
    }
  });
});
