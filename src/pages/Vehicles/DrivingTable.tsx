import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { getVehicleDrivingEvents } from '@/api/mock';

const driveAlertMap: Record<string, string> = {
  'L1 Vehicle': '对车一级预报警',
  'L2 Urgent': '对车二级紧急报警',
  'AEB Brake': '对车AEB制动',
  'L1 Pedestrian': '对行人一级预报警',
  'L2 Pedestrian': '对行人二级紧急报警',
  'AEB Pedestrian': '对行人AEB制动',
};

const driveContentMap: Record<string, string> = {
  'L1 Vehicle': '前方车辆距离较近，请注意',
  'L2 Urgent': '前方车辆紧急制动，请立即减速',
  'AEB Brake': 'AEB自动紧急制动已触发',
  'L1 Pedestrian': '前方行人检测预警',
  'L2 Pedestrian': '行人紧急危险，请立即制动',
  'AEB Pedestrian': 'AEB行人自动制动已触发',
};

const DrivingTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleDrivingEvents(), []);
  const data = useMemo(() => rawData.map((r, i) => ({
    ...r,
    alertName: driveAlertMap[r.alert] || r.alert,
    alertContent: driveContentMap[r.alert] || '—',
    speed: `${(r as any).speed || Math.floor(60 + Math.random() * 30)}km/h`,
  })), [rawData]);

  const columns = [
    { title: '预警名称', dataIndex: 'alertName', key: 'alertName' },
    { title: '预警内容', dataIndex: 'alertContent', key: 'alertContent' },
    { title: '车速', dataIndex: 'speed', key: 'speed' },
    { title: '预警时间', dataIndex: 'time', key: 'time' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="time" size="small" scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default DrivingTable;
