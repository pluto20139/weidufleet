import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store';
import {
  Typography,
  Row,
  Col,
  Card,
  Table,
  Input,
  InputNumber,
  Button,
  Space,
  Tag,
  Tabs,
  Descriptions,
  Modal,
  Upload,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { getVehicles } from '@/api/mock';
import type { Vehicle } from '@/types';
import { calculateAge } from '@/utils/format';
import { maskVin, maskPlate, matchVinSearch, matchPlateSearch, truncateLocation } from '@/utils/masking';
import LocationPrivacy from '../components/LocationPrivacy';
import AlertTable from './Vehicles/AlertTable';
import DrivingTable from './Vehicles/DrivingTable';
import BatteryTable from './Vehicles/BatteryTable';
import ChargeTable from './Vehicles/ChargeTable';
import TripTable from './Vehicles/TripTable';
import RepairTable from './Vehicles/RepairTable';
import MileageChart from './Vehicles/MileageChart';

const { Title: Ttl, Text } = Typography;

/* ======== LIST VIEW ======== */

const ListView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const _vf = useAppStore((s) => s._vf);
  const setVf = useAppStore((s) => s.setVf);

  const [vinVal, setVinVal] = useState('');
  const [plateVal, setPlateVal] = useState('');
  const [deviceVal, setDeviceVal] = useState('');
  const [batteryVerVal, setBatteryVerVal] = useState('');
  const [minAgeVal, setMinAgeVal] = useState<number | null>(null);
  const [maxAgeVal, setMaxAgeVal] = useState<number | null>(null);
  const [filtered, setFiltered] = useState<Vehicle[] | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; details?: string[] } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  const tenant = useAppStore((s) => s.tenant);
  const allVehicles = useMemo(() => getVehicles(), [tenant]);

  const handleSearch = useCallback(() => {
    const filteredList = allVehicles.filter((v) => {
      const matchVin = !vinVal || matchVinSearch(vinVal, v.vin);
      const matchPlate = !plateVal || matchPlateSearch(plateVal, v.plate);
      const matchDevice = !deviceVal || v.device.toLowerCase().includes(deviceVal.toLowerCase());
      const matchBattery = !batteryVerVal || (v.batteryVersion && v.batteryVersion.toLowerCase().includes(batteryVerVal.toLowerCase()));
      const age = calculateAge(v.purchase);
      const matchMinAge = minAgeVal === null || age >= minAgeVal;
      const matchMaxAge = maxAgeVal === null || age <= maxAgeVal;
      return matchVin && matchPlate && matchDevice && matchBattery && matchMinAge && matchMaxAge;
    });
    setFiltered(filteredList);
    setVf({ vin: vinVal, plate: plateVal, device: deviceVal, batteryVer: batteryVerVal, minAge: minAgeVal, maxAge: maxAgeVal });
  }, [vinVal, plateVal, deviceVal, batteryVerVal, minAgeVal, maxAgeVal, allVehicles, setVf]);

  const handleReset = useCallback(() => {
    setVinVal('');
    setPlateVal('');
    setDeviceVal('');
    setBatteryVerVal('');
    setMinAgeVal(null);
    setMaxAgeVal(null);
    setFiltered(null);
    setVf({});
  }, [setVf]);

  const handleDownloadTemplate = () => {
    const headers = 'VIN,Plate,Color,Model,Purchase';
    const sample = 'LJ8T7AD0000100000,KLTX55,蓝色,苇渡E700,2025-06-15';
    const blob = new Blob(['\uFEFF' + headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importFile) {
      message.warning(t('common.click_upload'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        message.error('文件内容为空');
        return;
      }

      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length <= 1) {
        message.error('文件无有效数据');
        return;
      }

      const headers = lines[0]!.split(',').map(h => h.trim().toUpperCase());
      const vinIdx = headers.indexOf('VIN');
      const plateIdx = headers.indexOf('PLATE');
      const colorIdx = headers.indexOf('COLOR');
      const modelIdx = headers.indexOf('MODEL');
      const purchaseIdx = headers.indexOf('PURCHASE');

      if (vinIdx === -1) {
        message.error('CSV文件首行必须包含 VIN 列');
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const details: string[] = [];
      const seenVins = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i]!.split(',').map(cell => cell.trim());
        const vin = row[vinIdx] || '';
        const plate = plateIdx !== -1 ? row[plateIdx] || '' : '';
        const color = colorIdx !== -1 ? row[colorIdx] || '' : '';
        const model = modelIdx !== -1 ? row[modelIdx] || '' : '';
        const purchase = purchaseIdx !== -1 ? row[purchaseIdx] || '' : '';
        const lineNum = i + 1;

        if (!vin) {
          failedCount++;
          details.push(`行号${lineNum},请填写正确VIN码,失败`);
          continue;
        }

        if (vin.length !== 17) {
          failedCount++;
          details.push(`行号${lineNum},请填写正确VIN码,失败`);
          continue;
        }

        if (seenVins.has(vin)) {
          failedCount++;
          details.push(`行号${lineNum},VIN码重复,失败`);
          continue;
        }
        seenVins.add(vin);

        const matchingVehicle = allVehicles.find(v => v.vin === vin);
        if (!matchingVehicle) {
          failedCount++;
          details.push(`行号${lineNum},请填写正确VIN码,失败`);
          continue;
        }

        // 可覆盖字段: 车牌号/外观/车型/购车时间
        if (plate) matchingVehicle.plate = plate;
        if (color) matchingVehicle.color = color;
        if (model) matchingVehicle.model = model;
        if (purchase) matchingVehicle.purchase = purchase;
        // 不可覆盖字段: VIN码/设备ID/车龄/总里程数/电池版本/最后位置 — 跳过
        successCount++;
      }

      setImportResult({
        success: successCount,
        failed: failedCount,
        details: details.length > 0 ? details : undefined,
      });

      if (successCount > 0) {
        message.success(t('toast.import_success'));
        setFiltered([...allVehicles]);
      } else {
        message.error('导入失败，请检查失败明细');
      }
    };

    reader.readAsText(importFile);
  };

  const handleDownloadFailures = () => {
    if (!importResult || !importResult.details) return;
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet([
        [t('common.failure_details')],
        ...importResult.details!.map(d => d.split(','))
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Failures');
      XLSX.writeFile(wb, 'import_failures.xlsx');
    });
  };

  const dataSource = filtered ?? allVehicles;
  const chileAddresses = [
    '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号',
    '智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号',
    '智利瓦尔帕莱索大区比尼亚德尔马市海滨路789号',
    '智利比奥比奥大区康塞普西翁市自由大道456号',
    '智利科金博大区拉塞雷纳市教育路321号',
    '智利安托法加斯塔大区安托法加斯塔市矿业大道678号',
    '智利奥伊金斯将军大区兰卡瓜市解放者大道901号',
    '智利马乌莱大区塔尔卡市一号公路234号',
    '智利阿劳卡尼亚大区特木科市德国街567号',
    '智利湖大区蒙特港港口路123号',
  ];

  const columns = [
    { title: t('veh.vin'), dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: t('veh.device'), dataIndex: 'device', key: 'device' },
    { title: t('veh.model'), dataIndex: 'model', key: 'model' },
    { title: t('veh.color'), dataIndex: 'color', key: 'color' },
    { title: t('veh.battery_version'), dataIndex: 'batteryVersion', key: 'batteryVersion' },
    { title: t('veh.purchase'), dataIndex: 'purchase', key: 'purchase' },
    { title: t('veh.age'), dataIndex: 'purchase', key: 'age', render: (v: string) => `${calculateAge(v)}${t('label.year', '年')}` },
    { title: t('veh.km'), dataIndex: 'totalKm', key: 'totalKm', render: (v: number) => `${v.toLocaleString()}km` },
    {
      title: t('veh.last_location'),
      key: 'location',
      render: (_: any, __: Vehicle, index: number) => <LocationPrivacy text={chileAddresses[index % chileAddresses.length]!} />,
    },
    {
      title: t('veh.action'),
      key: 'action',
      render: (_: any, r: Vehicle) => (
        <Button type="link" size="small" onClick={() => navigate(`/vehicles/${r.vin}`)}>
          {t('veh.detail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Ttl level={4} style={{ margin: 0 }}>
          {t('title.vehicles')}
        </Ttl>
        <Text type="secondary">
          {dataSource.length}
          {t('veh.sub')}
        </Text>
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder={t('veh.vin')}
              value={vinVal}
              onChange={(e) => setVinVal(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              maxLength={17}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder={t('veh.plate')}
              value={plateVal}
              onChange={(e) => setPlateVal(e.target.value)}
              maxLength={8}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder={t('veh.device')}
              value={deviceVal}
              onChange={(e) => setDeviceVal(e.target.value.replace(/[^A-Za-z0-9-]/g, ''))}
              maxLength={20}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder={t('veh.battery_version')}
              value={batteryVerVal}
              onChange={(e) => setBatteryVerVal(e.target.value)}
              maxLength={20}
            />
          </Col>
          <Col xs={24} sm={16} md={12}>
            <Space align="center">
              <span>{t('veh.age')}:</span>
              <InputNumber placeholder={t('veh.min_age')} min={0} max={100} value={minAgeVal} onChange={setMinAgeVal} />
              <span>-</span>
              <InputNumber placeholder="最大车龄" min={0} max={100} value={maxAgeVal} onChange={setMaxAgeVal} />
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('common.search')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                {t('common.reset')}
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setImportModalOpen(true)}>{t('common.import')}</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Vehicle table */}
      <Card style={{ borderRadius: 8 }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="vin"
          scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total: number) => `${total} ${t('common.records')}` }}
          size="middle"
        />
      </Card>

      {/* Import modal */}
      <Modal
        title={t('common.import')}
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setImportResult(null);
          setImportFile(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setImportModalOpen(false);
            setImportResult(null);
            setImportFile(null);
          }}>{t('common.cancel')}</Button>,
          <Button key="import" type="primary" onClick={handleImportSubmit} disabled={!!importResult}>
            {t('common.import')}
          </Button>,
        ]}
        width={520}
      >
        {/* Template Download */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Button type="link" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            {t('common.download_template')}
          </Button>
        </div>

        {/* File Upload */}
        {!importResult ? (
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={(file) => {
              const ext = file.name.split('.').pop()?.toLowerCase();
              if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
                message.error(t('toast.invalid_file'));
                return Upload.LIST_IGNORE;
              }
              if (file.size > 50 * 1024 * 1024) {
                message.error(t('toast.file_too_large'));
                return Upload.LIST_IGNORE;
              }
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(null)}
            showUploadList={true}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{t('common.click_upload')}</p>
            <p style={{ color: '#999', fontSize: 12 }}>Supported formats: .xls/.xlsx/.csv</p>
          </Upload.Dragger>
        ) : (
          /* Import Results */
          <div>
            <Card size="small" style={{ background: '#f6ffed', marginBottom: 12 }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                <span>{t('toast.import_success')}: {importResult.success} {t('common.records')}</span>
              </Space>
              {importResult.failed > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                    <span>{importResult.failed} {t('common.failed_records')}</span>
                  </Space>
                </div>
              )}
            </Card>
            {importResult.details && importResult.details.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <Button type="link" icon={<DownloadOutlined />} onClick={handleDownloadFailures}>
                  {t('common.download_failed')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ======== DETAIL VIEW ======== */

const DetailView: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const _vt = useAppStore((s) => s._vt);
  const setVt = useAppStore((s) => s.setVt);

  const tabItems = [
    { key: 'risk', label: t('veh.detail.tabs.risk'), children: <AlertTable /> },
    { key: 'drive', label: t('veh.detail.tabs.drive'), children: <DrivingTable /> },
    { key: 'battery', label: t('veh.detail.tabs.battery'), children: <BatteryTable vehicle={vehicle} /> },
    { key: 'charge', label: t('veh.detail.tabs.charge'), children: <ChargeTable /> },
    { key: 'trip', label: t('veh.detail.tabs.trip'), children: <TripTable /> },
    { key: 'repair', label: t('veh.detail.tabs.repair'), children: <RepairTable /> },
    { key: 'mileage', label: t('veh.detail.tabs.mileage'), children: <MileageChart /> },
  ];

  const vehicleAge = calculateAge(vehicle.purchase);

  return (
    <div>
      {/* Breadcrumb / Back */}
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/vehicles')} style={{ padding: 0 }}>
          {t('title.vehicles')}
        </Button>
        <span style={{ margin: '0 8px', color: '#999' }}>/</span>
        <span>{t('title.vehicles')}详情页</span>
      </div>

      <Row gutter={16} style={{ alignItems: 'stretch' }}>
        {/* Left panel: Vehicle info + Device info */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Card title={t('veh.info')} style={{ borderRadius: 8 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('veh.info.vin')}>{maskVin(vehicle.vin)}</Descriptions.Item>
                <Descriptions.Item label={t('veh.info.plate')}>{maskPlate(vehicle.plate)}</Descriptions.Item>
                <Descriptions.Item label={t('veh.info.model')}>{vehicle.model}</Descriptions.Item>
                <Descriptions.Item label={t('veh.color', '外观')}>{vehicle.color}</Descriptions.Item>
                <Descriptions.Item label={t('veh.battery_version', '电池版本')}>{vehicle.batteryVersion}</Descriptions.Item>
                <Descriptions.Item label={t('veh.purchase', '购车时间')}>{vehicle.purchase}</Descriptions.Item>
                <Descriptions.Item label={t('veh.age', '车龄')}>
                  {vehicleAge}
                  {t('label.year', '年')}
                </Descriptions.Item>
                <Descriptions.Item label={t('veh.km', '总里程')}>
                  {vehicle.totalKm.toLocaleString()}km
                </Descriptions.Item>
                <Descriptions.Item label={t('veh.last_location', '最后位置')}>
                  <LocationPrivacy text={truncateLocation('智利圣地亚哥首都大区圣地亚哥市')} />
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title={t('veh.dev_info')} style={{ borderRadius: 8, flex: 1 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('veh.device', '设备ID')}>{vehicle.device}</Descriptions.Item>
              <Descriptions.Item label={t('veh.device_name', '设备名称')}>{vehicle.deviceName || 'OBD网关'}</Descriptions.Item>
              <Descriptions.Item label={t('veh.device_type', '设备类型')}>{vehicle.deviceType || 'OBD-II'}</Descriptions.Item>
              <Descriptions.Item label={t('veh.device_model', '设备型号')}>{vehicle.deviceModel || 'WD-T100'}</Descriptions.Item>
            </Descriptions>
          </Card>
            </div>
        </Col>

        {/* Right panel: Tabs */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 8 }}>
            <Tabs
              activeKey={_vt}
              onChange={setVt}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

/* ======== VEHICLES PAGE ======== */

const Vehicles: React.FC = () => {
  const { vin } = useParams<{ vin: string }>();
  const tenant = useAppStore((s) => s.tenant);
  const vehicles = useMemo(() => getVehicles(), [tenant]);
  const vehicle = useMemo(() => vehicles.find((v) => v.vin === vin), [vin, vehicles]);

  if (vin && vehicle) {
    return <DetailView vehicle={vehicle} />;
  }

  if (vin && !vehicle) {
    // VIN in URL but no matching vehicle — show list view
    return <ListView />;
  }

  return <ListView />;
};

export default Vehicles;
