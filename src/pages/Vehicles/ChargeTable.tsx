import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleChargeRecords } from '@/api/mock';
import { formatDuration } from '@/utils/format';

const ChargeTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleChargeRecords(), []);
  const data = useMemo(() => rawData.map(r => ({
    ...r,
    durationStr: formatDuration(r.duration),
  })), [rawData]);
  const columns = [
    { title: t('battery.charges', '累计充电次数'), dataIndex: 'count', key: 'count' },
    { title: t('battery.v', '电压'), dataIndex: 'v', key: 'v', render: (v: number) => `${v}V` },
    { title: t('battery.a', '电流'), dataIndex: 'a', key: 'a', render: (v: number) => `${v}A` },
    { title: t('battery.kw', '功率'), dataIndex: 'kw', key: 'kw', render: (v: number) => `${v}kW` },
    { title: t('battery.before', '充电前电量'), dataIndex: 'before', key: 'before', render: (v: number) => `${v}%` },
    { title: t('battery.after', '充电后电量'), dataIndex: 'after', key: 'after', render: (v: number) => `${v}%` },
    { title: t('battery.dur', '充电时长'), dataIndex: 'durationStr', key: 'durationStr' },
    { title: t('battery.time'), dataIndex: 'time', key: 'time' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default ChargeTable;
