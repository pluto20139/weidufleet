import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Space,
  Tooltip,
  message,
  DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { TenantItem } from '@/types';
import LocationPrivacy from '../components/LocationPrivacy';

// Hardcoded tenant data
const allTenants: TenantItem[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `ten${i + 1}`,
  code: `WD-CL-${String(i + 1).padStart(3, '0')}`,
  name: `Tenant ${i + 1}`,
  admin: `Admin ${i + 1}`,
  contact: `admin${i + 1}@tenant.cl`,
  phone: `+56 9 1234 ${String(5678 + i).padStart(4, '0')}`,
  createdDate: `2025-06-${String((i % 30) + 1).padStart(2, '0')}`,
}));

const Tenant: React.FC = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<TenantItem[]>([...allTenants].sort((a, b) => b.createdDate.localeCompare(a.createdDate)));
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [adminAccountFilter, setAdminAccountFilter] = useState('');
  const [createTimeRange, setCreateTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string } | null>(null);
  const [newForm] = Form.useForm();
  const [setupForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);

  const handleSearch = () => {
    let filtered = allTenants;
    if (nameFilter) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(nameFilter.toLowerCase()),
      );
    }
    if (codeFilter) {
      filtered = filtered.filter((t) =>
        t.code === codeFilter,
      );
    }
    if (adminAccountFilter) {
      filtered = filtered.filter((t) =>
        t.adminAccount === adminAccountFilter,
      );
    }
    if (createTimeRange && createTimeRange[0] && createTimeRange[1]) {
      const start = createTimeRange[0];
      const end = createTimeRange[1];
      filtered = filtered.filter((t) => {
        const d = dayjs(t.createdDate);
        return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day'));
      });
    }
    setTenants([...filtered].sort((a, b) => b.createdDate.localeCompare(a.createdDate)));
  };

  const handleReset = () => {
    setNameFilter('');
    setCodeFilter('');
    setAdminAccountFilter('');
    setCreateTimeRange(null);
    setTenants([...allTenants].sort((a, b) => b.createdDate.localeCompare(a.createdDate)));
  };

  const handleCreateTenant = () => {
    newForm.validateFields().then((values) => {
      const newTenant: TenantItem = {
        id: `ten${Date.now()}`,
        code: values.code,
        name: values.name,
        admin: '',
        contact: values.contact,
        phone: values.phone,
        address: values.address || '—',
        adminAccount: '—',
        createdDate: new Date().toISOString().slice(0, 10),
      };
      setTenants((prev) => [newTenant, ...prev]);
      setSelectedTenant(newTenant);
      setNewModalOpen(false);
      newForm.resetFields();
      // Open setup admin modal
      setSetupModalOpen(true);
    });
  };

  const existingEmails = [
    'carlos.gomez@wd-logistics.cl',
    'maria.g@stgo-transport.cl',
    'juan.perez@vap-log.cl',
  ];

  const handleSetupAdmin = () => {
    setupForm.validateFields().then((values) => {
      if (existingEmails.includes(values.email)) {
        Modal.confirm({
          title: '邮箱已存在',
          content: `邮箱 ${values.email} 已被使用，是否为其追加管理员角色？`,
          okText: '追加角色',
          cancelText: '取消',
          onOk: () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            setCreatedAccount({ email: values.email, password: '（已有账号，已追加角色）' });
            setSetupModalOpen(false);
            setupForm.resetFields();
            setConfirmModalOpen(true);
          },
        });
        return;
      }
      const chars2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const pwd2 = Array.from({ length: 8 }, () => chars2[Math.floor(Math.random() * chars2.length)]).join('');
      setCreatedAccount({ email: values.email, password: pwd2 });
      setSetupModalOpen(false);
      setupForm.resetFields();
      setConfirmModalOpen(true);
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据无法恢复，是否继续？',
      onOk: () => {
        setTenants((prev) => prev.filter((t) => t.id !== id));
        message.success(t('common.done'));
      },
    });
  };

  const handleOpenEdit = (tenant: TenantItem) => {
    setEditingTenant(tenant);
    editForm.setFieldsValue({
      name: tenant.name,
      code: tenant.code,
      contact: tenant.contact,
      phone: tenant.phone,
      address: tenant.address === '—' ? '' : tenant.address,
    });
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    editForm.validateFields().then((values) => {
      if (!editingTenant) return;
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? {
        ...t,
        name: values.name,
        contact: values.contact,
        phone: values.phone,
        address: values.address || '—',
      } : t));
      message.success('编辑成功');
      setEditModalOpen(false);
      setEditingTenant(null);
      editForm.resetFields();
    });
  };

  const columns = [
    { title: t('tenant.index', '序号'), width: 60, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: t('tenant.code'), dataIndex: 'code', key: 'code' },
    { title: t('tenant.name'), dataIndex: 'name', key: 'name' },
    { title: t('tenant.address', '地址'), dataIndex: 'address', key: 'address', render: (v: string) => v ? <LocationPrivacy text={v} /> : '—' },
    { title: t('tenant.contact', '联系方式'), dataIndex: 'phone', key: 'phone' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: t('tenant.admin'), dataIndex: 'admin', key: 'admin', render: (v: string) => v || <Tag color="orange">{t('common.admin')}</Tag> },
    { title: t('tenant.admin_account', '管理员账号'), dataIndex: 'adminAccount', key: 'adminAccount', render: (v: string) => v || '—' },
    { title: t('tenant.created'), dataIndex: 'createdDate', key: 'createdDate' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: TenantItem) => (
        <Space>
          <Button type="link" onClick={() => handleOpenEdit(record)}>{t('tenant.action.edit')}</Button>
          {record.adminAccount && record.adminAccount !== '—' ? (
            <>
              <Tooltip title="该租户已开通管理员账号，不可删除">
                <Button type="link" danger disabled>{t('tenant.action.del')}</Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                type="link"
                onClick={() => {
                  setSelectedTenant(record);
                  setSetupModalOpen(true);
                }}
              >
                {t('tenant.action.setup_admin')}
              </Button>
              <Button type="link" danger onClick={() => handleDelete(record.id)}>
                {t('tenant.action.del')}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('title.tenant')}</h2>
        <span style={{ color: '#666', fontSize: 13 }}>{t('tenant.sub')}</span>
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder={t('tenant.name')}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{ width: 180 }}
          />
          <Input
            placeholder={t('tenant.code')}
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
            style={{ width: 180 }}
          />
          <Input
            placeholder={t('tenant.admin_account', '管理员账号')}
            value={adminAccountFilter}
            onChange={(e) => setAdminAccountFilter(e.target.value)}
            style={{ width: 180 }}
          />
          <DatePicker.RangePicker
            onChange={(dates) => setCreateTimeRange(dates)}
            placeholder={['创建开始', '创建结束']}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button onClick={handleReset}>
            {t('common.reset')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewModalOpen(true)}>
            {t('tenant.action.new')}
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tenants}
          scroll={{ x: 'max-content' }}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t('common.records')}`,
          }}
        />
      </Card>

      {/* New Tenant Modal */}
      <Modal
        title={t('tenant.action.new')}
        open={newModalOpen}
        onOk={handleCreateTenant}
        onCancel={() => {
          setNewModalOpen(false);
          newForm.resetFields();
        }}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Form form={newForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('tenant.company_name')}
            rules={[
              { required: true, message: t('tenant.company_name') },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const exists = tenants.some(tn => tn.name === value);
                  return exists ? Promise.reject('该企业名称已存在，请更换') : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={t('tenant.company_name')} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('tenant.company_code')}
            rules={[
              { required: true, message: t('tenant.company_code') },
              {
                pattern: /^[a-zA-Z0-9-]+$/,
                message: '仅支持英文、数字和短横线',
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const exists = tenants.some(tn => tn.code === value);
                  return exists ? Promise.reject('该企业编码已存在，请更换') : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={t('tenant.company_code')} />
          </Form.Item>
          <Form.Item
            name="contact"
            label={t('tenant.contact')}
          >
            <Input placeholder={t('tenant.contact')} />
          </Form.Item>
          <Form.Item
            name="phone"
            label={t('tenant.phone')}
          >
            <Input placeholder={t('tenant.phone')} />
          </Form.Item>
          <Form.Item
            name="address"
            label="企业地址"
          >
            <Input placeholder="请输入企业地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Setup Admin Modal */}
      <Modal
        title={`${t('tenant.setup_admin_title')}${selectedTenant ? ` - ${selectedTenant.name}` : ''}`}
        open={setupModalOpen}
        onOk={handleSetupAdmin}
        onCancel={() => {
          setSetupModalOpen(false);
          setupForm.resetFields();
        }}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Form form={setupForm} layout="vertical">
          <Form.Item
            name="nickname"
            label={t('tenant.nickname')}
            rules={[{ required: true, message: t('tenant.nickname') }]}
          >
            <Input placeholder={t('tenant.nickname')} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('tenant.email')}
            rules={[
              { required: true, message: t('tenant.email') },
              { type: 'email', message: '请输入正确格式的邮箱' },
            ]}
          >
            <Input placeholder={t('tenant.email')} />
          </Form.Item>
          <Form.Item label={t('tenant.role')}>
            <Input value="Administrator" disabled />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title={t('tenant.account_created')}
        open={confirmModalOpen}
        onOk={() => setConfirmModalOpen(false)}
        onCancel={() => setConfirmModalOpen(false)}
        okText={t('common.done')}
        cancelText={t('common.close')}
      >
        <p>{t('tenant.account_info')}</p>
        <Card size="small" style={{ background: '#f6ffed', marginTop: 12 }}>
          <p>
            <strong>{t('tenant.email')}:</strong> {createdAccount?.email}
          </p>
          <p>
            <strong>{t('tenant.password')}:</strong> {createdAccount?.password}
          </p>
        </Card>
        <Button
          type="primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            if (createdAccount) {
              navigator.clipboard.writeText(`邮箱:${createdAccount.email}\n密码:${createdAccount.password}`);
              message.success('复制成功');
            }
          }}
        >
          复制信息
        </Button>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal
        title="编辑租户"
        open={editModalOpen}
        onOk={handleEditSave}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingTenant(null);
          editForm.resetFields();
        }}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('tenant.company_name')}
            rules={[{ required: true, message: t('tenant.company_name') }]}
          >
            <Input placeholder={t('tenant.company_name')} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('tenant.company_code')}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="contact"
            label={t('tenant.contact')}
          >
            <Input placeholder={t('tenant.contact')} />
          </Form.Item>
          <Form.Item
            name="phone"
            label={t('tenant.phone')}
          >
            <Input placeholder={t('tenant.phone')} />
          </Form.Item>
          <Form.Item
            name="address"
            label="企业地址"
          >
            <Input placeholder="请输入企业地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tenant;
