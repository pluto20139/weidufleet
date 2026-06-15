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

const AuditLog: React.FC = () => {
  const { t } = useTranslation();
  const allLogs = useMemo(() => getAuditLogs(), []);

  // Filter state
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [resultFilter, setResultFilter] = useState<string>('');

  // Operation type options from data
  const operationTypeOptions = useMemo(() => {
    const set = new Set(allLogs.map(l => l.operationType));
    return Array.from(set).map(v => ({ label: v, value: v }));
  }, [allLogs]);

  // Filtered data
  const filteredLogs = useMemo(() => {
    let result = allLogs;
    if (accountFilter) {
      const lower = accountFilter.toLowerCase();
      result = result.filter(l => l.account.toLowerCase().includes(lower));
    }
    if (typeFilter.length > 0) {
      result = result.filter(l => typeFilter.includes(l.operationType));
    }
    if (timeRange && timeRange[0] && timeRange[1]) {
      const start = timeRange[0].startOf('day');
      const end = timeRange[1].endOf('day');
      result = result.filter(l => {
        const d = dayjs(l.time);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    if (resultFilter && resultFilter !== 'all') {
      result = result.filter(l => l.result === resultFilter);
    }
    return result;
  }, [allLogs, accountFilter, typeFilter, timeRange, resultFilter]);

  const handleSearch = () => {
    // Validate time range span (max 180 days)
    if (timeRange && timeRange[0] && timeRange[1]) {
      const span = timeRange[1].diff(timeRange[0], 'day');
      if (span > 180) {
        message.warning(t('audit.max_range_180'));
        return;
      }
    }
    // Filtering is done via useMemo, this is just for validation
  };

  const handleReset = () => {
    setAccountFilter('');
    setTypeFilter([]);
    setTimeRange(null);
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
      title: t('audit.time_range'),
      dataIndex: 'time',
      key: 'time',
      width: 170,
    },
    {
      title: t('audit.nickname'),
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
      title: t('audit.ip'),
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: t('audit.operation_type'),
      dataIndex: 'operationType',
      key: 'operationType',
      width: 200,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('audit.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => {
        // 兆底脱敏17位VIN码
        let masked = text.replace(/[A-HJ-NPR-Z0-9]{17}/g, (m) => m.slice(0, 6) + '*******' + m.slice(-4));
        // 兆底脱敏车牌号（6-8位字母数字组合）
        masked = masked.replace(/\b[A-Z0-9]{6,8}\b/g, (m) => m.length > 4 ? m.slice(0, 2) + '*'.repeat(m.length - 4) + m.slice(-2) : m);
        return masked;
      },
    },
    {
      title: t('audit.result'),
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (v: string, record: AuditLogType) => {
        if (v === '\u6210\u529f') {
          return <Tag color="green">{t('audit.result_success')}</Tag>;
        }
        return (
          <Tooltip title={record.failReason ? `${t('audit.fail_reason')}: ${record.failReason}` : undefined}>
            <Tag color="red">{t('audit.result_fail')}</Tag>
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

      {/* Filter bar */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder={t('audit.account')}
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              maxLength={50}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder={t('audit.operation_type')}
              value={typeFilter}
              onChange={setTypeFilter}
              options={operationTypeOptions}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              showTime
              value={timeRange}
              onChange={(dates) => setTimeRange(dates as [Dayjs | null, Dayjs | null] | null)}
              disabledDate={disabledDate}
              style={{ width: '100%' }}
              placeholder={[t('audit.time_range'), t('audit.time_range')]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Select
                placeholder={t('audit.result')}
                value={resultFilter || undefined}
                onChange={v => setResultFilter(v || '')}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="all">{t('audit.result_all')}</Select.Option>
                <Select.Option value={'\u6210\u529f'}>{t('audit.result_success')}</Select.Option>
                <Select.Option value={'\u5931\u8d25'}>{t('audit.result_fail')}</Select.Option>
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
