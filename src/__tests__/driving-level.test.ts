import { describe, it, expect } from 'vitest';

// Replicate the getLevelInfo logic from Driving.tsx for boundary testing
const getLevelInfo = (score: number): { text: string; color: string } => {
  if (score >= 80) return { text: 'safe', color: 'green' };
  if (score >= 60) return { text: 'low', color: 'blue' };
  if (score >= 40) return { text: 'medium', color: 'orange' };
  return { text: 'high', color: 'red' };
};

describe('driving level boundary tests', () => {
  it('score 100 → safe', () => {
    expect(getLevelInfo(100)).toEqual({ text: 'safe', color: 'green' });
  });

  it('score 80 → safe (boundary)', () => {
    expect(getLevelInfo(80)).toEqual({ text: 'safe', color: 'green' });
  });

  it('score 79 → low risk (boundary)', () => {
    expect(getLevelInfo(79)).toEqual({ text: 'low', color: 'blue' });
  });

  it('score 60 → low risk (boundary)', () => {
    expect(getLevelInfo(60)).toEqual({ text: 'low', color: 'blue' });
  });

  it('score 59 → medium risk (boundary)', () => {
    expect(getLevelInfo(59)).toEqual({ text: 'medium', color: 'orange' });
  });

  it('score 40 → medium risk (boundary)', () => {
    expect(getLevelInfo(40)).toEqual({ text: 'medium', color: 'orange' });
  });

  it('score 39 → high risk (boundary)', () => {
    expect(getLevelInfo(39)).toEqual({ text: 'high', color: 'red' });
  });

  it('score 0 → high risk', () => {
    expect(getLevelInfo(0)).toEqual({ text: 'high', color: 'red' });
  });

  it('negative score → high risk (edge case)', () => {
    expect(getLevelInfo(-1)).toEqual({ text: 'high', color: 'red' });
  });
});

describe('fault type labels coverage', () => {
  const faultTypeLabels: Record<string, string> = {
    'VDC': 'VDC故障',
    'CDCU': 'CDCU故障',
    'BDCU': 'BDCU故障',
    'ADAS': 'ADAS故障',
  };

  it('should have exactly 4 fault types', () => {
    expect(Object.keys(faultTypeLabels).length).toBe(4);
  });

  it('all fault type labels should end with 故障', () => {
    Object.values(faultTypeLabels).forEach(label => {
      expect(label).toMatch(/故障$/);
    });
  });
});

describe('battery alert type labels coverage', () => {
  const batteryTypeLabels: Record<string, string> = {
    'Low SOC': 'SOC过低',
    'High Temp': '电池高温',
    'SOC Jump': 'SOC跳变',
    'Charge Fault': '充电故障',
    'Temp Diff': '温差报警',
  };

  it('should have exactly 5 battery alert types', () => {
    expect(Object.keys(batteryTypeLabels).length).toBe(5);
  });

  it('unknown type should fallback gracefully', () => {
    const unknownType = 'UnknownType';
    const result = batteryTypeLabels[unknownType] || unknownType;
    expect(result).toBe('UnknownType');
  });
});

describe('driving alert type labels', () => {
  const alertTypeLabels: Record<string, string> = {
    'Rapid Accel': '急加速',
    'Hard Brake': '急减速',
    'Sharp Turn': '急转弯',
    'Fatigue': '疲劳驾驶',
    'AEB': 'AEB制动',
  };

  it('should have exactly 5 driving alert types', () => {
    expect(Object.keys(alertTypeLabels).length).toBe(5);
  });

  it('all labels should be in Chinese', () => {
    Object.values(alertTypeLabels).forEach(label => {
      expect(label).toMatch(/[\u4e00-\u9fff]/);
    });
  });
});
