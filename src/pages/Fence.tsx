import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Table, Button, Input, Select, Tag, Switch, Form, InputNumber, Space, message,
  Popconfirm, Row, Col, Modal, Radio, DatePicker
} from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { SearchOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Circle, useMapEvents, Marker, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FenceItem } from '@/types';
import { getVehicles } from '@/api/mock';
import { maskVin, maskPlate, truncateLocation, matchVinSearch, matchPlateSearch } from '@/utils/masking';
import { useAppStore } from '@/store/useAppStore';
import LocationPrivacy from '../components/LocationPrivacy';

// --- Types & Mock Data ---
interface ExtFenceItem extends FenceItem {
  polygon?: [number, number][];
  radius?: number;
  center?: [number, number];
  operator?: string;
}

const genFences = (): ExtFenceItem[] => {
  const base = [
    { name: '圣地亚哥中心仓库', type: 'center' as const, vehicles: ['KLTX51', 'KLTX52'], alertType: '出栏报警' as const, address: '智利圣地亚哥解放者大道1500号', center: [-33.45, -70.65] as [number, number], radius: 3000 },
    { name: '瓦尔帕莱索港区', type: 'custom' as const, vehicles: ['KLTX53'], alertType: '入栏报警' as const, address: '— —', polygon: [[-33.04, -71.62], [-33.05, -71.60], [-33.03, -71.61]] as [number, number][] },
    { name: '马伊普物流园', type: 'center' as const, vehicles: ['KLTX54', 'KLTX55'], alertType: '出栏报警' as const, address: '智利圣地亚哥马伊普区工业大道200号', center: [-33.48, -70.72] as [number, number], radius: 2000 },
    { name: '拉斯孔德斯商务区', type: 'center' as const, vehicles: ['KLTX56'], alertType: '入栏报警' as const, address: '智利圣地亚哥拉斯孔德斯区', center: [-33.41, -70.57] as [number, number], radius: 1500 },
    { name: '兰卡瓜维修站', type: 'custom' as const, vehicles: ['KLTX57', 'KLTX58'], alertType: '出栏报警' as const, address: '— —', polygon: [[-34.07, -70.72], [-34.08, -70.70], [-34.06, -70.71]] as [number, number][] },
  ];
  const result: ExtFenceItem[] = [];
  for (let i = 0; i < 50; i++) {
    const b = base[i % base.length]!;
    result.push({
      id: `f${i + 1}`,
      name: i < base.length ? b.name : `${b.name}${Math.floor(i / base.length) + 1}`,
      type: b.type,
      vehicles: b.vehicles,
      alertType: b.alertType,
      status: i % 3 === 0 ? '未生效' : '生效中',
      address: b.address,
      operator: 'Admin',
      time: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      center: b.center,
      radius: b.radius,
      polygon: b.polygon,
    });
  }
  return result;
};

let initialFences: ExtFenceItem[] = genFences();

const allVehicles = getVehicles();

// --- Map Event Handlers ---
const MapClickHandler: React.FC<{
  type: 'center' | 'custom';
  onCenterChange: (coord: [number, number]) => void;
  onPolygonAdd: (coord: [number, number]) => void;
}> = ({ type, onCenterChange, onPolygonAdd }) => {
  useMapEvents({
    click: (e) => {
      if (type === 'center') {
        onCenterChange([e.latlng.lat, e.latlng.lng]);
      } else {
        onPolygonAdd([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

const Fence: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppStore((s) => s.user);
  const [fences, setFences] = useState<ExtFenceItem[]>(initialFences);
  const [viewMode, setViewMode] = useState<'list' | 'config-vehicles' | 'edit-fence'>('list');
  const [selectedFence, setSelectedFence] = useState<ExtFenceItem | null>(null);

  // Filters for List
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Filters for Vehicle Config
  const [vehVinFilter, setVehVinFilter] = useState('');
  const [vehPlateFilter, setVehPlateFilter] = useState('');
  const [addVehModalOpen, setAddVehModalOpen] = useState(false);
  const [addVehSelected, setAddVehSelected] = useState<string[]>([]);

  // States for Edit Fence
  const [form] = Form.useForm();
  const [fenceType, setFenceType] = useState<'center' | 'custom'>('center');
  const [fenceCenter, setFenceCenter] = useState<[number, number]>([-33.45, -70.65]);
  const [fenceRadius, setFenceRadius] = useState<number>(1000);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [isViewing, setIsViewing] = useState(false);

  // === LIST VIEW LOGIC ===
  const filteredFences = useMemo(() => {
    let result = fences;
    if (nameFilter) result = result.filter(f => f.name.includes(nameFilter));
    if (typeFilter) result = result.filter(f => f.type === typeFilter);
    if (statusFilter) result = result.filter(f => f.status === statusFilter);
    if (timeRange && timeRange[0] && timeRange[1]) {
      const start = timeRange[0];
      const end = timeRange[1];
      result = result.filter(f => {
        const t = dayjs(f.time);
        return t.isAfter(start.startOf('minute')) && t.isBefore(end.endOf('minute'));
      });
    }
    return result;
  }, [fences, nameFilter, typeFilter, statusFilter, timeRange]);

  const handleDeleteFence = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据无法恢复，是否继续？',
      onOk: () => {
        setFences(prev => prev.filter(f => f.id !== id));
        message.success(t('toast.deleted'));
      },
    });
  };

  const handleToggleStatus = (id: string, checked: boolean) => {
    setFences(prev => prev.map(f => f.id === id ? { ...f, status: checked ? '生效中' as const : '未生效' as const } : f));
    message.success(checked ? t('fence.activated') : t('fence.deactivated'));
  };

  // === VEHICLE CONFIG LOGIC ===
  const currentFenceVehicles = useMemo(() => {
    if (!selectedFence) return [];
    return selectedFence.vehicles.map(plate => {
      const v = allVehicles.find(v => v.plate === plate);
      return { plate, vin: v?.vin || '—', addTime: '2026-06-01 10:00' };
    }).filter(v => 
      (!vehVinFilter || matchVinSearch(v.vin, vehVinFilter)) &&
      (!vehPlateFilter || matchPlateSearch(v.plate, vehPlateFilter))
    );
  }, [selectedFence, vehVinFilter, vehPlateFilter, fences]);

  const handleDeleteVehicle = (plate: string) => {
    if (!selectedFence) return;
    setFences(prev => prev.map(f => f.id === selectedFence.id ? { ...f, vehicles: f.vehicles.filter(p => p !== plate) } : f));
    setSelectedFence(prev => prev ? { ...prev, vehicles: prev.vehicles.filter(p => p !== plate) } : null);
    message.success(t('toast.deleted'));
  };

  const handleAddVehicles = () => {
    if (!selectedFence) return;
    const newVehs = Array.from(new Set([...selectedFence.vehicles, ...addVehSelected]));
    setFences(prev => prev.map(f => f.id === selectedFence.id ? { ...f, vehicles: newVehs } : f));
    setSelectedFence(prev => prev ? { ...prev, vehicles: newVehs } : null);
    message.success(t('toast.saved'));
    setAddVehModalOpen(false);
    setAddVehSelected([]);
  };

  // === EDIT FENCE LOGIC ===
  const handleOpenEdit = (fence?: ExtFenceItem, viewOnly = false) => {
    setIsViewing(viewOnly);
    if (fence) {
      form.setFieldsValue({
        name: fence.name,
        type: fence.type,
        alertType: fence.alertType,
        address: fence.type === 'custom' ? undefined : fence.address,
        radius: (fence.radius || 1000) / 1000,
      });
      setFenceType(fence.type);
      setFenceCenter(fence.center || [-33.45, -70.65]);
      setFenceRadius(fence.radius || 1000);
      setPolygonPoints(fence.polygon || []);
      setSelectedFence(fence);
    } else {
      form.resetFields();
      form.setFieldsValue({ type: 'center', alertType: '出栏报警', radius: 1000 });
      setFenceType('center');
      setFenceCenter([-33.45, -70.65]);
      setFenceRadius(1000);
      setPolygonPoints([]);
      setSelectedFence(null);
    }
    setViewMode('edit-fence');
  };

  const handleSaveFence = () => {
    form.validateFields().then(values => {
      // Custom fence closure validation
      if (values.type === 'custom') {
        if (polygonPoints.length < 3) {
          message.warning('围栏至少需要3个点位');
          return;
        }
        const first = polygonPoints[0]!;
        const last = polygonPoints[polygonPoints.length - 1]!;
        if (first[0] !== last[0] || first[1] !== last[1]) {
          message.warning('围栏点位未闭合，请确保首尾点位相同');
          return;
        }
      }
      const newFence: ExtFenceItem = {
        id: selectedFence?.id || `f${Date.now()}`,
        name: values.name,
        type: values.type,
        alertType: values.alertType,
        address: values.type === 'center' ? values.address : '— —',
        radius: (values.radius || 1) * 1000,
        status: selectedFence?.status || '生效中',
        vehicles: selectedFence?.vehicles || [],
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        center: fenceCenter,
        polygon: polygonPoints,
      };

      if (selectedFence) {
        setFences(prev => prev.map(f => f.id === selectedFence.id ? newFence : f));
      } else {
        setFences(prev => [newFence, ...prev]);
      }
      message.success(t('toast.saved'));
      setViewMode('list');
    });
  };

  // === RENDERERS ===

  if (viewMode === 'config-vehicles') {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => setViewMode('list')} style={{ padding: 0 }}>{t('trips.back_to_list', '返回')}</Button>
          <h2 style={{ margin: '8px 0 0' }}>{t('fence.config_vehicles')} - {selectedFence?.name}</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Space>
              <Input placeholder={t('veh.plate')} value={vehPlateFilter} onChange={e => setVehPlateFilter(e.target.value)} />
              <Input placeholder="VIN" value={vehVinFilter} onChange={e => setVehVinFilter(e.target.value)} />
            </Space>
            <Button type="primary" onClick={() => setAddVehModalOpen(true)}>{t('common.add')}</Button>
          </div>
        </Card>
        <Card>
          <Table
            dataSource={currentFenceVehicles}
            rowKey="plate"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: t('tenant.index', '序号'), render: (_, __, i) => i + 1 },
              { title: t('veh.vin'), dataIndex: 'vin', render: (v: string) => maskVin(v) },
              { title: t('veh.plate'), dataIndex: 'plate', render: (v: string) => maskPlate(v) },
              { title: t('fence.time', '添加时间'), dataIndex: 'addTime' },
              {
                title: t('common.action'),
                render: (_, r) => (
                  <Popconfirm title={t('common.action') + '?'} onConfirm={() => handleDeleteVehicle(r.plate)}>
                    <Button type="link" danger>{t('fence.action.del')}</Button>
                  </Popconfirm>
                )
              }
            ]}
          />
        </Card>
        <Modal
          title={t('fence.select_vehicles')}
          open={addVehModalOpen}
          onCancel={() => setAddVehModalOpen(false)}
          onOk={handleAddVehicles}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            placeholder={t('fence.select_vehicles')}
            value={addVehSelected}
            onChange={setAddVehSelected}
            options={allVehicles.filter(v => !selectedFence?.vehicles.includes(v.plate)).map(v => ({ label: `${maskPlate(v.plate)} (${maskVin(v.vin)})`, value: v.plate }))}
          />
        </Modal>
      </div>
    );
  }

  if (viewMode === 'edit-fence') {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => setViewMode('list')} style={{ padding: 0 }}>{t('trips.back_to_list', '返回')}</Button>
          <h2 style={{ margin: '8px 0 0' }}>{isViewing ? t('fence.view') : selectedFence ? t('fence.action.edit') : t('fence.action.new')}</h2>
        </div>
        <Row gutter={16} align="stretch">
          <Col xs={24} lg={8} style={{ display: 'flex' }}>
            <Card style={{ width: '100%' }}>
              <Form form={form} layout="vertical" disabled={isViewing}>
                <Form.Item name="name" label={t('fence.name')} rules={[{ required: true, max: 30 }]}>
                  <Input placeholder={t('fence.name')} maxLength={30} />
                </Form.Item>
                <Form.Item name="type" label={t('fence.type')} rules={[{ required: true }]}>
                  <Radio.Group onChange={e => setFenceType(e.target.value)}>
                    <Radio value="center">{t('fence.center')}</Radio>
                    <Radio value="custom">{t('fence.custom')}</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="alertType" label={t('fence.alert_type')} rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value="出栏报警">{t('fence.exit')}</Radio>
                    <Radio value="入栏报警">{t('fence.entry')}</Radio>
                  </Radio.Group>
                </Form.Item>
                {fenceType === 'center' && (
                  <>
                    <Form.Item name="address" label={t('fence.address')} rules={[{ required: true }]}>
                      <Input placeholder={t('fence.address_placeholder')} />
                    </Form.Item>
                    <Form.Item name="radius" label={t('fence.radius')} rules={[{ required: true }]}>
                      <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} onChange={v => setFenceRadius((v || 1) * 1000)} />
                    </Form.Item>
                  </>
                )}
                {!isViewing && (
                  <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Button type="primary" onClick={handleSaveFence}>{t('common.save')}</Button>
                    <Button onClick={() => setViewMode('list')}>{t('common.cancel')}</Button>
                    {fenceType === 'custom' && (
                      <>
                        <Button onClick={() => setPolygonPoints(prev => prev.slice(0, -1))}>{t('common.next', '上一步')}</Button>
                        <Button onClick={() => setPolygonPoints([])}>{t('common.reset')}</Button>
                      </>
                    )}
                  </div>
                )}
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={16} style={{ display: 'flex' }}>
            <Card bodyStyle={{ padding: 0, height: '100%' }} style={{ width: '100%' }}>
              <div style={{ height: 600, width: '100%' }}>
                <MapContainer center={[-33.45, -70.65]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {!isViewing && <MapClickHandler 
                    type={fenceType} 
                    onCenterChange={c => { setFenceCenter(c); const addr = `智利圣地亚哥首都大区圣地亚哥市解放者大道${Math.floor(Math.abs(c[0]) * 1000)}号`; form.setFieldsValue({ address: truncateLocation(addr) }); }}
                    onPolygonAdd={c => setPolygonPoints(prev => [...prev, c])}
                  />}
                  {fenceType === 'center' && <Circle center={fenceCenter} radius={fenceRadius} pathOptions={{ color: '#1677ff', fillColor: '#1677ff', fillOpacity: 0.2 }} />}
                  {fenceType === 'center' && <Marker position={fenceCenter} />}
                  {fenceType === 'custom' && polygonPoints.length > 0 && <Polygon positions={polygonPoints} pathOptions={{ color: '#1677ff', fillColor: '#1677ff', fillOpacity: 0.2 }} />}
                </MapContainer>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('title.fence')}</h2>
      </div>

      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input placeholder={t('fence.name')} value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
            <Select placeholder={t('fence.type')} allowClear style={{ width: 140 }} value={typeFilter} onChange={setTypeFilter} options={[{ value: 'center', label: t('fence.center') }, { value: 'custom', label: t('fence.custom') }]} />
            <Select placeholder={t('fence.status')} allowClear style={{ width: 140 }} value={statusFilter} onChange={setStatusFilter} options={[{ value: '生效中', label: t('fence.active') }, { value: '未生效', label: t('fence.inactive') }]} />
            <DatePicker.RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
              onChange={(dates) => setTimeRange(dates)}
              placeholder={['开始时间', '结束时间']}
            />
            <Button type="primary" icon={<SearchOutlined />}>{t('common.search')}</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenEdit()}>{t('fence.action.new')}</Button>
        </div>
      </Card>

      <Card>
        <Table
          rowKey="id"
          dataSource={filteredFences}
          pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
          columns={[
            { title: t('tenant.index', '序号'), render: (_, __, i) => i + 1, width: 60 },
            { title: t('fence.name'), dataIndex: 'name' },
            { title: t('fence.type'), dataIndex: 'type', render: (v) => <Tag color={v === 'center' ? 'blue' : 'orange'}>{v === 'center' ? t('fence.center') : t('fence.custom')}</Tag> },
            { title: t('fence.vehicles'), dataIndex: 'vehicles', render: (v, r) => <a onClick={() => { setSelectedFence(r); setViewMode('config-vehicles'); }}>{v.length} {t('common.records', '辆')}</a> },
            { title: t('fence.alert_type'), dataIndex: 'alertType' },
            { title: t('fence.status'), dataIndex: 'status', render: (v, r) => <Switch checked={v === '生效中'} checkedChildren={null} unCheckedChildren={null} onChange={c => handleToggleStatus(r.id, c)} /> },
            { title: t('fence.address'), dataIndex: 'address', render: (v, r) => r.type === 'center' ? truncateLocation(v) : '— —' },
            { title: t('repair.recorder', '操作人'), dataIndex: 'operator' },
            { title: t('fence.time', '添加时间'), dataIndex: 'time' },
            { title: t('common.action'),
              render: (_, r) => (
                <Space>
                  <Button type="link" size="small" onClick={() => handleOpenEdit(r, true)}>{t('fence.view')}</Button>
                  <Button type="link" size="small" onClick={() => handleOpenEdit(r, false)}>{t('fence.action.edit')}</Button>
                  <Button type="link" danger size="small" disabled={r.status === '生效中'} onClick={() => handleDeleteFence(r.id)}>{t('fence.action.del')}</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default Fence;
