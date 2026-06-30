export const faultTypeLabels: Record<string, string> = {
  'VDC': 'VDC故障报警',
  'CDCU': 'CDCU故障报警',
  'BDCU': 'BDCU故障报警',
  'ADAS': 'ADAS故障报警',
  'DC-DC温度': 'DC-DC 温度报警',
  'DC-DC状态': 'DC-DC 状态报警',
  '驱动电机控制器温度': '驱动电机控制器温度报警',
  '驱动电机温度': '驱动电机温度报警',
  '高压互锁状态': '高压互锁状态报警',
};

export const batteryTypeLabels: Record<string, string> = {
  'SOC过低': 'SOC低报警',
  '电池高温': '电池高温报警',
  'SOC跳变': 'SOC 跳变报警',
  '充电故障': '充电故障报警',
  '温差报警': '温度差异报警',
  '储能过压': '车载储能装置过压报警',
  '储能欠压': '车载储能装置欠压报警',
  '单体过压': '单体电池过压报警',
  '单体欠压': '单体电池欠压报警',
  'SOC过高': 'SOC 过高报警',
  '储能不匹配': '可充电储能系统不匹配报警',
  '单体一致性差': '电池单体一致性差报警',
  '绝缘报警': '绝缘报警',
  '储能过充': '车载储能装置类型过充',
};

export const faultLabel = (type: string) => faultTypeLabels[type] || type;
export const batteryLabel = (type: string) => batteryTypeLabels[type] || type;
