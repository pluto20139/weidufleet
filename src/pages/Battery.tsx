import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Tabs, Tag, Button, Input, Row, Col, Statistic, Modal, Descriptions, Space, Typography, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { getVehicles, getDashboardStats, getBatteryMonitorItems, getChargeRecords, getDischargeRecords, getDailyConsumption } from '@/api/mock';
import { formatDuration } from '@/utils/format';
import { maskVin, maskPlate } from '@/utils/masking';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { BatteryMonitorItem } from '@/types';
import type { Dayjs } from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const { Title: Ttl, Text } = Typography;

const Battery: React.FC = () => {
  const { t } = useTranslation();
  const _bt = useAppStore((s) => s._bt);

  const vehicles = getVehicles();
  const stats = useMemo(() => getDashboardStats(), []);
  const monitorItems = useMemo(() => getBatteryMonitorItems(), []);
  const chargeRecords = useMemo(() => getChargeRecords(), []);
  const dischargeData = useMemo(() => getDischargeRecords(), []);
  const dailyConsumption = useMemo(() => getDailyConsumption(30), []);

  // Monitor tab filters
  const [monPlate, setMonPlate] = useState('');

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<BatteryMonitorItem | null>(null);

  // Charge tab filters
  const [chargePlate, setChargePlate] = useState('');
  const [chargeDateRange, setChargeDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Discharge tab filters
  const [dischargePlate, setDischargePlate] = useState('');
  const [dischargeDateRange, setDischargeDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const consumptionChartData = {
    labels: Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 5, i + 1);
      return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: t('battery.kwh_100km', 'kWh/100km'),
        data: dailyConsumption,
        fill: true,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
    },
  };

  const monitorColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    {
      title: 'SOC',
      dataIndex: 'soc',
      key: 'soc',
      render: (v: number) => <span style={{ color: v <= 20 ? '#dc2626' : 'inherit', fontWeight: v <= 20 ? 600 : 400 }}>{v}%</span>,
    },
    { title: t('battery.health', '电池健康度'), dataIndex: 'soh', key: 'soh', render: (v: number) => `${v}%` },
    { title: t('battery.temp', '电池温度'), dataIndex: 'temp', key: 'temp', render: (v: number) => `${v}°C` },
    {
      title: t('battery.range'),
      dataIndex: 'range',
      key: 'range',
      render: (v: number) => `${v}km`,
    },
    { title: t('battery.charges', '累计充电次数'), dataIndex: 'charges', key: 'charges' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: BatteryMonitorItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setDetailItem(record);
            setDetailVisible(true);
          }}
        >
          {t('fence.detail')}
        </Button>
      ),
    },
  ];

  const chargeDischargeColumns = [
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: t('battery.v'), dataIndex: 'voltage', key: 'voltage', render: (v: number) => `${v}V` },
    { title: t('battery.a'), dataIndex: 'current', key: 'current', render: (v: number) => `${v}A` },
    { title: t('battery.kw'), dataIndex: 'power', key: 'power', render: (v: number) => `${v}kW` },
    { title: t('battery.before'), dataIndex: 'before', key: 'before', render: (v: number) => `${v}%` },
    { title: t('battery.after'), dataIndex: 'after', key: 'after', render: (v: number) => `${v}%` },
    { title: t('battery.dur'), dataIndex: 'duration', key: 'duration', render: (v: string) => formatDuration(v) },
    { title: t('battery.time'), dataIndex: 'time', key: 'time' },
  ];

  const dischargeColumns = [
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: t('battery.v'), dataIndex: 'voltage', key: 'voltage', render: (v: number) => `${v}V` },
    { title: t('battery.a'), dataIndex: 'current', key: 'current', render: (v: number) => `${v}A` },
    { title: t('battery.kw'), dataIndex: 'power', key: 'power', render: (v: number) => `${v}kW` },
    { title: t('battery.discharge_before'), dataIndex: 'before', key: 'before', render: (v: number) => `${v}%` },
    { title: t('battery.discharge_after'), dataIndex: 'after', key: 'after', render: (v: number) => `${v}%` },
    { title: '放电时长', dataIndex: 'duration', key: 'duration', render: (v: string) => formatDuration(v) },
    { title: t('battery.time'), dataIndex: 'time', key: 'time' },
  ];

  const monitorTab = (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title={t('battery.avg_soc')} value={stats.avgSoc} suffix="%" prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title={t('battery.avg_temp', '平均电池温度')} value={stats.avgTemp} suffix="°C" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title={t('battery.avg_range')} value={stats.avgRange} suffix="km" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title={t('battery.low_batt')}
              value={stats.lowBatteryAlerts}
              valueStyle={{ color: stats.lowBatteryAlerts > 0 ? '#dc2626' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={monPlate}
            onChange={(e) => setMonPlate(e.target.value)}
            style={{ width: 160 }}
          />
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setMonPlate(''); }}>
            {t('common.reset')}
          </Button>
        </Space>
      </Card>

      <Table
        dataSource={monitorItems}
        columns={monitorColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      <Modal
        title={`${t('battery.monitor', '电池监控')}详情页`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Button onClick={() => setDetailVisible(false)}>{t('common.close')}</Button>
        }
        width={640}
      >
        {detailItem && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="SOC" value={detailItem.soc} suffix="%" />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title={t('battery.health', '电池健康度')} value={detailItem.soh} suffix="%" />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title={t('battery.temp')} value={detailItem.temp} suffix="°C" />
                </Card>
              </Col>
            </Row>
            <Card size="small" title={t('battery.daily_consumption')}>
              <div style={{ height: 240 }}>
                <Line data={consumptionChartData} options={chartOptions} />
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );

  const chargeTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={chargePlate}
            onChange={(e) => setChargePlate(e.target.value)}
            style={{ width: 160 }}
          />
          <DatePicker.RangePicker
            value={chargeDateRange as any}
            onChange={(dates) => setChargeDateRange(dates as any)}
            format="YYYY-MM-DD"
          />
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={chargeRecords}
        columns={chargeDischargeColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );

  const dischargeTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={dischargePlate}
            onChange={(e) => setDischargePlate(e.target.value)}
            style={{ width: 160 }}
          />
          <DatePicker.RangePicker
            value={dischargeDateRange as any}
            onChange={(dates) => setDischargeDateRange(dates as any)}
            format="YYYY-MM-DD"
          />
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={dischargeData}
        columns={dischargeColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );

  const chargeTabItems = [
    { key: 'charge', label: t('battery.charge'), children: chargeTab },
    { key: 'discharge', label: t('battery.discharge'), children: dischargeTab },
  ];

  const tabTitleMap: Record<string, string> = {
    monitor: t('battery.monitor'),
    charge: t('battery.charge'),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>
          {t('sidebar.battery')}
        </Ttl>
        <Text type="secondary">{tabTitleMap[_bt] || t('battery.sub')}</Text>
      </div>
      <Card style={{ borderRadius: 8 }}>
        {_bt === 'monitor' && monitorTab}
        {_bt === 'charge' && (
          <Tabs activeKey={undefined} items={chargeTabItems} />
        )}
      </Card>
    </div>
  );
};

export default Battery;
