import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleDrivingEvents } from '@/api/mock';
import LocationPrivacy from '../../components/LocationPrivacy';

const driveAlertMap: Record<string, string> = {
  'L1 Vehicle': '对车一级预警',
  'L2 Urgent': '对车二级紧急预警',
  'AEB Brake': '对车AEB制动',
  'L1 Pedestrian': '对行人一级预警',
  'L2 Pedestrian': '对行人二级紧急预警',
  'AEB Pedestrian': '对行人AEB制动',
};

const drivingLocations = [
  '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号',
  '智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号',
  '智利奥伊金斯将军大区兰卡瓜市解放者大道901号',
  '智利马乌莱大区塔尔卡市一号公路789号',
  '智利比奥比奥大区康塞普西翁市自由大道456号',
  '智利科金博大区拉塞雷纳市教育路321号',
];

const DrivingTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleDrivingEvents(), []);
  const data = useMemo(() => rawData.map((r, i) => ({
    ...r,
    alertName: driveAlertMap[r.alert] || r.alert,
    speed: `${(r as any).speed || Math.floor(60 + Math.random() * 30)}km/h`,
    position: drivingLocations[i % drivingLocations.length]!,
  })), [rawData]);

  const columns = [
    { title: '预警类型', dataIndex: 'alertName', key: 'alertName' },
    { title: t('risk.alert_time', '预警时间'), dataIndex: 'time', key: 'time' },
    { title: '预警位置', dataIndex: 'position', key: 'position', render: (v: string) => <LocationPrivacy text={v} /> },
    { title: '行车速度', dataIndex: 'speed', key: 'speed' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default DrivingTable;
