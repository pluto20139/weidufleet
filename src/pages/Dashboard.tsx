import { useState, useMemo, useRef, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tabs, Tag } from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  AimOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getDashboardStats, getVehicles, getAlertRanking } from '@/api/mock';
import type { Vehicle } from '@/types';
import { formatTime } from '@/utils/format';
import { maskVin, maskPlate, truncateLocation } from '@/utils/masking';
import { useAppStore } from '@/store';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Title: Ttl } = Typography;

const statCardStyle = { borderRadius: 8, height: '100%' };

// Auto-fit map bounds to show all online vehicles
const MapBoundsUpdater: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length === 0) return;
    const bounds = vehicles.map(v => [v.lat, v.lng] as [number, number]);
    if (bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [50, 50] });
    }
  }, [vehicles, map]);
  return null;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [riskTab, setRiskTab] = useState<string>('today');
  const tenant = useAppStore((s) => s.tenant);

  const stats = useMemo(() => getDashboardStats(), [tenant]);
  const vehicles = useMemo(() => getVehicles(), [tenant]);
  const ranking = useMemo(() => getAlertRanking(), [tenant]);

  const chartData = useMemo(
    () => ({
      labels: [t('dash.adas_v1'), t('dash.adas_v2'), t('dash.adas_aeb'), t('dash.adas_p1'), t('dash.adas_p2'), t('dash.adas_paeb')],
      datasets: [
        {
          label: t('dash.alerts'),
          data: riskTab === 'today' ? [25, 30, 15, 15, 10, 5] : riskTab === '7d' ? [28, 27, 18, 12, 10, 5] : [30, 25, 20, 10, 10, 5],
          backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#059669', '#34d399', '#a7f3d0'],
          borderRadius: 4,
          maxBarThickness: 40,
        },
      ],
    }),
    [t, riskTab]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => ` ${context.parsed.y}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
          ticks: {
            callback: (value: any) => `${value}`,
          },
        },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  const rankingColumns = [
    { title: '序号', dataIndex: 'rank', key: 'rank', width: 50 },
    { title: t('rank.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: t('rank.drive'), dataIndex: 'drive', key: 'drive' },
    { title: t('rank.fence'), dataIndex: 'fence', key: 'fence' },
    { title: t('rank.fault'), dataIndex: 'fault', key: 'fault' },
    { title: t('rank.lowbat'), dataIndex: 'lowBat', key: 'lowBat' },
    { title: t('rank.total'), dataIndex: 'total', key: 'total' },
  ];

  const riskTabItems = [
    { key: 'today', label: t('dash.today') },
    { key: '7d', label: t('dash.7d') },
    { key: '30d', label: t('dash.30d') },
  ];

  const onlineVehicles = vehicles.filter((v) => v.status === 'online');

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>
          {t('title.dashboard')}
        </Ttl>
        <span style={{ color: '#888', fontSize: 13 }}>{t('dash.subtitle')}</span>
      </div>

      {/* Stats cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.total')}
              value={stats.totalVehicles}
              valueStyle={{ color: '#1677ff' }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.online')}
              value={stats.online}
              valueStyle={{ color: '#059669' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.offline')}
              value={stats.offline}
              valueStyle={{ color: '#dc2626' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.km_today')}
              value={stats.todayMileage}
              suffix={<span style={{ fontSize: 14, color: '#999', verticalAlign: 'middle' }}>km</span>}
              valueStyle={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.km_total')}
              value={stats.totalMileage}
              suffix={<span style={{ fontSize: 14, color: '#999', verticalAlign: 'middle' }}>km</span>}
              valueStyle={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
              prefix={<AimOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.alerts')}
              value={stats.todayAlerts}
              valueStyle={{ color: '#d97706' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.fence')}
              value={stats.fenceAlerts}
              valueStyle={{ color: '#d97706' }}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={3}>
          <Card style={statCardStyle}>
            <Statistic
              title={t('dash.low_bat')}
              value={stats.lowBatteryAlerts}
              valueStyle={{ color: '#dc2626' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts row: left chart, right map */}
      <Row gutter={16} style={{ marginTop: 24 }} align="stretch">
        <Col xs={24} lg={10}>
          <Card
            style={{ borderRadius: 8, height: '100%' }}
            title={
              <Tabs
                size="small"
                activeKey={riskTab}
                onChange={setRiskTab}
                items={riskTabItems}
                tabBarExtraContent={
                  <Ttl level={5} style={{ fontWeight: 600, fontSize: 15 }}>{t('dash.risk')}</Ttl>
                }
              />
            }
          >
            <div style={{ height: 500 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        {/* Live map - moved to right column */}
        <Col xs={24} lg={14}>
          <Card
            style={{ borderRadius: 8, height: '100%' }}
            title={<span style={{ fontWeight: 600 }}>{t('dash.map')}</span>}
          >
            <div style={{ height: 500, borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer
                center={[-33.45, -70.65]}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBoundsUpdater vehicles={onlineVehicles} />
                {onlineVehicles.map((v) => (
                  <CircleMarker
                    key={v.vin}
                    center={[v.lat, v.lng]}
                    radius={7}
                    pathOptions={{
                      color: v.soc < 20 ? '#dc2626' : '#2563eb',
                      fillColor: v.soc < 20 ? '#dc2626' : '#2563eb',
                      fillOpacity: 0.6,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 200 }}>
                        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 8 }}>
                          {maskPlate(v.plate)}
                        </div>
                        <div><strong>VIN:</strong> {maskVin(v.vin)}</div>
                        <div><strong>企业:</strong> {v.tenant || '智利物流集团'}</div>
                        <div><strong>设备名称:</strong> {v.deviceName || 'OBD网关'}</div>
                        <div><strong>设备状态:</strong> {v.status}</div>
                        <div><strong>行驶速度:</strong> {Math.floor(Math.random() * 80)} km/h</div>
                        <div><strong>SOC:</strong> {v.soc}%</div>
                        <div><strong>地址:</strong> {truncateLocation('智利圣地亚哥首都大区圣地亚哥市解放者大道1500号')}</div>
                        <div><strong>上报时间:</strong> {formatTime(Date.now())}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Ranking Table - moved below map */}
      <Card
        style={{ borderRadius: 8, marginTop: 16 }}
        title={<span style={{ fontWeight: 600 }}>{t('dash.ranking')}</span>}
      >
        <Table
          dataSource={ranking}
          columns={rankingColumns}
          rowKey="rank"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
