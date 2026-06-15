/**
 * V1.2 轨迹数据10天存储限制工具函数
 */
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

/** 轨迹数据保留天数 */
const TRAJECTORY_RETENTION_DAYS = 10;

/** 单次查询最大跨度天数 */
const TRAJECTORY_MAX_SPAN_DAYS = 3;

/**
 * 判断给定日期是否在10天窗口内
 */
export function isWithinTrajectoryWindow(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = dayjs(dateStr);
  const now = dayjs();
  const threshold = now.subtract(TRAJECTORY_RETENTION_DAYS, 'day');
  return date.isAfter(threshold) || date.isSame(threshold);
}

/**
 * 返回轨迹查询可选日期范围 [now-10天, now]
 */
export function getTrajectoryDateRange(): [Dayjs, Dayjs] {
  return [
    dayjs().subtract(TRAJECTORY_RETENTION_DAYS, 'day'),
    dayjs(),
  ];
}

/**
 * 判断单次查询跨度是否 <= 3天
 */
export function isTrajectorySpanValid(start: Dayjs, end: Dayjs): boolean {
  return end.diff(start, 'day') <= TRAJECTORY_MAX_SPAN_DAYS;
}

/**
 * 用于 DatePicker 的 disabledDate 函数
 * 禁用10天前的日期以及未来日期
 */
export function disabledTrajectoryDate(current: Dayjs): boolean {
  if (!current) return false;
  const now = dayjs();
  const threshold = now.subtract(TRAJECTORY_RETENTION_DAYS, 'day');
  return current.isBefore(threshold, 'day') || current.isAfter(now, 'day');
}
