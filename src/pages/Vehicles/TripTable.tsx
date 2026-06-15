import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleTrips } from '@/api/mock';
import LocationPrivacy from '../../components/LocationPrivacy';

const chileLocs = [
  '智利圣地亚哥首都大区解放者大道1449号',
  '智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号',
  '智利圣地亚哥马伊普区工业大道5500号',
  '智利圣地亚哥拉斯孔德斯区商业大道3200号',
  '智利瓦尔帕莱索大区基略塔市中央大道345号',
  '智利奥伊金斯将军大区兰卡瓜市解放者大道901号',
];

const TripTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleTrips(), []);
  const data = useMemo(() => rawData.map((r, i) => ({
    ...r,
    startLoc: chileLocs[i % chileLocs.length],
    endLoc: chileLocs[(i + 1) % chileLocs.length],
  })), [rawData]);
  const columns = [
    { title: t('trips.start_time', '开始时间'), dataIndex: 'start', key: 'start' },
    { title: t('trips.end_time', '结束时间'), dataIndex: 'end', key: 'end' },
    { title: t('trip.start_location', '起点'), dataIndex: 'startLoc', key: 'startLoc', render: (v: string) => <LocationPrivacy text={v} /> },
    { title: t('trip.end_location', '终点'), dataIndex: 'endLoc', key: 'endLoc', render: (v: string) => <LocationPrivacy text={v} /> },
    { title: t('trips.km', '行驶里程'), dataIndex: 'km', key: 'km', render: (v: number) => `${v}km` },
    { title: t('trips.duration', '行驶时长'), dataIndex: 'duration', key: 'duration' },
    { title: t('trips.avg_speed', '平均速度'), dataIndex: 'avgSpeed', key: 'avgSpeed', render: (v: number) => `${v}km/h` },
    { title: t('trip.alerts', '预警次数'), dataIndex: 'alerts', key: 'alerts', render: (v: number) => v },
  ];
  return <Table dataSource={data} columns={columns} scroll={{ x: 'max-content' }} rowKey={(r: any, i: number | undefined) => `${r.start}-${i ?? 0}`} size="small" pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default TripTable;
