import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Tabs, Tag, Button, Input, Select, Row, Col, Modal, Space, Typography, Statistic, Descriptions, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { getVehicles, getDrivingAlerts, getDrivingReports } from '@/api/mock';
import LocationPrivacy from '../components/LocationPrivacy';
import { maskVin, maskPlate } from '@/utils/masking';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import type { DrivingReport } from '@/types';
import type { Dayjs } from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const { Title: Ttl, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const riskLevelColorMap: Record<string, string> = {
  '安全司机': 'green',
  '低危司机': 'blue',
  '中危司机': 'orange',
  '高危司机': 'red',
};

const alertTypeLabels: Record<string, string> = {
  'Rapid Accel': '急加速',
  'Hard Brake': '急减速',
  'Sharp Turn': '急转弯',
  'Fatigue': '疲劳驾驶',
  'AEB': 'AEB制动',
};

const Driving: React.FC = () => {
  const { t } = useTranslation();
  const _dt = useAppStore((s) => s._dt);
  const _dr = useAppStore((s) => s._dr);
  const setDr = useAppStore((s) => s.setDr);

  const vehicles = getVehicles();
  const drivingAlerts = useMemo(() => getDrivingAlerts(), []);
  const drivingReports = useMemo(() => getDrivingReports(), []);

  // Alert tab filters
  const [alertPlate, setAlertPlate] = useState('');
  const [alertType, setAlertType] = useState<string | undefined>();
  const [alertTimeRange, setAlertTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Report tab filters
  const [reportPlate, setReportPlate] = useState('');
  const [reportLevel, setReportLevel] = useState<string | undefined>();

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailReport, setDetailReport] = useState<DrivingReport | null>(null);

  const alertColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', width: 100, render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', width: 160, render: (v: string) => maskVin(v) },
    {
      title: t('driving.risk_event', '风险事件'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => alertTypeLabels[type] || type,
    },
    {
      title: t('driving.position'),
      dataIndex: 'position',
      key: 'position',
      width: 250,
      render: (_: unknown, __: unknown, index: number) => {
        const drivingLocations = [
          '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街',
          '智利瓦尔帕莱索大区瓦尔帕莱索港码头',
          '智利瓦尔帕莱索大区比尼亚德尔马市海滨路',
          '智利奥伊金斯将军大区兰卡瓜市解放者大道',
          '智利马乌莱大区塔尔卡市一号公路',
          '智利比奥比奥大区康塞普西翁市自由大道',
          '智利科金博大区拉塞雷纳市教育路',
          '智利安托法加斯塔大区安托法加斯塔市矿业大道',
        ];
        return <LocationPrivacy text={drivingLocations[index % drivingLocations.length]!} />;
      },
    },
    {
      title: t('driving.speed'),
      dataIndex: 'speed',
      key: 'speed',
      width: 100,
      render: (v: number) => `${v}km/h`,
    },
    { title: t('risk.alert_time', '预警时间'), dataIndex: 'time', key: 'time', width: 160 },
  ];

  const getLevelInfo = (score: number) => {
    if (score >= 80) return { text: t('driving.safe_text'), color: 'green' };
    if (score >= 60) return { text: t('driving.low_text'), color: 'blue' };
    if (score >= 40) return { text: t('driving.medium_text'), color: 'orange' };
    return { text: t('driving.high_text'), color: 'red' };
  };

  const reportColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('driving.period'), dataIndex: 'period', key: 'period' },
    {
      title: t('driving.total_km', '行驶里程'),
      dataIndex: 'km',
      key: 'km',
      render: (v: number) => `${v}km`,
    },
    { title: t('driving.risks'), dataIndex: 'risks', key: 'risks' },
    {
      title: t('driving.level'),
      dataIndex: 'score',
      key: 'level',
      render: (_: unknown, record: DrivingReport) => {
        const info = getLevelInfo(record.score);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'riskLevel',
      render: (v: string) => {
        const color = riskLevelColorMap[v] || 'default';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    {
      title: t('driving.score'),
      dataIndex: 'score',
      key: 'score',
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: DrivingReport) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setDetailReport(record);
            setDetailVisible(true);
          }}
        >
          {t('veh.detail')}
        </Button>
      ),
    },
  ];

  const mileageChartData = {
    labels: [t('driving.day_mon'), t('driving.day_tue'), t('driving.day_wed'), t('driving.day_thu'), t('driving.day_fri'), t('driving.day_sat'), t('driving.day_sun')],
    datasets: [
      {
        label: t('driving.mileage', '行驶里程'),
        data: [85, 102, 78, 130, 95, 60, 110],
        fill: true,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
      },
    ],
  };

  const dayNightChartData = {
    labels: [t('driving.daytime', '白天'), t('driving.nighttime', '夜间')],
    datasets: [
      {
        data: [65, 35],
        backgroundColor: ['#2563eb', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  // Weekly data for risk events line chart (Mon-Sun)
  const weeklyRiskData = {
    labels: [t('driving.day_mon'), t('driving.day_tue'), t('driving.day_wed'), t('driving.day_thu'), t('driving.day_fri'), t('driving.day_sat'), t('driving.day_sun')],
    datasets: [
      {
        label: t('driving.rapid_accel'),
        data: [3, 5, 2, 4, 6, 1, 2],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: t('driving.hard_brake'),
        data: [4, 3, 5, 2, 7, 2, 1],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: t('driving.sharp_turn'),
        data: [1, 2, 3, 0, 2, 1, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: t('driving.fatigue'),
        data: [0, 1, 0, 1, 2, 0, 0],
        borderColor: '#6b7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: t('driving.aeb'),
        data: [1, 0, 1, 0, 0, 1, 0],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
  };

  const alertTab = (
    <div>
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={alertPlate}
            onChange={(e) => setAlertPlate(e.target.value)}
            style={{ width: 160 }}
          />
          <Select
            placeholder={t('driving.risk_event', '风险事件')}
            value={alertType}
            onChange={setAlertType}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="all">{t('common.all')}</Option>
            <Option value="Rapid Accel">{t('dash.accl')}</Option>
            <Option value="Hard Brake">{t('dash.decel')}</Option>
            <Option value="Sharp Turn">{t('dash.turn')}</Option>
            <Option value="Fatigue">{t('dash.fatigue')}</Option>
            <Option value="AEB">{t('dash.aeb')}</Option>
          </Select>
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            onChange={(dates) => setAlertTimeRange(dates)}
            placeholder={['开始时间', '结束时间']}
          />
          <Button type="primary" icon={<SearchOutlined />}>
            {t('common.search')}
          </Button>
        </Space>
      </Card>
      <Table
        dataSource={drivingAlerts}
        columns={alertColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        size="middle"
      />
    </div>
  );

  const timePeriodChartData = {
    labels: [t('driving.morning'), t('driving.afternoon'), t('driving.evening'), t('driving.night')],
    datasets: [{
      label: t('driving.hours'),
      data: [4.5, 5.2, 2.1, 0.8],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#6366f1'],
      borderRadius: 4,
    }],
  };

  const areaChartData = {
    labels: ['圣地亚哥', '瓦尔帕莱索', '兰卡瓜', '康塞普西翁'],
    datasets: [{
      data: [285, 120, 95, 60],
      backgroundColor: ['#2563eb', '#f59e0b', '#22c55e', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const renderReportDetail = () => {
    if (!detailReport) return null;
    const vehicle = vehicles.find(v => v.vin === detailReport.vin);
    return (
      <div>
        {/* Vehicle Info */}
        <Descriptions column={3} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="VIN">{maskVin(detailReport.vin)}</Descriptions.Item>
          <Descriptions.Item label={t('veh.plate')}>{maskPlate(detailReport.plate)}</Descriptions.Item>
          <Descriptions.Item label={t('driving.period')}>{detailReport.period}</Descriptions.Item>
          <Descriptions.Item label={t('veh.model', '车型')}>{vehicle?.model || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('veh.color', '颜色')}>{vehicle?.color || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('veh.age', '车龄')}>{vehicle?.purchase ? `${new Date().getFullYear() - new Date(vehicle.purchase).getFullYear()}年` : '—'}</Descriptions.Item>
        </Descriptions>

        {/* Stats Row */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.cumulative_hours')} value={42.5} suffix="h" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.total_km', '行驶里程')} value={detailReport.km} suffix="km" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.avg_daily')} value={62} suffix="km/h" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.score')} value={detailReport.score} suffix="分" />
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title={t('driving.mileage', '行驶里程趋势')} style={{ marginBottom: 16 }}>
              <div style={{ height: 180 }}>
                <Line data={mileageChartData} options={chartOptions} />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title={'驾驶时间段占比'} style={{ marginBottom: 16 }}>
              <div style={{ height: 180 }}>
                <Doughnut data={dayNightChartData} options={doughnutOptions} />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title={t('driving.area_distribution')} style={{ marginBottom: 16 }}>
              <div style={{ height: 180 }}>
                <Bar data={areaChartData} options={chartOptions} />
              </div>
            </Card>
          </Col>
        </Row>

        <Card size="small" title={t('driving.risk_events')} style={{ marginBottom: 16 }}>
          <div style={{ height: 200 }}>
            <Line data={weeklyRiskData} options={lineChartOptions} />
          </div>
        </Card>
        <Text type="secondary" style={{ display: 'block', padding: '8px 0' }}>
          <strong>{t('driving.advice')}:</strong> {detailReport.score >= 80 ? t('driving.advice_good') : detailReport.score >= 60 ? t('driving.advice_low') : detailReport.score >= 40 ? t('driving.advice_medium') : t('driving.advice_high')}
        </Text>
      </div>
    );
  };

  const reportTab = (
    <div>
      <Modal
        title={`${t('driving.report_detail')} - ${detailReport?.plate || ''}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Button onClick={() => setDetailVisible(false)}>{t('common.close')}</Button>
        }
        width={900}
      >
        {renderReportDetail()}
      </Modal>
    </div>
  );

  const renderLevelSelect = () => (
    <Select
      placeholder={t('driving.level')}
      value={reportLevel}
      onChange={setReportLevel}
      style={{ width: 160 }}
      allowClear
    >
      <Option value="all">{t('common.all')}</Option>
      <Option value="安全司机">{t('driving.safe_text')}</Option>
      <Option value="低危司机">{t('driving.low_text')}</Option>
      <Option value="中危司机">{t('driving.medium_text')}</Option>
      <Option value="高危司机">{t('driving.high_text')}</Option>
    </Select>
  );

  const reportSubTabItems = [
    {
      key: 'week',
      label: t('driving.weekly'),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }} size="small">
            <Space wrap>
              <Input
                placeholder={t('veh.plate')}
                value={reportPlate}
                onChange={(e) => setReportPlate(e.target.value)}
                style={{ width: 160 }}
              />
              {renderLevelSelect()}
              <DatePicker picker="week" placeholder="选择周" style={{ width: 160 }} />
              <Button type="primary" icon={<SearchOutlined />}>
                {t('common.search')}
              </Button>
            </Space>
          </Card>
          <Table
            dataSource={drivingReports.filter(r => r.period.includes('W'))}
            columns={reportColumns}
            rowKey="id"
            pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
            size="middle"
          />
        </div>
      ),
    },
    {
      key: 'month',
      label: t('driving.monthly'),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }} size="small">
            <Space wrap>
              <Input
                placeholder={t('veh.plate')}
                value={reportPlate}
                onChange={(e) => setReportPlate(e.target.value)}
                style={{ width: 160 }}
              />
              {renderLevelSelect()}
              <DatePicker picker="month" placeholder="选择月" style={{ width: 160 }} />
              <Button type="primary" icon={<SearchOutlined />}>
                {t('common.search')}
              </Button>
            </Space>
          </Card>
          <Table
            dataSource={drivingReports.filter(r => !r.period.includes('W'))}
            columns={reportColumns}
            rowKey="id"
            pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
            size="middle"
          />
        </div>
      ),
    },
  ];

  const tabTitleMap: Record<string, string> = {
    alert: t('driving.alert'),
    report: t('driving.report'),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>
          {t('sidebar.driving')}
        </Ttl>
        <Text type="secondary">{tabTitleMap[_dt] || t('driving.sub')}</Text>
      </div>
      <Card style={{ borderRadius: 8 }}>
        {_dt === 'alert' && alertTab}
        {_dt === 'report' && (
          <>
            {reportTab}
            <Tabs activeKey={_dr} onChange={setDr} items={reportSubTabItems} />
          </>
        )}
      </Card>
    </div>
  );
};

export default Driving;
