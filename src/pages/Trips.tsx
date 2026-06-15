import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Input,
  DatePicker,
  Descriptions,
  Row,
  Col,
  Space,
  Result,
} from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip as LTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getTripDetails } from '@/api/mock';
import type { TripDetail } from '@/types';
import LocationPrivacy from '../components/LocationPrivacy';
import { maskVin, maskPlate } from '@/utils/masking';
import { isWithinTrajectoryWindow } from '@/utils/trajectory';

const tripPositions: [number, number][] = [
  [-33.45, -70.68],
  [-33.44, -70.66],
  [-33.43, -70.64],
  [-33.44, -70.62],
  [-33.45, -70.63],
];

const Trips: React.FC = () => {
  const { t } = useTranslation();
  const allTrips = getTripDetails();
  const [trips, setTrips] = useState<TripDetail[]>(allTrips);
  const [plateFilter, setPlateFilter] = useState('');
  const [detailMode, setDetailMode] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<TripDetail | null>(null);

  const handleSearch = () => {
    let filtered = allTrips;
    if (plateFilter) {
      filtered = filtered.filter((t) =>
        t.plate.toLowerCase().includes(plateFilter.toLowerCase()),
      );
    }
    setTrips(filtered);
  };

  const handleReset = () => {
    setPlateFilter('');
    setTrips(allTrips);
  };

  const showDetail = (trip: TripDetail) => {
    setCurrentTrip(trip);
    setDetailMode(true);
  };

  const hideDetail = () => {
    setDetailMode(false);
    setCurrentTrip(null);
  };

  // ===================== Detail View =====================
  if (detailMode && currentTrip) {
    const trip = currentTrip;

    const infoItems = [
      { key: '1', label: t('veh.plate'), children: maskPlate(trip.plate) },
      { key: '2', label: 'VIN', children: maskVin(trip.vin) || '—' },
      { key: '5', label: t('trip.start_location'), children: <LocationPrivacy text={trip.startLocation} /> },
      { key: '6', label: t('trip.end_location'), children: <LocationPrivacy text={trip.endLocation} /> },
      { key: '7', label: t('trips.km', '行驶里程'), children: `${trip.distance} ${t('label.km')}` },
      { key: '8', label: t('trips.duration', '行驶时长'), children: trip.duration },
      { key: '9', label: t('trips.avg_speed', '平均速度'), children: `${trip.avgSpeed} ${t('label.kmh')}` },
      { key: '10', label: t('veh.info.max_speed'), children: `${trip.maxSpeed} ${t('label.kmh')}` },
      { key: '11', label: t('veh.info.min_speed'), children: `${trip.minSpeed} ${t('label.kmh')}` },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={hideDetail}
            style={{ padding: 0, marginBottom: 12 }}
          >
            {t('trips.back_to_list')}
          </Button>
          <h2 style={{ margin: 0 }}>
            {t('trip.detail_title', '行程记录详情页')}
          </h2>
        </div>

        <Row gutter={16} style={{ alignItems: 'stretch' }}>
          <Col xs={24} lg={10}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Card title={t('trip.detail_title', '行程记录详情页')}>
                <Descriptions column={1} bordered size="small" items={infoItems} />
              </Card>
            </div>
          </Col>
          <Col xs={24} lg={14}>
            <Card title={t('trip.traj')} style={{ height: '100%' }}>
              {isWithinTrajectoryWindow(trip.endTime) ? (
                <MapContainer
                  center={[-33.44, -70.65]}
                  zoom={14}
                  style={{ height: 500, width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline positions={tripPositions} pathOptions={{ color: '#1677ff', weight: 3 }} />
                  <Marker position={tripPositions[0]!}>
                    <LTooltip permanent>{t('veh.info.start')}</LTooltip>
                  </Marker>
                  <Marker position={tripPositions[tripPositions.length - 1]!}>
                    <LTooltip permanent>{t('veh.info.end')}</LTooltip>
                  </Marker>
                </MapContainer>
              ) : (
                <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Result
                    status="warning"
                    title={t('trajectory.expired')}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // ===================== List View =====================
  const columns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: 'VIN', dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    { title: t('trips.start_time', '开始时间'), dataIndex: 'startTime', key: 'startTime' },
    { title: t('trips.end_time', '到达时间'), dataIndex: 'endTime', key: 'endTime' },
    { title: t('trip.start_location', '起点'), dataIndex: 'startLocation', key: 'startLocation', render: (v: string) => <LocationPrivacy text={v} /> },
    { title: t('trip.end_location', '终点'), dataIndex: 'endLocation', key: 'endLocation', render: (v: string) => <LocationPrivacy text={v} /> },
    {
      title: t('trips.km', '行驶里程'),
      dataIndex: 'distance',
      key: 'distance',
      render: (v: number) => `${v} ${t('label.km', 'km')}`,
    },
    { title: t('trips.duration', '行驶时长'), dataIndex: 'duration', key: 'duration' },
    {
      title: t('trips.avg_speed', '平均速度'),
      dataIndex: 'avgSpeed',
      key: 'avgSpeed',
      render: (v: number) => `${v} ${t('label.kmh', 'km/h')}`,
    },
    {
      title: t('trip.alerts', '预警次数'),
      dataIndex: 'alertCount',
      key: 'alertCount',
      render: (v: number) => v,
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: TripDetail) => (
        <Button type="link" onClick={() => showDetail(record)}>
          {t('trip.detail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('title.trips')}</h2>
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('veh.plate')}
            value={plateFilter}
            onChange={(e) => setPlateFilter(e.target.value)}
            style={{ width: 160 }}
          />
          <DatePicker.RangePicker 
            onChange={(dates) => {
              if (!dates) {
                setTrips(allTrips);
              } else {
                const [start, end] = dates;
                if (start && end) {
                  setTrips(allTrips.filter(t => {
                    const tripTime = new Date(t.startTime).getTime();
                    return tripTime >= start.valueOf() && tripTime <= end.valueOf();
                  }));
                }
              }
            }} 
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button onClick={handleReset}>{t('common.reset')}</Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={trips}
          scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showTotal: (total) => `${total} ${t('common.records')}` }}
        />
      </Card>
    </div>
  );
};

export default Trips;
