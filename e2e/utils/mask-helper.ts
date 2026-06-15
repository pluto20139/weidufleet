/**
 * VIN 脱敏校验：检查文本是否符合脱敏格式（前6 + ******* + 后4）
 */
export function expectMaskedVin(text: string): boolean {
  return /^[A-Z0-9]{6}\*{7}[A-Z0-9]{4}$/.test(text);
}

/**
 * 车牌脱敏校验：检查文本是否符合脱敏格式（前2 + ** + 后2）
 */
export function expectMaskedPlate(text: string): boolean {
  return /^.{2}\*{2}.{2}$/.test(text);
}

/**
 * 地址街道级校验：地址不应包含门牌号（数字+号结尾）
 */
export function expectStreetLevel(address: string): boolean {
  return !/\d+号$/.test(address);
}

/**
 * 从 antd Table 中提取指定列的文本数组
 */
export async function getColumnTexts(
  page: any,
  tableSelector: string,
  colIndex: number,
): Promise<string[]> {
  return page
    .locator(`${tableSelector} .ant-table-tbody td:nth-child(${colIndex})`)
    .allTextContents();
}
