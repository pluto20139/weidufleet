import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleBatteryRecords } from '@/api/mock';
import type { Vehicle } from '@/types';

const BatteryTable: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const { t } = useTranslation();
  const data = useMemo(() => getVehicleBatteryRecords(vehicle), [vehicle]);
  const columns = [
    { title: 'SOC', dataIndex: 'soc', key: 'soc', render: (v: number) => `${v}%` },
    { title: t('battery.health', '电池健康度'), dataIndex: 'soh', key: 'soh', render: (v: number) => `${v}%` },
    { title: t('battery.temp', '电池温度'), dataIndex: 'temp', key: 'temp', render: (v: number) => `${v}°C` },
    { title: t('battery.range', '续航里程'), dataIndex: 'range', key: 'range', render: (v: number) => `${v}km` },
    { title: t('battery.daily_consumption', '日均电耗'), dataIndex: 'dailyConsumption', key: 'dailyConsumption', render: (v: number) => `${v} kWh/100km` },
    {
      title: t('battery.charging_status', '充电状态'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const map: Record<string, string> = {
          charging: t('battery.status.charging', '充电中'),
          idle: t('battery.status.idle', '未充电'),
          preparing: t('battery.status.preparing', '准备充电'),
          discharging: t('battery.status.discharging', '对方放电'),
          fault: t('battery.status.fault', '故障&异常'),
        };
        return map[v] || v;
      },
    },
    { title: t('common.record_time', '记录时间'), dataIndex: 'time', key: 'time' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default BatteryTable;
