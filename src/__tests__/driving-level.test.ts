import { describe, it, expect } from 'vitest';

// Replicate the getLevelInfo logic from Driving.tsx for boundary testing
const getLevelInfo = (score: number): { text: string; color: string } => {
  if (score >= 80) return { text: 'safe', color: 'green' };
  if (score >= 60) return { text: 'low', color: 'blue' };
  if (score >= 40) return { text: 'medium', color: 'orange' };
  return { text: 'high', color: 'red' };
};

describe('driving level boundary tests', () => {
  it('score 100 -> safe', () => {
    expect(getLevelInfo(100)).toEqual({ text: 'safe', color: 'green' });
  });

  it('score 80 -> safe (boundary)', () => {
    expect(getLevelInfo(80)).toEqual({ text: 'safe', color: 'green' });
  });

  it('score 79 -> low risk (boundary)', () => {
    expect(getLevelInfo(79)).toEqual({ text: 'low', color: 'blue' });
  });

  it('score 60 -> low risk (boundary)', () => {
    expect(getLevelInfo(60)).toEqual({ text: 'low', color: 'blue' });
  });

  it('score 59 -> medium risk (boundary)', () => {
    expect(getLevelInfo(59)).toEqual({ text: 'medium', color: 'orange' });
  });

  it('score 40 -> medium risk (boundary)', () => {
    expect(getLevelInfo(40)).toEqual({ text: 'medium', color: 'orange' });
  });

  it('score 39 -> high risk (boundary)', () => {
    expect(getLevelInfo(39)).toEqual({ text: 'high', color: 'red' });
  });

  it('score 0 -> high risk', () => {
    expect(getLevelInfo(0)).toEqual({ text: 'high', color: 'red' });
  });

  it('negative score -> high risk (edge case)', () => {
    expect(getLevelInfo(-1)).toEqual({ text: 'high', color: 'red' });
  });
});

describe('fault type labels coverage', () => {
  const faultTypeLabels: Record<string, string> = {
    'VDC': 'VDC故障报警',
    'CDCU': 'CDCU故障报警',
    'BDCU': 'BDCU故障报警',
    'ADAS': 'ADAS故障报警',
    'DC-DC温度': 'DC-DC温度报警',
    'DC-DC状态': 'DC-DC状态报警',
    '驱动电机控制器温度': '驱动电机控制器温度报警',
    '驱动电机温度': '驱动电机温度报警',
    '高压互锁状态': '高压互锁状态报警',
  };

  it('should have exactly 9 fault types', () => {
    expect(Object.keys(faultTypeLabels).length).toBe(9);
  });

  it('all fault type labels should end with 报警', () => {
    Object.values(faultTypeLabels).forEach(label => {
      expect(label).toMatch(/报警$/);
    });
  });
});

describe('battery alert type labels coverage', () => {
  const batteryTypeLabels: Record<string, string> = {
    'SOC过低': 'SOC过低报警',
    '电池高温': '电池高温报警',
    'SOC跳变': 'SOC跳变报警',
    '充电故障': '充电故障报警',
    '温差报警': '温差报警',
    '储能过压': '储能过压报警',
    '储能欠压': '储能欠压报警',
    '单体过压': '单体过压报警',
    '单体欠压': '单体欠压报警',
    'SOC过高': 'SOC过高报警',
    '储能不匹配': '储能不匹配报警',
    '单体一致性差': '单体一致性差报警',
    '绝缘报警': '绝缘报警',
    '储能过充': '储能过充报警',
  };

  it('should have exactly 14 battery alert types', () => {
    expect(Object.keys(batteryTypeLabels).length).toBe(14);
  });

  it('unknown type should fallback gracefully', () => {
    const unknownType = 'UnknownType';
    const result = batteryTypeLabels[unknownType] || unknownType;
    expect(result).toBe('UnknownType');
  });
});

describe('driving alert type labels', () => {
  const alertTypeLabels: Record<string, string> = {
    '对车一级预警': '对车一级预警',
    '对车二级预警': '对车二级预警',
    '对车AEB制动': '对车AEB制动',
    '对人一级预警': '对人一级预警',
    '对人二级预警': '对人二级预警',
    '对人AEB制动': '对人AEB制动',
  };

  it('should have exactly 6 driving alert types', () => {
    expect(Object.keys(alertTypeLabels).length).toBe(6);
  });

  it('all labels should be non-empty strings', () => {
    Object.values(alertTypeLabels).forEach(label => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
