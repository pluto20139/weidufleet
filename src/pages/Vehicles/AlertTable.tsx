import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleAlerts } from '@/api/mock';

const alertNameMap: Record<string, string> = {
  // 4种故障类
  'VDC Fault': 'VDC故障报警',
  'CDCU Fault': 'CDCU故障报警',
  'BDCU Fault': 'BDCU故障报警',
  'ADAS Fault': 'ADAS故障报警',
  // 19种电池类
  'Low SOC': 'SOC过低报警',
  'High Temp': '电池高温报警',
  'SOC Jump': 'SOC跳变报警',
  'Charge Fault': '充电故障报警',
  'Temp Diff': '电池温差报警',
  'Over Voltage': '单体过压报警',
  'Under Voltage': '单体欠压报警',
  'Over Current': '过流报警',
  'Insulation Fault': '绝缘故障报警',
  'BMS Comm Fault': 'BMS通信故障报警',
  'Cell Imbalance': '电芯不均衡报警',
  'Thermal Runaway': '热失控预警',
  'Charge Over Temp': '充电过温报警',
  'Discharge Over Temp': '放电过温报警',
  'SOC Calibration': 'SOC校准报警',
  'Heater Fault': '加热器故障报警',
  'Fan Fault': '风扇故障报警',
  'Sensor Fault': '传感器故障报警',
  'Contactor Fault': '接触器故障报警',
  'CAN Bus Fault': 'CAN总线故障报警',
};

const alertContentMap: Record<string, string> = {
  'CAN: VDC Fault': '车身稳定系统功能受限',
  'CAN: CDCU Fault': '座舱车机系统通信故障',
  'CAN: BDCU Fault': '车身域控制器通信故障',
  'CAN: ADAS Fault': '高级辅助驾驶系统功能受限',
  'CAN: Temp Diff': '电芯温差过大',
  'CAN: High Temp': '电池包温度过高',
  'CAN: Low SOC': '电池电量过低',
  'CAN: SOC Jump': 'SOC突变异常',
  'CAN: Charge Fault': '充电异常中断',
  'CAN: Over Voltage': '单体电压超过上限',
  'CAN: Under Voltage': '单体电压低于下限',
  'CAN: Over Current': '放电电流超过限制',
  'CAN: Insulation Fault': '绝缘电阻过低',
  'CAN: BMS Comm Fault': 'BMS通信中断',
  'CAN: Cell Imbalance': '电芯电压差异过大',
  'CAN: Thermal Runaway': '电池热失控风险',
  'CAN: Charge Over Temp': '充电时电池温度过高',
  'CAN: Discharge Over Temp': '放电时电池温度过高',
  'CAN: SOC Calibration': 'SOC需要重新校准',
  'CAN: Heater Fault': '电池加热器功能异常',
  'CAN: Fan Fault': '散热风扇运行异常',
  'CAN: Sensor Fault': '温度传感器数据异常',
  'CAN: Contactor Fault': '高压接触器状态异常',
  'CAN: CAN Bus Fault': 'CAN总线通信故障',
};

const AlertTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleAlerts(), []);
  const data = useMemo(() => rawData.map(r => ({
    ...r,
    alertName: alertNameMap[r.alert] || r.alert,
    alertContent: alertContentMap[r.content] || r.content,
  })), [rawData]);

  const columns = [
    { title: '预警名称', dataIndex: 'alertName', key: 'alertName' },
    { title: '预警内容', dataIndex: 'alertContent', key: 'alertContent' },
    { title: '预警时间', dataIndex: 'time', key: 'time' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default AlertTable;
