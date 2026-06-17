import React, { useState, useEffect } from 'react';
import { Card, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import ExportRecordComponent from '../components/VehicleData/ExportRecordComponent';

const DataExport: React.FC = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for exports
    setRecords([
      {
        id: '1',
        filename: '车辆信号数据_V001_20260610.csv',
        filterSummary: '多车(2辆) | 1小时 | 8个信号',
        totalCount: null,
        createdAt: '2026-06-10 16:35:00',
        status: 'processing'
      },
      {
        id: '2',
        filename: '车辆信号数据_V005_20260609.csv',
        filterSummary: 'VIN: LFWDAU1... | 24小时 | 3个信号',
        totalCount: 27567,
        createdAt: '2026-06-09 09:12:33',
        status: 'completed'
      }
    ]);
  }, []);

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

      <Card>
        <ExportRecordComponent data={records} />
      </Card>
    </div>
  );
};

export default DataExport;
