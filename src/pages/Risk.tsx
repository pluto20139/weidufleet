import { useState, useMemo, useEffect } from 'react';
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
  'VDC': 'VDC故障报警',
  'CDCU': 'CDCU故障报警',
  'BDCU': 'BDCU故障报警',
  'ADAS': 'ADAS故障报警',
  'DC-DC温度': 'DC-DC温度报警',
  'DC-DC状态': 'DC-DC状态报警',
  '驱动电机控制器温度': '驱动电机控制器温度报警',
  '驱动电机温度': '驱动电机温度报警',
  '高压互锁状态': '高压互锁状态报警',
};

const batteryTypeLabels: Record<string, string> = {
  'SOC过低': 'SOC过低报警',
  '电池高温': '电池高温报警',
  'SOC跳变': 'SOC跳变报警',
  '充电故障': '充电故障报警',
  '温差报警': '温差报警',
  '储能过压': '储能过压报警',
  '储能欠压': '储能欠压报警',
  '单体过压': '单体过压报警',
  '单体欠压': '单体欠压报警',
  'SOC过高': 'SOC过高报警',
  '储能不匹配': '储能不匹配报警',
  '单体一致性差': '单体一致性差报警',
  '绝缘报警': '绝缘报警',
  '储能过充': '储能过充报警',
};

const fenceTypeMap: Record<string, string> = {
  'in': '入栏预警',
  'out': '出栏预警',
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
  const tenant = useAppStore((s) => s.tenant);
  const vehicles = useMemo(() => getVehicles(), [tenant]);

  // Detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailAlert, setDetailAlert] = useState<FenceAlert | null>(null);

  // Fence tab state
  const [fencePlate, setFencePlate] = useState('');
  const [fenceType, setFenceType] = useState<string | undefined>();
  const [fenceData, setFenceData] = useState(() => getFenceAlerts());

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

  // Computed filtered data based on filter states
  const filteredFence = useMemo(() => {
    let data = fenceData;
    if (fencePlate) data = data.filter(a => a.plate.toLowerCase().includes(fencePlate.toLowerCase()));
    if (fenceType) data = data.filter(a => a.type === fenceType);
    return data;
  }, [fenceData, fencePlate, fenceType]);

  const filteredFault = useMemo(() => {
    let data = faultData;
    if (faultPlate) data = data.filter(a => a.plate.toLowerCase().includes(faultPlate.toLowerCase()));
    if (faultPlatform) data = data.filter(a => a.type === faultPlatform);
    if (faultStatus) data = data.filter(a => a.status === faultStatus);
    return data;
  }, [faultData, faultPlate, faultPlatform, faultStatus]);

  const filteredBattery = useMemo(() => {
    let data = batData;
    if (batPlate) data = data.filter(a => a.plate.toLowerCase().includes(batPlate.toLowerCase()));
    if (batType) data = data.filter(a => a.type === batType);
    if (batStatus) data = data.filter(a => a.status === batStatus);
    return data;
  }, [batData, batPlate, batType, batStatus]);

  useEffect(() => {
    setFenceData(getFenceAlerts());
    setFaultData(getFaultAlerts());
    setBatData(getBatteryAlerts());
  }, [tenant]);

  // Refresh alert data when window regains focus (e.g. returning from Repair page)
  useEffect(() => {
    const onFocus = () => {
      setFaultData(getFaultAlerts());
      setBatData(getBatteryAlerts());
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleRepairFault = (record: FaultAlert) => {
    addRepairItem(record.plate, record.vin || '', '故障类', `${record.type} abnormal`, record.id, 'fault');
    setFaultData(prev => prev.map(a => a.id === record.id ? { ...a, status: 'WorkOrder' } : a));
    message.success(t('toast.created', '已生成维修工单'));
  };

  const handleRepairBattery = (record: BatteryAlert) => {
    addRepairItem(record.plate, record.vin || '', '电池类', `${record.type} abnormal`, record.id, 'battery');
    setBatData(prev => prev.map(a => a.id === record.id ? { ...a, status: 'WorkOrder' } : a));
    message.success(t('toast.created', '已生成维修工单'));
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
    { title: t('risk.alert_content', '预警内容'), dataIndex: 'content', key: 'content' },
    { title: t('risk.alert_time'), dataIndex: 'time', key: 'time' },
    {
      title: t('risk.status', '预警状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          Pending: t('risk.pending', '未处理'),
          WorkOrder: t('risk.repairing', '维修中'),
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
            {'一键报修'}
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
      title: t('risk.status', '预警状态'),
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
          WorkOrder: t('risk.repairing', '维修中'),
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
        dataSource={filteredFence}
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
            <Option value="VDC">VDC故障报警</Option>
            <Option value="CDCU">CDCU故障报警</Option>
            <Option value="BDCU">BDCU故障报警</Option>
            <Option value="ADAS">ADAS故障报警</Option>
            <Option value="DC-DC温度">DC-DC温度报警</Option>
            <Option value="DC-DC状态">DC-DC状态报警</Option>
            <Option value="驱动电机控制器温度">驱动电机控制器温度报警</Option>
            <Option value="驱动电机温度">驱动电机温度报警</Option>
            <Option value="高压互锁状态">高压互锁状态报警</Option>
          </Select>
          <Select
            placeholder={t('risk.status', '预警状态')}
            value={faultStatus}
            onChange={setFaultStatus}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="Pending">{t('risk.pending', '未处理')}</Option>
            <Option value="WorkOrder">维修中</Option>
            <Option value="Fixed">{t('risk.fixed', '维修完成')}</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
          <Button onClick={() => { setFaultPlate(''); setFaultPlatform(undefined); setFaultStatus(undefined); }}>
            {t('common.reset')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={filteredFault}
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
            <Option value="SOC过低">SOC过低报警</Option>
            <Option value="电池高温">电池高温报警</Option>
            <Option value="SOC跳变">SOC跳变报警</Option>
            <Option value="充电故障">充电故障报警</Option>
            <Option value="温差报警">温差报警</Option>
            <Option value="储能过压">储能过压报警</Option>
            <Option value="储能欠压">储能欠压报警</Option>
            <Option value="单体过压">单体过压报警</Option>
            <Option value="单体欠压">单体欠压报警</Option>
            <Option value="SOC过高">SOC过高报警</Option>
            <Option value="储能不匹配">储能不匹配报警</Option>
            <Option value="单体一致性差">单体一致性差报警</Option>
            <Option value="绝缘报警">绝缘报警</Option>
            <Option value="储能过充">储能过充报警</Option>
          </Select>
          <Select
            placeholder={t('risk.status', '预警状态')}
            value={batStatus}
            onChange={setBatStatus}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="Pending">{t('risk.pending', '未处理')}</Option>
            <Option value="WorkOrder">维修中</Option>
            <Option value="Fixed">{t('risk.fixed', '维修完成')}</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
          <Button onClick={() => { setBatPlate(''); setBatType(undefined); setBatStatus(undefined); }}>
            {t('common.reset')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={filteredBattery}
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
        title={t('risk.fence_detail_title', '预警详情页')}
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
                  <Descriptions.Item label={t('risk.alert_speed', '预警时车速')}>{alertSpeed} km/h</Descriptions.Item>
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
