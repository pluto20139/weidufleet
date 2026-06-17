import { describe, it, expect } from 'vitest';
import { formatDuration, calculateAge } from './format';

describe('formatDuration', () => {
  it('formats standard duration correctly', () => {
    expect(formatDuration('2h30m')).toBe('2小时30分钟');
    expect(formatDuration('10h05m')).toBe('10小时05分钟');
  });

  it('handles spaces gracefully', () => {
    expect(formatDuration('2 h 30 m')).toBe('2小时30分钟');
  });

  it('handles edge and boundary cases', () => {
    // Zero minutes
    expect(formatDuration('2h0m')).toBe('2小时0分钟');
    // Zero hours
    expect(formatDuration('0h30m')).toBe('0小时30分钟');
    // Large values
    expect(formatDuration('100h59m')).toBe('100小时59分钟');
    // Single-digit minutes unchanged
    expect(formatDuration('1h5m')).toBe('1小时5分钟');
  });

  it('is case-insensitive', () => {
    expect(formatDuration('2H30M')).toBe('2小时30分钟');
    expect(formatDuration('2H30m')).toBe('2小时30分钟');
  });

  it('returns original string if format does not match', () => {
    expect(formatDuration('2 hours')).toBe('2 hours');
    expect(formatDuration('30m')).toBe('30m'); // fallback if no hour
    expect(formatDuration('')).toBe('');
  });
});

describe('calculateAge', () => {
  it('calculates age with 1 decimal precision', () => {
    // Mock Date.now() to 2026-06-09
    const now = new Date('2026-06-09').getTime();
    const originalNow = Date.now;
    Date.now = () => now;

    // 2.5 years ago
    expect(calculateAge('2023-12-09')).toBe(2.5);
    // 0.5 years ago
    expect(calculateAge('2025-12-09')).toBe(0.5);
    
    Date.now = originalNow;
  });

  it('handles invalid dates gracefully', () => {
    expect(calculateAge('invalid-date')).toBe(0);
    expect(calculateAge('')).toBe(0);
  });

  it('handles future dates as 0', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(calculateAge(`${nextYear}-01-01`)).toBe(0);
  });
});