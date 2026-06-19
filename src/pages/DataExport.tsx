import React, { useState, useEffect } from 'react';
import { Card, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import ExportRecordComponent from '../components/VehicleData/ExportRecordComponent';
import { getExportTasks } from '@/api/mock';
import type { ExportTask } from '@/types';

const DataExport: React.FC = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<ExportTask[]>([]);

  useEffect(() => {
    setRecords(getExportTasks());
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
