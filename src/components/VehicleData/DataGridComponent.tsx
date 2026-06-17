import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { maskPlate } from '@/utils/masking';

interface DataGridProps {
  loading: boolean;
  data: any[];
  selectedSignals: string[];
}

export const signalFormatter = (key: string, value: any) => {
  if (value === null || value === undefined) return '—';

  switch (key) {
    case 'soc':
    case 'soh':
      return `${value} %`;
    case 'total_voltage':
      return `${value} V`;
    case 'total_current':
      return `${value} A`;
    case 'max_temp':
      return `${value} ℃`;
    case 'insulation':
      return `${value} kΩ`;
    case 'charge_status':
      const chargeStatusMap: Record<number, string> = {
        0: '停车充电',
        1: '行车充电',
        2: '未充电',
        3: '充电完成'
      };
      return chargeStatusMap[value as number] || '未知';
    case 'temp_alert':
      return value ? '异常' : '正常';
    default:
      return value;
  }
};

const DataGridComponent: React.FC<DataGridProps> = ({ loading, data, selectedSignals }) => {

  const baseColumns: ColumnsType<any> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '车牌号',
      dataIndex: 'plate',
      key: 'plate',
      width: 120,
      render: (v: string) => maskPlate(v),
    },
    {
      title: '上报时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 160,
    }
  ];

  // Dynamic columns generation based on selected signals
  const dynamicColumns = selectedSignals.map(signalKey => {
    // Generate label from availableSignals logic or simple mapping
    const titleMap: Record<string, string> = {
      soc: 'SOC',
      soh: 'SOH',
      total_voltage: '总电压',
      total_current: '总电流',
      max_temp: '最高单体温度',
      insulation: '绝缘电阻',
      charge_status: '充电状态',
      temp_alert: '温度差异报警'
    };
    return {
      title: titleMap[signalKey] || signalKey,
      dataIndex: signalKey,
      key: signalKey,
      render: (val: any) => signalFormatter(signalKey, val)
    };
  });

  const columns = [...baseColumns, ...dynamicColumns];

  return (
    <Table 
      columns={columns} 
      dataSource={data} 
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
      size="middle"
    />
  );
};

export default DataGridComponent;
