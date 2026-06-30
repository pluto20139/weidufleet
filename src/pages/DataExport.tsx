import React, { useState, useEffect, useMemo } from 'react';
import { Card, Alert, DatePicker, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import ExportRecordComponent from '../components/VehicleData/ExportRecordComponent';
import { getExportTasks } from '@/api/mock';
import type { ExportTask } from '@/types';

const DataExport: React.FC = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<ExportTask[]>([]);
  const [timeRange, setTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(7, 'day'), dayjs()]);
  const [appliedTimeRange, setAppliedTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(7, 'day'), dayjs()]);

  useEffect(() => {
    setRecords(getExportTasks());
  }, []);

  const handleSearch = () => {
    setAppliedTimeRange(timeRange);
  };

  const handleReset = () => {
    const defaultRange: [Dayjs, Dayjs] = [dayjs().subtract(7, 'day'), dayjs()];
    setTimeRange(defaultRange);
    setAppliedTimeRange(defaultRange);
  };

  const filteredRecords = useMemo(() => {
    let result = records;
    if (appliedTimeRange && appliedTimeRange[0] && appliedTimeRange[1]) {
      const start = appliedTimeRange[0].startOf('day');
      const end = appliedTimeRange[1].endOf('day');
      result = result.filter(r => {
        const d = dayjs(r.createdAt);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    return result;
  }, [records, appliedTimeRange]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('sidebar.data_export')}</h2>
      </div>

      <Alert 
        message={t('vds.export_limit')} 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }} 
      />

      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <DatePicker.RangePicker 
            value={timeRange} 
            onChange={(dates) => setTimeRange(dates as any)}
            style={{ width: 320 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {t('common.reset')}
          </Button>
        </Space>
      </Card>

      <Card>
        <ExportRecordComponent data={filteredRecords} />
      </Card>
    </div>
  );
};

export default DataExport;
