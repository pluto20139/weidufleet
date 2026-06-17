import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Space,
  message,
  Popconfirm,
  DatePicker,
} from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { getRepairItems, addRepairItem, completeRepairItem, getVehicles, revertFaultAlertStatus, revertBatteryAlertStatus } from '@/api/mock';
import type { RepairItem } from '@/types';
import { maskVin, maskPlate, matchPlateSearch } from '@/utils/masking';

const Repair: React.FC = () => {
  const { t } = useTranslation();
  const tenant = useAppStore((s) => s.tenant);
  const allVehicles = useMemo(() => getVehicles(), [tenant]);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  
  useEffect(() => {
    setRepairs([...getRepairItems()]);
  }, [tenant]);

  const [plateFilter, setPlateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<RepairItem | null>(null);
  const [form] = Form.useForm();
  const watchedType = Form.useWatch('type', form);

  const handleSearch = () => {
    let filtered = getRepairItems();
    if (plateFilter) {
      filtered = filtered.filter((r) =>
        matchPlateSearch(plateFilter, r.plate),
      );
    }
    if (typeFilter) {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    setRepairs(filtered);
  };

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const selected = allVehicles.find((v) => v.vin === values.vehicleVin);
      addRepairItem(
        selected?.plate ?? '',
        values.vehicleVin,
        values.type,
        values.description
      );
      setRepairs([...getRepairItems()]);
      message.success('新建维修记录成功');
      setModalOpen(false);
      form.resetFields();
    });
  };

  const handleComplete = (id: string) => {
    setRepairs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: '维修完成' as const } : r)),
    );
    message.success(t('toast.completed'));
  };

  const handleDelete = (id: string) => {
    // Revert alert status if linked to a fault/battery alert
    const target = getRepairItems().find(r => r.id === id);
    if (target?.sourceAlertId) {
      if (target.sourceAlertType === 'fault') {
        revertFaultAlertStatus(target.sourceAlertId);
      } else if (target.sourceAlertType === 'battery') {
        revertBatteryAlertStatus(target.sourceAlertId);
      }
    }
    setRepairs((prev) => prev.filter((r) => r.id !== id));
    message.success(t('toast.deleted'));
  };

  const handleViewDetail = (record: RepairItem) => {
    setDetailItem(record);
    setDetailModalOpen(true);
  };

  const columns = [
    { title: t('veh.plate'), dataIndex: 'plate', key: 'plate', render: (v: string) => maskPlate(v) },
    { title: t('veh.vin', 'VIN'), dataIndex: 'vin', key: 'vin', render: (v: string) => maskVin(v) },
    {
      title: t('repair.type', '维修类型'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <Tag color={v === '故障类' ? 'red' : 'blue'}>
          {v}
        </Tag>
      ),
    },
    { title: t('repair.repair_desc', '维修描述'), dataIndex: 'description', key: 'description', ellipsis: true },
    { title: t('repair.date', '开始时间'), dataIndex: 'startDate', key: 'startDate' },
    { title: t('repair.end_date', '结束时间'), dataIndex: 'endTime', key: 'endTime', render: (v: string) => v || '—' },
    { title: t('repair.recorder', '操作人'), dataIndex: 'recorder', key: 'recorder', render: (v: string) => v || '—' },
    {
      title: t('repair.status_name', '维修状态'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === '维修中' ? 'processing' : 'success'}>
          {v}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: RepairItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            {t('repair.action.view_detail', '查看详情')}
          </Button>
          {record.status === '维修中' && (
            <>
              <Button type="link" size="small" onClick={() => handleComplete(record.id)}>
                {t('repair.action.complete', '完成维修')}
              </Button>
            </>
          )}
          <Popconfirm title={t('common.action') + '?'} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">
              {t('repair.action.delete', '删除记录')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('title.repair')}</h2>
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
          <Select
            placeholder={t('repair.type')}
            allowClear
            style={{ width: 140 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '故障类', label: t('repair.fault') },
              { value: '电池类', label: t('repair.battery') },
            ]}
          />
          <Select
            placeholder={t('repair.status_name', '维修状态')}
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('common.all') },
              { value: '维修中', label: '维修中' },
              { value: '维修完成', label: '维修完成' },
            ]}
          />
          <DatePicker.RangePicker format="YYYY-MM-DD" />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('repair.action.new', '新建维修')}
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={repairs}
          scroll={{ x: 'max-content' }}
          pagination={{
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t('common.records')}`,
          }}
        />
      </Card>

      {/* Create Repair Modal */}
      <Modal
        title={t('repair.create_repair')}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="vehicleVin"
            label={t('repair.select_vehicle')}
            rules={[{ required: true, message: t('repair.select_vehicle') }]}
          >
            <Select
              showSearch
              placeholder={t('repair.select_vehicle')}
              optionFilterProp="label"
              options={allVehicles.map((v) => ({
                value: v.vin,
                label: `${v.plate} (${v.vin})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="type"
            label={t('repair.type')}
            rules={[{ required: true, message: t('repair.type') }]}
          >
            <Select
              options={[
                { value: '故障类', label: t('repair.fault') },
                { value: '电池类', label: t('repair.battery') },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('repair.desc')}
            rules={[{ required: true, message: t('repair.desc') }]}
          >
            <Select
              placeholder={t('repair.desc')}
              options={(() => {
                const typeVal = watchedType;
                const faultOpts = [
                  { value: 'VDC', label: 'VDC故障报警' },
                  { value: 'CDCU', label: 'CDCU故障报警' },
                  { value: 'BDCU', label: 'BDCU故障报警' },
                  { value: 'ADAS', label: 'ADAS故障报警' },
                  { value: 'DC-DC温度', label: 'DC-DC温度报警' },
                  { value: 'DC-DC状态', label: 'DC-DC状态报警' },
                  { value: '驱动电机控制器温度', label: '驱动电机控制器温度报警' },
                  { value: '驱动电机温度', label: '驱动电机温度报警' },
                  { value: '高压互锁状态', label: '高压互锁状态报警' },
                ];
                const battOpts = [
                  { value: 'SOC过低', label: 'SOC低报警' },
                  { value: '电池高温', label: '电池高温报警' },
                  { value: 'SOC跳变', label: 'SOC跳变报警' },
                  { value: '充电故障', label: '充电故障报警' },
                  { value: '温差报警', label: '温度差异报警' },
                  { value: '储能过压', label: '车载储能装置过压报警' },
                  { value: '储能欠压', label: '车载储能装置欠压报警' },
                  { value: '单体过压', label: '单体电池过压报警' },
                  { value: '单体欠压', label: '单体电池欠压报警' },
                  { value: 'SOC过高', label: 'SOC过高报警' },
                  { value: '储能不匹配', label: '可充电储能系统不匹配报警' },
                  { value: '单体一致性差', label: '电池单体一致性差报警' },
                  { value: '绝缘报警', label: '绝缘报警' },
                  { value: '储能过充', label: '车载储能装置过充报警' },
                ];
                return typeVal === '电池类' ? battOpts : faultOpts;
              })()}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={t('repair.action.view_detail', '查看详情')}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={<Button onClick={() => setDetailModalOpen(false)}>{t('common.close')}</Button>}
      >
        {detailItem && (
          <div>
            <p><strong>{t('veh.plate')}:</strong> {maskPlate(detailItem.plate)}</p>
            <p><strong>VIN:</strong> {maskVin(detailItem.vin)}</p>
            <p><strong>{t('repair.type')}:</strong> {detailItem.type}</p>
            <p><strong>{t('repair.repair_desc')}:</strong> {detailItem.description}</p>
            <p><strong>{t('repair.date')}:</strong> {detailItem.startDate}</p>
            <p><strong>{t('repair.recorder', '操作人')}:</strong> {detailItem.recorder || '—'}</p>
            <p><strong>{t('repair.status_name', '维修状态')}:</strong> {detailItem.status}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Repair;
