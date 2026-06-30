import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input, Select, DatePicker, Space, Tag, Tooltip, Typography, Row, Col, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getAuditLogs } from '@/api/mock';
import type { AuditLog as AuditLogType } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 全量操作菜单枚举
const MENU_OPTIONS = [
  '账户', '首页看板', '车辆管理', '实时监控', '风控预警',
  '驾驶行为', '电池管理', '行程管理', '围栏管理', '维修管理',
  '租户管理', '业务管理', '车辆数据', '系统管理',
];

const AuditLog: React.FC = () => {
  const { t } = useTranslation();
  const allLogs = useMemo(() => getAuditLogs(), []);

  // 租户选项（从数据中提取去重）
  const tenantOptions = useMemo(() => {
    const set = new Set(allLogs.map(l => l.tenant));
    return Array.from(set).map(v => ({ label: v, value: v }));
  }, [allLogs]);

  // Filter state — 7项
  const [nicknameFilter, setNicknameFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState<string>(''); // '' means all
  const [menuFilter, setMenuFilter] = useState<string[]>([]);
  const [functionFilter, setFunctionFilter] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(7, 'day'), dayjs()]);
  const [resultFilter, setResultFilter] = useState<string>('');

  // 操作功能选项（根据操作菜单级联）
  const functionOptions = useMemo(() => {
    const allFunctions = allLogs.map(l => l.function).filter((v, i, a) => a.indexOf(v) === i);
    if (menuFilter.length === 0) {
      return allFunctions.map(v => ({ label: v, value: v }));
    }
    // 仅展示所选菜单下的功能
    return allLogs
      .filter(l => menuFilter.includes(l.menu))
      .map(l => l.function)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(v => ({ label: v, value: v }));
  }, [menuFilter, allLogs]);

  // Filtered data
  const filteredLogs = useMemo(() => {
    let result = allLogs;
    // 操作人筛选
    if (nicknameFilter) {
      const lower = nicknameFilter.toLowerCase();
      result = result.filter(l => l.nickname.toLowerCase().includes(lower));
    }
    // 操作账号筛选
    if (accountFilter) {
      const lower = accountFilter.toLowerCase();
      result = result.filter(l => l.account.toLowerCase().includes(lower));
    }
    // 所属租户筛选
    if (tenantFilter && tenantFilter !== 'all') {
      result = result.filter(l => l.tenant === tenantFilter);
    }
    // 操作菜单筛选
    if (menuFilter.length > 0) {
      result = result.filter(l => menuFilter.includes(l.menu));
    }
    // 操作功能筛选
    if (functionFilter.length > 0) {
      result = result.filter(l => functionFilter.includes(l.function));
    }
    // 时间范围筛选
    if (timeRange && timeRange[0] && timeRange[1]) {
      const start = timeRange[0].startOf('day');
      const end = timeRange[1].endOf('day');
      result = result.filter(l => {
        const d = dayjs(l.time);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    // 操作结果筛选
    if (resultFilter && resultFilter !== 'all') {
      result = result.filter(l => l.result === resultFilter);
    }
    // 按时间倒序
    return result.sort((a, b) => dayjs(b.time).unix() - dayjs(a.time).unix());
  }, [allLogs, nicknameFilter, accountFilter, tenantFilter, menuFilter, functionFilter, timeRange, resultFilter]);

  const handleSearch = () => {
    // Validate time range span (max 180 days)
    if (timeRange && timeRange[0] && timeRange[1]) {
      const span = timeRange[1].diff(timeRange[0], 'day');
      if (span > 180) {
        message.warning(t('audit.max_range_180'));
        return;
      }
    }
  };

  const handleReset = () => {
    setNicknameFilter('');
    setAccountFilter('');
    setTenantFilter('');
    setMenuFilter([]);
    setFunctionFilter([]);
    setTimeRange([dayjs().subtract(7, 'day'), dayjs()]);
    setResultFilter('');
  };

  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    return current.isBefore(dayjs().subtract(180, 'day'), 'day') || current.isAfter(dayjs(), 'day');
  };

  const columns: ColumnsType<AuditLogType> = [
    {
      title: t('audit.seq'),
      key: 'seq',
      width: 60,
      render: (_: unknown, __: AuditLogType, index: number) => index + 1,
    },
    {
      title: t('audit.time'),
      dataIndex: 'time',
      key: 'time',
      width: 170,
    },
    {
      title: t('audit.operator'),
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: t('audit.account'),
      dataIndex: 'account',
      key: 'account',
      width: 200,
    },
    {
      title: t('audit.tenant'),
      dataIndex: 'tenant',
      key: 'tenant',
      width: 150,
    },
    {
      title: t('audit.menu'),
      dataIndex: 'menu',
      key: 'menu',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('audit.function'),
      dataIndex: 'function',
      key: 'function',
      width: 120,
    },
    {
      title: t('audit.content'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: t('audit.result'),
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (v: string, record: AuditLogType) => {
        if (v === 'success') {
          return <Tag color="success">{t('audit.result_success')}</Tag>;
        }
        return (
          <Tooltip title={record.failReason ? `${t('audit.fail_reason')}: ${record.failReason}` : undefined}>
            <Tag color="error">{t('audit.result_fail')}</Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('title.audit_log')}</Title>
        <Text type="secondary">{t('audit.subtitle')}</Text>
      </div>

      {/* Filter bar — 7 items */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t('audit.filter.nickname')}
              value={nicknameFilter}
              onChange={e => setNicknameFilter(e.target.value)}
              maxLength={50}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t('audit.account')}
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              maxLength={50}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder={t('audit.filter.tenant')}
              value={tenantFilter || undefined}
              onChange={v => setTenantFilter(v || '')}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="all">{t('audit.tenant_all')}</Select.Option>
              {tenantOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              mode="multiple"
              placeholder={t('audit.filter.menu')}
              value={menuFilter}
              onChange={setMenuFilter}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
            >
              {MENU_OPTIONS.map(m => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              mode="multiple"
              placeholder={t('audit.filter.function')}
              value={functionFilter}
              onChange={setFunctionFilter}
              options={functionOptions}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              showTime
              value={timeRange as any}
              onChange={(dates) => setTimeRange(dates as [Dayjs | null, Dayjs | null] | null)}
              disabledDate={disabledDate}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Select
                placeholder={t('audit.result')}
                value={resultFilter || undefined}
                onChange={v => setResultFilter(v || '')}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="all">{t('audit.result_all')}</Select.Option>
                <Select.Option value="成功">{t('audit.result_success')}</Select.Option>
                <Select.Option value="失败">{t('audit.result_fail')}</Select.Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('common.search')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                {t('common.reset')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredLogs}
          scroll={{ x: 'max-content' }}
          pagination={{
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t('common.records')}`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AuditLog;
