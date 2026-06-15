import React, { useState, useMemo } from 'react';
import { Card, Pagination, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ExportOutlined } from '@ant-design/icons';
import VehicleTreeComponent from '../components/VehicleData/VehicleTreeComponent';
import FilterBarComponent from '../components/VehicleData/FilterBarComponent';
import DataGridComponent from '../components/VehicleData/DataGridComponent';
import type { Dayjs } from 'dayjs';
import { maskPlate } from '@/utils/masking';

const VehicleSignal: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Handlers
  const handleSearch = () => {
    if (selectedVehicles.length === 0 || !timeRange || selectedSignals.length === 0) {
      message.warning(t('vds.warning.incomplete_form'));
      return;
    }

    setLoading(true);
    // Mock API Call
    setTimeout(() => {
      // Generate some mock data
      const mockData = Array.from({ length: 50 }).map((_, idx) => {
        const record: any = {
          id: `row_${idx}`,
          timestamp: new Date().toISOString(),
          deviceId: `DEV_${Math.floor(Math.random() * 10000)}`,
          plate: ['京A88888', '京A88889', '京A88890', '京A88891', '京A88892'][idx % 5],
        };
        
        selectedSignals.forEach(sig => {
          if (sig === 'soc' || sig === 'soh') record[sig] = Math.floor(Math.random() * 100);
          else if (sig === 'total_voltage') record[sig] = (Math.random() * 400 + 400).toFixed(1);
          else if (sig === 'total_current') record[sig] = (Math.random() * 100 - 50).toFixed(1);
          else if (sig === 'max_temp') record[sig] = Math.floor(Math.random() * 60);
          else if (sig === 'insulation') record[sig] = Math.floor(Math.random() * 1000);
          else if (sig === 'charge_status') record[sig] = Math.floor(Math.random() * 4);
          else if (sig === 'temp_alert') record[sig] = Math.random() > 0.9;
        });

        // Add some random nulls to test fallback
        if (Math.random() > 0.95 && selectedSignals.length > 0) {
          const firstSig = selectedSignals[0];
          if (firstSig) record[firstSig] = null;
        }

        return record;
      });

      setData(mockData);
      setTotal(500); // mock total
      setLoading(false);
    }, 800);
  };

  const handleReset = () => {
    setSelectedVehicles([]);
    setTimeRange(null);
    setSelectedSignals([]);
    setData([]);
    setTotal(0);
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (selectedVehicles.length === 0 || !timeRange || selectedSignals.length === 0) {
      message.warning(t('vds.warning.incomplete_form'));
      return;
    }
    // Simulate export triggering
    message.success(t('vds.toast.exporting'));
  };

  // V1.2: display data with masked plate (export keeps raw data)
  const displayData = useMemo(() =>
    data.map(row => ({ ...row, plate: row.plate ? maskPlate(row.plate) : row.plate })),
    [data]
  );

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      {/* Left Sidebar */}
      <Card 
        style={{ width: 280, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden' }}
      >
        <VehicleTreeComponent 
          selectedVehicles={selectedVehicles} 
          onChange={setSelectedVehicles} 
        />
      </Card>

      {/* Right Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <FilterBarComponent
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              selectedSignals={selectedSignals}
              onSignalsChange={setSelectedSignals}
              onSearch={handleSearch}
              onReset={handleReset}
            />
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
              {t('vds.export_excel')}
            </Button>
          </div>
        </Card>
        
        <Card style={{ flex: 1 }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DataGridComponent 
              loading={loading}
              data={displayData}
              selectedSignals={selectedSignals}
            />
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#666' }}>
              {t('vds.total_records', { total: total })}
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
                handleSearch();
              }}
              showSizeChanger
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VehicleSignal;
