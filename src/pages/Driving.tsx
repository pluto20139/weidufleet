import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Tabs, Tag, Button, Input, Select, Row, Col, Modal, Space, Typography, Statistic, Descriptions, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { getVehicles, getDrivingAlerts, getDrivingReports } from '@/api/mock';
import LocationPrivacy from '../components/LocationPrivacy';
import { maskVin, maskPlate } from '@/utils/masking';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import type { DrivingReport } from '@/types';
import dayjs, { Dayjs } from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

const { Title: Ttl, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const alertTypeLabels: Record<string, string> = {
  '对车一级预警': '对车一级预警',
  '对车二级预警': '对车二级预警',
  '对车AEB制动': '对车AEB制动',
  '对人一级预警': '对人一级预警',
  '对人二级预警': '对人二级预警',
  '对人AEB制动': '对人AEB制动',
};

const Driving: React.FC = () => {
  const { t } = useTranslation();
  const _dt = useAppStore((s) => s._dt);
  const _dr = useAppStore((s) => s._dr);
  const setDr = useAppStore((s) => s.setDr);
  const tenant = useAppStore((s) => s.tenant);

  const vehicles = useMemo(() => getVehicles(), [tenant]);
  const drivingAlerts = useMemo(() => getDrivingAlerts(), [tenant]);
  const drivingReports = useMemo(() => getDrivingReports(), [tenant]);

  // Alert tab filters
  const [alertPlate, setAlertPlate] = useState('');
  const [alertType, setAlertType] = useState<string | undefined>();
  const [alertTimeRange, setAlertTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Report tab filters
  const [reportPlate, setReportPlate] = useState('');
  const [reportLevel, setReportLevel] = useState<string | undefined>();
  const [selectedWeek, setSelectedWeek] = useState<Dayjs | null>(dayjs().subtract(1, 'week'));
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailReport, setDetailReport] = useState<DrivingReport | null>(null);

  const getWeekNumber = (d: Dayjs) => {
    const date = new Date(d.valueOf());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const filteredAlerts = useMemo(() => {
    return drivingAlerts.filter((a) => {
      if (alertPlate && !a.plate.toLowerCase().includes(alertPlate.toLowerCase())) return false;
      if (alertType && alertType !== 'all' && a.type !== alertType) return false;
      if (alertTimeRange && alertTimeRange[0] && alertTimeRange[1]) {
        const t = new Date(a.time).getTime();
        const start = alertTimeRange[0].valueOf();
        const end = alertTimeRange[1].valueOf();
        if (t < start || t > end) return false;
      }
      return true;
    });
  }, [drivingAlerts, alertPlate, alertType, alertTimeRange]);

  const filteredReports = useMemo(() => {
    return drivingReports.filter((r) => {
      if (reportPlate && !r.plate.toLowerCase().includes(reportPlate.toLowerCase())) return false;
      if (reportLevel && reportLevel !== 'all') {
        let levelStr = '安全司机';
        if (r.risks > 6) levelStr = '高危司机';
        else if (r.risks > 3) levelStr = '中危司机';
        else if (r.risks > 1) levelStr = '低危司机';
        if (levelStr !== reportLevel) return false;
      }
      if (r.period.includes('W')) {
        if (selectedWeek) {
          const w = getWeekNumber(selectedWeek);
          const wStr = `${selectedWeek.year()}-W${String(w).padStart(2, '0')}`;
          if (r.period !== wStr) return false;
        }
      } else {
        if (selectedMonth) {
          const mStr = `${selectedMonth.year()}-${String(selectedMonth.month() + 1).padStart(2, '0')}`;
          if (r.period !== mStr) return false;
        }
      }
      return true;
    });
  }, [drivingReports, reportPlate, reportLevel, selectedWeek, selectedMonth]);

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

  const getLevelInfo = (risks: number) => {
    if (risks <= 1) return { text: t('driving.safe_text'), color: 'green' };
    if (risks <= 3) return { text: t('driving.low_text'), color: 'blue' };
    if (risks <= 6) return { text: t('driving.medium_text'), color: 'orange' };
    return { text: t('driving.high_text'), color: 'red' };
  };

  const reportColumns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    {
      title: t('driving.period'),
      dataIndex: 'period',
      key: 'period',
      render: (p: string) => {
        if (p.includes('W')) {
          const match = p.match(/(\d+)-W(\d+)/);
          if (match) {
            return t('driving.weekly_format', { defaultValue: '{{year}}年第{{week}}周', year: match[1], week: match[2] });
          }
        } else {
          const match = p.match(/(\d+)-(\d+)/);
          if (match) {
            return t('driving.monthly_format', { defaultValue: '{{year}}年{{month}}月', year: match[1], month: parseInt(match[2]!, 10) });
          }
        }
        return p;
      }
    },
    {
      title: t('driving.total_km', '行驶里程'),
      dataIndex: 'km',
      key: 'km',
      render: (v: number) => `${v}km`,
    },
    { title: t('driving.risks'), dataIndex: 'risks', key: 'risks' },
    {
      title: t('driving.level'),
      dataIndex: 'risks',
      key: 'level',
      render: (_: unknown, record: DrivingReport) => {
        const info = getLevelInfo(record.risks);
        return <Tag color={info.color}>{info.text}</Tag>;
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  };

  const disabledDateRange = (current: Dayjs) => {
    return current && (current > dayjs() || current < dayjs().subtract(1, 'year'));
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
            maxLength={8}
          />
          <Select
            placeholder={t('driving.risk_event', '风险事件')}
            value={alertType}
            onChange={setAlertType}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="all">{t('common.all')}</Option>
            <Option value="对车一级预警">{t('dash.adas_v1')}</Option>
            <Option value="对车二级预警">{t('dash.adas_v2')}</Option>
            <Option value="对车AEB制动">{t('dash.adas_aeb')}</Option>
            <Option value="对人一级预警">{t('dash.adas_p1')}</Option>
            <Option value="对人二级预警">{t('dash.adas_p2')}</Option>
            <Option value="对人AEB制动">{t('dash.adas_paeb')}</Option>
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
        dataSource={filteredAlerts}
        columns={alertColumns}
        rowKey="id"
        pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
        size="middle"
      />
    </div>
  );

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
          <Descriptions.Item label={t('veh.color', '外观')}>{vehicle?.color || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('veh.age', '车龄')}>{vehicle?.purchase ? `${new Date().getFullYear() - new Date(vehicle.purchase).getFullYear()}年` : '—'}</Descriptions.Item>
        </Descriptions>

        {/* Stats Row */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.cumulative_hours')} value={detailReport.cumulativeHours ?? +(detailReport.km / 65).toFixed(1)} suffix="h" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.total_km', '累计行驶里程')} value={detailReport.km} suffix="km" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.avg_daily')} value={detailReport.avgSpeed ?? +((detailReport.km / 7) * 65 / 100).toFixed(1)} suffix="km/h" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('driving.score')} value={detailReport.score} suffix="分" />
            </Card>
          </Col>
        </Row>

        {/* Charts Row: mileage trend + area distribution */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title={t('driving.mileage', '行驶里程趋势')} style={{ marginBottom: 16 }}>
              <div style={{ height: 180 }}>
                <Line data={{
                  labels: detailReport.mileageTrend?.map(m => m.date.slice(5)) || [t('driving.day_mon'), t('driving.day_tue'), t('driving.day_wed'), t('driving.day_thu'), t('driving.day_fri'), t('driving.day_sat'), t('driving.day_sun')],
                  datasets: [{
                    label: t('driving.mileage', '行驶里程'),
                    data: detailReport.mileageTrend?.map(m => m.km) || [85, 102, 78, 130, 95, 60, 110],
                    fill: true,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: '#2563eb',
                    pointRadius: 4,
                  }],
                }} options={chartOptions} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title={t('driving.area_distribution')} style={{ marginBottom: 16 }}>
              <div style={{ height: 180 }}>
                <Bar data={{
                  labels: detailReport.regionDistribution?.map(r => r.city.replace(/\s*\(.*\)$/, '')) || [t('city.santiago', '圣地亚哥'), t('city.valparaiso', '瓦尔帕莱索'), t('city.concepcion', '康塞普西翁'), t('city.rancagua', '兰卡瓜'), t('city.quillota', '基约塔')],
                  datasets: [{
                    label: t('driving.mileage', '行驶里程'),
                    data: detailReport.regionDistribution?.map(r => r.km) || [285, 120, 95, 60, 45],
                    backgroundColor: '#2563eb',
                    borderWidth: 0,
                  }],
                }} options={chartOptions} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Suggestions */}
        <Card size="small" title={t('driving.advice', '驾驶改善建议')} style={{ marginBottom: 16 }}>
          <div style={{ height: 120, overflowY: 'auto', padding: '4px 8px' }}>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {(detailReport.suggestions?.length ? detailReport.suggestions : (
                detailReport.score >= 80
                  ? ['继续保持良好驾驶习惯', '建议每两周查看一次报告']
                  : detailReport.score >= 60
                  ? ['注意控制车速，减少急加速/急减速', '建议每周查看一次报告']
                  : ['需要改善驾驶行为，频繁的急加速/急减速影响安全', '建议立即参加驾驶培训', '建议每日查看报告']
              )).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </Card>
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
              <DatePicker
                picker="week"
                placeholder="选择周"
                value={selectedWeek}
                onChange={setSelectedWeek}
                disabledDate={disabledDateRange}
                style={{ width: 160 }}
              />
              <Button type="primary" icon={<SearchOutlined />}>
                {t('common.search')}
              </Button>
            </Space>
          </Card>
          <Table
            dataSource={filteredReports.filter(r => r.period.includes('W'))}
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
              <DatePicker
                picker="month"
                placeholder="选择月"
                value={selectedMonth}
                onChange={setSelectedMonth}
                disabledDate={disabledDateRange}
                style={{ width: 160 }}
              />
              <Button type="primary" icon={<SearchOutlined />}>
                {t('common.search')}
              </Button>
            </Space>
          </Card>
          <Table
            dataSource={filteredReports.filter(r => !r.period.includes('W'))}
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
