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
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default BatteryTable;
