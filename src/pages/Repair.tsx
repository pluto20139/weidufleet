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
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0];
      const end = dateRange[1];
      filtered = filtered.filter((r) => {
        const d = dayjs(r.startDate);
        return d.isAfter(start.startOf('day').subtract(1, 'ms')) && d.isBefore(end.endOf('day').add(1, 'ms'));
      });
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
    completeRepairItem(id);
    const now = new Date().toISOString().slice(0, 10);
    setRepairs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: '维修完成' as const, endTime: now } : r)),
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
            maxLength={8}
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
          <DatePicker.RangePicker format="YYYY-MM-DD" onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)} />
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
            <Input.TextArea
              rows={3}
              placeholder={watchedType === '电池类' ? '请输入电池类报警描述，如SOC过低、电池高温等' : '请输入故障类报警描述，如VDC故障、CDCU故障等'}
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Repair;
