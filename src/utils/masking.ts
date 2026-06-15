/**
 * V1.2 全局脱敏与位置精度工具函数
 */

/**
 * VIN码脱敏：17位VIN保留前6位 + 7个* + 后4位
 * 例: LJ8T7AD100000 → LJ8T7A*******0000
 */
export function maskVin(vin: string): string {
  if (!vin) return '';
  if (vin.length !== 17) return vin;
  return vin.slice(0, 6) + '*******' + vin.slice(-4);
}

/**
 * 车牌号脱敏：首尾各保留2位，中间用*替换
 * 例: ABCD12 → AB**12
 */
export function maskPlate(plate: string): string {
  if (!plate) return '';
  if (plate.length <= 4) return plate;
  const head = plate.slice(0, 2);
  const tail = plate.slice(-2);
  const mid = '*'.repeat(plate.length - 4);
  return head + mid + tail;
}

/**
 * 地理位置截断至街道级：移除末尾的门牌号/建筑号
 * 策略：匹配末尾的"数字+号"或纯数字部分并移除
 * 例: "圣地亚哥市阿乌马达步行街234号" → "圣地亚哥市阿乌马达步行街"
 * 例: "Av. Libertador 1500, Santiago" → "Av. Libertador, Santiago"
 */
export function truncateLocation(address: string): string {
  if (!address) return '';
  // 中文地址：移除末尾"数字+号"
  let result = address.replace(/\d+号$/, '');
  // 西文地址：移除末尾"数字"(可能带逗号前) 如 "1500," 或 "1500"
  result = result.replace(/\s+\d+\s*,/, ',');
  result = result.replace(/\s+\d+$/, '');
  return result.trim();
}

/**
 * VIN搜索匹配：支持明文精确匹配 + 脱敏后可见字符模糊匹配
 * 用户输入的input可以是完整明文VIN，也可以是脱敏后看到的部分字符
 */
export function matchVinSearch(input: string, rawVin: string): boolean {
  if (!input) return true;
  if (!rawVin) return false;
  const lowerInput = input.toLowerCase();
  const lowerVin = rawVin.toLowerCase();
  // 明文匹配
  if (lowerVin.includes(lowerInput)) return true;
  // 脱敏后可见字符匹配（前6位或后4位）
  const masked = maskVin(rawVin).toLowerCase();
  return masked.includes(lowerInput);
}

/**
 * 车牌搜索匹配：支持明文精确匹配 + 脱敏后可见字符模糊匹配
 */
export function matchPlateSearch(input: string, rawPlate: string): boolean {
  if (!input) return true;
  if (!rawPlate) return false;
  const lowerInput = input.toLowerCase();
  const lowerPlate = rawPlate.toLowerCase();
  // 明文匹配
  if (lowerPlate.includes(lowerInput)) return true;
  // 脱敏后可见字符匹配
  const masked = maskPlate(rawPlate).toLowerCase();
  return masked.includes(lowerInput);
}
