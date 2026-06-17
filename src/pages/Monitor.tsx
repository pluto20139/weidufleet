import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input, Select, DatePicker, Row, Col, Space, Typography, Checkbox, Tree, message, Tooltip, Slider, Tag } from 'antd';
import { SearchOutlined, PlayCircleOutlined, PauseCircleOutlined, CarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { getVehicles, getOnlineVehicles, getOfflineVehicles, getTrajectoryPoints, getTrips } from '@/api/mock';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatTime } from '@/utils/format';
import { maskVin, maskPlate, truncateLocation, matchVinSearch, matchPlateSearch } from '@/utils/masking';
import { disabledTrajectoryDate, isTrajectorySpanValid, getTrajectoryDateRange } from '@/utils/trajectory';
import LocationPrivacy from '../components/LocationPrivacy';

const { Title: Ttl, Text } = Typography;

const Monitor: React.FC = () => {
  const { t } = useTranslation();
  const _mt = useAppStore((s) => s._mt);
  const tenant = useAppStore((s) => s.tenant);

  const vehicles = useMemo(() => getVehicles(true), [tenant]);
  const onlineVehicles = useMemo(() => getOnlineVehicles(true), [tenant]);
  const trajectoryPoints = useMemo(() => getTrajectoryPoints(), []);
  const trips = useMemo(() => getTrips(true), [tenant]);

  const [plateFilter, setPlateFilter] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [trajSelectedVehicle, setTrajSelectedVehicle] = useState<string | null>(null);
  const [trajDateRange, setTrajDateRange] = useState<[import('dayjs').Dayjs | null, import('dayjs').Dayjs | null] | null>(null);

  const trajectoryPositions: [number, number][] = trajectoryPoints.map(p => [p.lat, p.lng]);
  const trajRef = useRef<HTMLDivElement>(null);

  // Trajectory playback
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= trajectoryPositions.length - 1) {
            setPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500 / playSpeed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [playing, trajectoryPositions.length, playSpeed]);

  const handlePlayToggle = () => {
    if (playing) {
      setPlaying(false);
    } else {
      if (currentIdx >= trajectoryPositions.length - 1) {
        setCurrentIdx(0);
      }
      setPlaying(true);
    }
  };

  useEffect(() => {
    if (_mt === 'playback' && trajRef.current) {
      trajRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [_mt]);

  // Hide the header card when _mt is used for tab switching
  const showLocation = _mt === 'location';
  const showPlayback = _mt === 'playback';

  // Enterprise tree data (filtered by search)
  const enterpriseTreeData = useMemo(() => {
    const filteredVehicles = vehicles.filter(v => {
      if (!plateFilter) return true;
      const lowerFilter = plateFilter.toLowerCase();
      return (
        v.plate.toLowerCase().includes(lowerFilter) ||
        v.vin.toLowerCase().includes(lowerFilter) ||
        matchPlateSearch(plateFilter, v.plate) ||
        matchVinSearch(plateFilter, v.vin) ||
        (v.tenant && v.tenant.toLowerCase().includes(lowerFilter))
      );
    });

    const groups: Record<string, typeof vehicles> = {};
    filteredVehicles.forEach((v) => {
      const tName = v.tenant || '未分配企业';
      if (!groups[tName]) {
        groups[tName] = [];
      }
      groups[tName].push(v);
    });

    return Object.entries(groups).map(([tName, list]) => ({
      title: `${tName} (${list.length})`,
      key: `tenant-${tName}`,
      children: list.map((v) => ({
        title: <span>{maskPlate(v.plate)} <span style={{ color: '#999', fontSize: 12 }}>{maskVin(v.vin)}</span> <Tag color={v.status === '在线' ? 'green' : 'default'} style={{ fontSize: 10 }}>{v.status}</Tag></span>,
        key: `vehicle-${v.vin}`,
        isLeaf: true,
      })),
    }));
  }, [vehicles, plateFilter]);

  // Filter vehicles based on selection
  const displayedVehicles = selectedVehicles.length > 0
    ? vehicles.filter(v => selectedVehicles.includes(v.vin))
    : [];

  // Location section
  const locationSection = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space>
          <Input placeholder="搜索企业名称/VIN码" maxLength={20} value={plateFilter} onChange={(e) => setPlateFilter(e.target.value)} style={{ width: 240 }} />
          <Button type="primary" icon={<SearchOutlined />}>{t('common.search')}</Button>
        </Space>
      </Card>
      <Row gutter={16}>
        <Col flex="280px">
          <Card size="small" title={t('biz.tenant_hierarchy', '企业组织树')} style={{ marginBottom: 8 }}>
            <Tree
               checkable
              defaultExpandAll
              treeData={enterpriseTreeData}
              onCheck={(checkedKeys) => {
                const vehicleKeys = (checkedKeys as string[]).filter(k => k.startsWith('vehicle-'));
                const vins = vehicleKeys.map(k => k.replace('vehicle-', ''));
                setSelectedVehicles(vins);
              }}
              style={{ maxHeight: 500, overflowY: 'auto' }}
            />
          </Card>
        </Col>
        <Col flex="auto">
          <Card size="small">
            <div style={{ height: 600 }}>
              <MapContainer center={[-33.45, -70.65]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {(displayedVehicles.length > 0 ? displayedVehicles : onlineVehicles).map((v) => (
                <CircleMarker key={v.vin} center={[v.lat, v.lng]} radius={7} pathOptions={{ color: '#52c41a', fillColor: '#52c41a', fillOpacity: 0.7 }}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 8 }}>
                        {maskPlate(v.plate)}
                      </div>
                      <div><strong>VIN:</strong> {maskVin(v.vin)}</div>
                      <div><strong>{t('biz.tenant_name', '企业名称')}:</strong> {v.tenant || '智利物流集团'}</div>
                      <div><strong>{t('veh.device_name', '设备名称')}:</strong> {v.deviceName || 'OBD网关'}</div>
                      <div><strong>{t('monitor.device_status', '设备状态')}:</strong> {v.status}</div>
                      <div><strong>{t('monitor.current_speed', '当前车速')}:</strong> {Math.floor(Math.random() * 80)} km/h</div>
                      <div><strong>{t('monitor.report_time', '数据上报时间')}:</strong> {formatTime(Date.now())}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Trajectory section — redesigned modern playback UI
  const trajectorySection = (
    <div ref={trajRef}>
      {/* Filter bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e5e7eb' }} size="small">
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder={t('veh.plate')}
            value={trajSelectedVehicle || ''}
            onChange={(e) => setTrajSelectedVehicle(e.target.value)}
            style={{ width: 200 }}
            prefix={<CarOutlined style={{ color: '#9ca3af' }} />}
          />
          <DatePicker.RangePicker
            disabledDate={disabledTrajectoryDate}
            value={trajDateRange}
            onChange={(dates) => setTrajDateRange(dates as any)}
            placeholder={[t('trajectory.start_date'), t('trajectory.end_date')]}
            style={{ width: 320 }}
            size="middle"
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => {
            if (trajDateRange && trajDateRange[0] && trajDateRange[1] && !isTrajectorySpanValid(trajDateRange[0], trajDateRange[1])) {
              message.warning(t('trajectory.max_span_3d'));
              return;
            }
          }} style={{ borderRadius: 6 }}>{t('common.search')}</Button>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('trajectory.query_limit_10d')}</Text>
        </Space>
      </Card>

      {/* Middle section: side-by-side vehicle list + map */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {/* Left: Vehicle List (20%) */}
        <Card
          size="small"
          title={<span style={{ fontSize: 13, fontWeight: 600 }}><CarOutlined style={{ marginRight: 6, color: '#4f46e5' }} />{t('monitor.vehicle_list', '车辆列表')}</span>}
          style={{ width: '20%', height: 500, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: '100%', overflowY: 'auto', padding: '4px 0' }}>
            {vehicles.map((v) => (
              <div key={v.vin} onClick={() => setTrajSelectedVehicle(v.plate)}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
                  fontWeight: trajSelectedVehicle === v.plate ? 600 : 400,
                  color: trajSelectedVehicle === v.plate ? '#4f46e5' : '#374151',
                  background: trajSelectedVehicle === v.plate ? '#eef2ff' : 'transparent',
                  borderLeft: trajSelectedVehicle === v.plate ? '3px solid #4f46e5' : '3px solid transparent',
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => { if (trajSelectedVehicle !== v.plate) (e.currentTarget.style.background = '#f8fafc'); }}
                onMouseLeave={(e) => { if (trajSelectedVehicle !== v.plate) (e.currentTarget.style.background = 'transparent'); }}
              >
                <Space size={4}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>●</span>
                  {maskPlate(v.plate)}
                </Space>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Map container (80%) */}
        <div style={{ width: '80%', height: 500, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative' }}>
          <MapContainer center={[-33.44, -70.65]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={trajectoryPositions} pathOptions={{ color: '#4f46e5', weight: 3, opacity: 0.8 }} />
            {currentIdx > 0 && currentIdx < trajectoryPositions.length && (
              <Marker position={trajectoryPositions[currentIdx]!}>
                <LTooltip permanent>
                  <span>● {t('monitor.speed')}: {Math.floor(30 + Math.random() * 40)}km/h</span>
                </LTooltip>
              </Marker>
            )}
            {trajectoryPositions.length > 0 && (
              <>
                <Marker position={trajectoryPositions[0]!}>
                  <LTooltip permanent><span style={{ color: '#22c55e', fontWeight: 600 }}>{t('monitor.start', '起点')}</span></LTooltip>
                </Marker>
                <Marker position={trajectoryPositions[trajectoryPositions.length - 1]!}>
                  <LTooltip permanent><span style={{ color: '#ef4444', fontWeight: 600 }}>{t('monitor.end', '终点')}</span></LTooltip>
                </Marker>
              </>
            )}
          </MapContainer>

          {/* Playback Controller (bottom overlay) */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
            borderRadius: 10, padding: '10px 20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', gap: 14, minWidth: 420, justifyContent: 'center', zIndex: 1000,
          }}>
            <Button
              type="text"
              icon={playing ? <PauseCircleOutlined style={{ fontSize: 22, color: '#fff' }} /> : <PlayCircleOutlined style={{ fontSize: 22, color: '#fff' }} />}
              onClick={handlePlayToggle}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, width: 32 }}
            />
            <div style={{ width: 160 }}>
              <Slider
                min={0}
                max={Math.max(trajectoryPositions.length - 1, 1)}
                value={currentIdx}
                onChange={setCurrentIdx}
                tooltip={{ formatter: (v) => `${((v || 0) / Math.max(trajectoryPositions.length, 1) * 100).toFixed(0)}%` }}
                trackStyle={{ background: '#818cf8' }}
                handleStyle={{ borderColor: '#818cf8', background: '#818cf8' }}
                railStyle={{ background: 'rgba(255,255,255,0.2)' }}
              />
            </div>
            <Select value={playSpeed} onChange={setPlaySpeed} size="small" style={{ width: 64 }}
              dropdownStyle={{ minWidth: 64 }}>
              <Select.Option value={1}>1×</Select.Option>
              <Select.Option value={2}>2×</Select.Option>
              <Select.Option value={4}>4×</Select.Option>
              <Select.Option value={8}>8×</Select.Option>
            </Select>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, whiteSpace: 'nowrap' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {currentIdx}/{trajectoryPositions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Trip Data Table */}
      <Card style={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} size="small"
        title={<span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{t('monitor.trip_records', '行程记录')}</span>}>
        <Table dataSource={trips}
          columns={[
            { title: '车牌号', dataIndex: 'plate', key: 'plate', width: 100, render: (v: string) => maskPlate(v) },
            {
              title: '开始位置', dataIndex: 'startLocation', key: 'startLocation',
              width: 250, ellipsis: true,
              render: (v: string) => v ? <LocationPrivacy text={v} /> : '—'
            },
            {
              title: '结束位置', dataIndex: 'endLocation', key: 'endLocation',
              width: 250, ellipsis: true,
              render: (v: string) => v ? <LocationPrivacy text={v} /> : '—'
            },
            { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 170,
              render: (v: string) => v ? v.replace('T', ' ') : '—' },
            { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 170,
              render: (v: string) => v ? v.replace('T', ' ') : '—' },
            { title: '行驶时长', dataIndex: 'duration', key: 'duration', width: 100 },
            { title: '行驶里程', dataIndex: 'distance', key: 'distance', width: 100,
              render: (v: number) => v ? `${v}km` : '—' },
          ]}
          rowKey="id"
          size="middle"
          pagination={{ defaultPageSize: 5, pageSizeOptions: ['5', '10', '20'], showSizeChanger: true, size: 'small' }}
        />
      </Card>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>{t('sidebar.monitor')}</Ttl>
        <Text type="secondary">{showLocation ? t('monitor.location') : t('monitor.trajectory')}</Text>
      </div>
      {showLocation && (
        <Card style={{ borderRadius: 8 }}>
          {locationSection}
        </Card>
      )}
      {showPlayback && trajectorySection}
    </div>
  );
};

export default Monitor;
