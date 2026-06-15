import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Tabs, Tag, Button, Input, Select, Row, Col, Space, Typography, message, Modal, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { getVehicles, getFenceAlerts, getFaultAlerts, getBatteryAlerts, addRepairItem } from '@/api/mock';
import LocationPrivacy from '../components/LocationPrivacy';
import { maskVin, maskPlate, truncateLocation } from '@/utils/masking';
import type { FenceAlert, FaultAlert, BatteryAlert } from '@/types';
import { MapContainer, TileLayer, Circle, Marker, Tooltip as LTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const { Title: Ttl, Text } = Typography;
const { Option } = Select;

const faultTypeLabels: Record<string, string> = {
  'VDC': 'VDC故障',
  'CDCU': 'CDCU故障',
  'BDCU': 'BDCU故障',
  'ADAS': 'ADAS故障',
};

const batteryTypeLabels: Record<string, string> = {
  'SOC过低': 'SOC过低',
  '电池高温': '电池高温',
  'SOC跳变': 'SOC跳变',
  '充电故障': '充电故障',
  '温差报警': '温差报警',
};

const fenceTypeMap: Record<string, string> = {
  'in': '入栏报警',
  'out': '出栏报警',
};

const fenceAlertLocations = [
  '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街',
  '智利瓦尔帕莱索大区瓦尔帕莱索港码头',
  '智利瓦尔帕莱索大区比尼亚德尔马市海滨路',
  '智利奥伊金斯将军大区兰卡瓜市解放者大道',
  '智利马乌莱大区塔尔卡市一号公路',
  '智利比奥比奥大区康塞普西翁市自由大道',
  '智利科金博大区拉塞雷纳市教育路',
  '智利安托法加斯塔大区安托法加斯塔市矿业大道',
];

const fenceAlertCoords: [number, number][] = [
  [-33.4430, -70.6550],
  [-33.0400, -71.6270],
  [-33.0200, -71.5520],
  [-34.0830, -70.7170],
  [-35.4260, -71.6650],
  [-36.8270, -73.0500],
  [-29.9600, -71.3360],
  [-23.6500, -70.3970],
];

const Risk: React.FC = () => {
  const { t } = useTranslation();
  const _rt = useAppStore((s) => s._rt);
  const vehicles = getVehicles();

  // Detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailAlert, setDetailAlert] = useState<FenceAlert | null>(null);

  // Fence tab state
  const [fencePlate, setFencePlate] = useState('');
  const [fenceType, setFenceType] = useState<string | undefined>();
  const [fenceData] = useState(() => getFenceAlerts());

  // Fault tab state
  const [faultPlate, setFaultPlate] = useState('');
  const [faultPlatform, setFaultPlatform] = useState<string | undefined>();
  const [faultStatus, setFaultStatus] = useState<string | undefined>();
  const [faultData, setFaultData] = useState(() => getFaultAlerts());

  // Battery tab state
  const [batPlate, setBatPlate] = useState('');
  const [batType, setBatType] = useState<string | undefined>();
  const [batStatus, setBatStatus] = useState<string | undefined>();
  const [batData, setBatData] = useState(() => getBatteryAlerts());

  const handleRepairFault = (record: FaultAlert) => {
    addRepairItem(record.plate, record.vin || '', 'fault', `${record.type} abnormal`);
    setFaultData(prev => prev.map(a => a.id === record.id ? { ...a, status: 'WorkOrder' } : a));
    message.success(t('toast.created', '已生成工单'));
  };

  const handleRepairBattery = (record: BatteryAlert) => {
    addRepairItem(record.plate, record.vin || '', 'battery', `${record.type} abnormal`);
    setBatData(prev => prev.map(a => a.id === record.id ? { ...a, status: 'WorkOrder' } : a));
    message.success(t('toast.created', '已生成工单'));
  };

  const fenceColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.device', '设备ID'), dataIndex: 'device', key: 'device', render: (_: unknown, r: FenceAlert) => vehicles.find(v => v.vin === r.vin)?.device || '—' },
    {
      title: t('risk.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => fenceTypeMap[type] || type,
    },
    { title: t('risk.fence_name'), dataIndex: 'fence_name', key: 'fence_name' },
    { title: t('risk.alert_location'), dataIndex: 'location', key: 'location', render: (_: unknown, __: unknown, index: number) => <LocationPrivacy text={fenceAlertLocations[index % fenceAlertLocations.length]!} /> },
    { title: t('risk.alert_time'), dataIndex: 'time', key: 'time' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: FenceAlert) => (
        <Button type="link" size="small" onClick={() => {
          setDetailAlert(record);
          setDetailModalVisible(true);
        }}>
          {t('fence.view')}
        </Button>
      ),
    },
  ];

  const faultColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.device', '设备ID'), dataIndex: 'device', key: 'device' },
    {
      title: t('risk.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => faultTypeLabels[type] || type,
    },
    { title: t('risk.alert_content', '报警内容'), dataIndex: 'content', key: 'content' },
    { title: t('risk.alert_time'), dataIndex: 'time', key: 'time' },
    {
      title: t('risk.status', '报警状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          Pending: t('risk.pending', '未处理'),
          WorkOrder: '已生成工单',
          Fixed: t('risk.fixed', '维修完成'),
        };
        const colorMap: Record<string, string> = {
          Pending: 'orange',
          WorkOrder: 'blue',
          Fixed: 'green',
        };
        return <Tag color={colorMap[status] || 'default'}>{statusMap[status] || status}</Tag>;
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: FaultAlert) =>
        record.status === 'Pending' ? (
          <Button
            type="link"
            size="small"
            onClick={() => handleRepairFault(record)}
          >
            {t('fence.repair')}
          </Button>
        ) : null,
    },
  ];

  const batteryAlertColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.device', '设备ID'), dataIndex: 'device', key: 'device' },
    {
      title: t('risk.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => batteryTypeLabels[type] || type,
    },
    { title: t('risk.alert_content_battery', '预警内容'), dataIndex: 'content', key: 'content' },
    { title: t('risk.alert_time'), dataIndex: 'time', key: 'time' },
    {
      title: t('risk.status', '报警状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          Pending: 'orange',
          WorkOrder: 'blue',
          Fixed: 'green',
        };
        const statusMap: Record<string, string> = {
          Pending: t('risk.pending', '未处理'),
          WorkOrder: '已生成工单',
          Fixed: t('risk.fixed', '维修完成'),
        };
        return <Tag color={colorMap[status] || 'default'}>{statusMap[status] || status}</Tag>;
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: BatteryAlert) =>
        record.status === 'Pending' ? (
          <Button
            type="link"
            size="small"
            onClick={() => handleRepairBattery(record)}
          >
            {t('fence.repair')}
          </Button>
        ) : null,
    },
  ];

  const fenceTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={fencePlate}
            onChange={(e) => setFencePlate(e.target.value)}
            style={{ width: 160 }}
          />
          <Select
            placeholder={t('risk.type')}
            value={fenceType}
            onChange={setFenceType}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="in">{t('risk.fence_in')}</Option>
            <Option value="out">{t('risk.fence_out')}</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
          <Button onClick={() => { setFencePlate(''); setFenceType(undefined); }}>
            {t('common.reset')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={fenceData}
        columns={fenceColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );

  const faultTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={faultPlate}
            onChange={(e) => setFaultPlate(e.target.value)}
            style={{ width: 160 }}
          />
          <Select
            placeholder={t('risk.type')}
            value={faultPlatform}
            onChange={setFaultPlatform}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="VDC">VDC故障</Option>
            <Option value="CDCU">CDCU故障</Option>
            <Option value="BDCU">BDCU故障</Option>
            <Option value="ADAS">ADAS故障</Option>
          </Select>
          <Select
            placeholder={t('risk.status', '报警状态')}
            value={faultStatus}
            onChange={setFaultStatus}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="Pending">{t('risk.pending', '未处理')}</Option>
            <Option value="WorkOrder">已生成工单</Option>
            <Option value="Fixed">{t('risk.fixed', '维修完成')}</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={faultData}
        columns={faultColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );

  const batteryTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={batPlate}
            onChange={(e) => setBatPlate(e.target.value)}
            style={{ width: 160 }}
          />
          <Select
            placeholder={t('risk.type')}
            value={batType}
            onChange={setBatType}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="Low SOC">SOC过低</Option>
            <Option value="High Temp">电池高温</Option>
            <Option value="SOC Jump">SOC跳变</Option>
            <Option value="Charge Fault">充电故障</Option>
            <Option value="Temp Diff">温差报警</Option>
          </Select>
          <Select
            placeholder={t('risk.status', '报警状态')}
            value={batStatus}
            onChange={setBatStatus}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="Pending">{t('risk.pending', '未处理')}</Option>
            <Option value="WorkOrder">已生成工单</Option>
            <Option value="Fixed">{t('risk.fixed', '维修完成')}</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={batData}
        columns={batteryAlertColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );

  const tabTitleMap: Record<string, string> = {
    fence: t('risk.fence'),
    fault: t('risk.fault'),
    battery: t('risk.battery'),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>
          {t('sidebar.risk')}
        </Ttl>
        <Text type="secondary">{tabTitleMap[_rt] || t('risk.sub')}</Text>
      </div>

      {_rt === 'fence' && (
        <Card title={t('risk.fence')} style={{ borderRadius: 8, marginBottom: 16 }}>
          {fenceTab}
        </Card>
      )}
      {_rt === 'fault' && (
        <Card title={t('risk.fault')} style={{ borderRadius: 8, marginBottom: 16 }}>
          {faultTab}
        </Card>
      )}
      {_rt === 'battery' && (
        <Card title={t('risk.battery')} style={{ borderRadius: 8, marginBottom: 16 }}>
          {batteryTab}
        </Card>
      )}

      {/* Fence Alert Detail Modal */}
      <Modal
        title={t('risk.fence_detail_title', '报警详情页')}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={<Button onClick={() => setDetailModalVisible(false)}>{t('common.close')}</Button>}
        width={1000}
      >
        {detailAlert && (() => {
          const alertIdx = fenceData.findIndex(a => a.id === detailAlert.id);
          const coord = fenceAlertCoords[alertIdx >= 0 ? alertIdx % fenceAlertCoords.length : 0] || fenceAlertCoords[0]!;
          const alertSpeed = 40 + ((alertIdx >= 0 ? alertIdx : 0) * 7 + 3) % 60;
          return (
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t('veh.plate')}>{maskPlate(detailAlert.plate)}</Descriptions.Item>
                  <Descriptions.Item label="VIN">{maskVin(detailAlert.vin)}</Descriptions.Item>
                  <Descriptions.Item label={t('risk.fence_name')}>{detailAlert.fence_name}</Descriptions.Item>
                  <Descriptions.Item label={t('risk.alert_location')}>{truncateLocation(detailAlert.location)}</Descriptions.Item>
                  <Descriptions.Item label={t('risk.alert_time')}>{detailAlert.time}</Descriptions.Item>
                  <Descriptions.Item label={t('risk.alert_speed', '报警时车速')}>{alertSpeed} km/h</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <div style={{ height: 380, borderRadius: 8, overflow: 'hidden' }}>
                  <MapContainer center={coord} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                    <Marker position={coord}><LTooltip permanent>{t('risk.alert_location')}</LTooltip></Marker>
                    <Circle center={coord} radius={2000} pathOptions={{ color: '#ff4d4f', fillColor: '#ff4d4f', fillOpacity: 0.15 }} />
                  </MapContainer>
                </div>
                <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                  <div><strong>{t('risk.alert_time')}:</strong> {detailAlert.time}</div>
                  <div><strong>{t('risk.alert_location')}:</strong> {truncateLocation(fenceAlertLocations[alertIdx >= 0 ? alertIdx % fenceAlertLocations.length : 0] || '')}</div>
                </div>
              </Col>
            </Row>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Risk;
