import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Tree,
  Checkbox,
  Descriptions,
  Space,
  Row,
  Col,
  message,
} from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TreeDataNode, CheckboxChangeEvent } from 'antd';
import { useAppStore } from '@/store/useAppStore';
import type { AssetItem, BizUserItem } from '@/types';
import { maskVin, matchVinSearch } from '@/utils/masking';
import { getAssetItems, getTenantItems } from '@/api/mock';

// ============ Mock Data ============
const tenantTreeData: TreeDataNode[] = [
  {
    title: 'WeiDu Root',
    key: 'root',
    children: [
      {
        title: '智利物流集团',
        key: 'ten1',
        children: [
          {
            title: 'Santiago Transport',
            key: 'ten2',
            children: [{ title: 'Valparaiso Logistics', key: 'ten3' }],
          },
        ],
      },
      {
        title: 'Rancagua Fleet Services',
        key: 'ten4',
      },
      {
        title: 'Quillota Transporte',
        key: 'ten5',
      },
    ],
  },
];

const functionPermissions = [
  'Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance', 'Monitor',
];

const permI18nMap: Record<string, string> = {
  'Vehicles': 'perm.vehicles',
  'Risk': 'perm.risk',
  'Driving': 'perm.driving',
  'Battery': 'perm.battery',
  'Trips': 'perm.trips',
  'Fence': 'perm.fence',
  'Maintenance': 'perm.maintenance',
  'Monitor': 'perm.monitor',
};

const tenantInfo = {
  name: '智利物流集团',
  code: 'WD-CL-001',
  admin: 'Carlos Gomez',
  contact: 'carlos.gomez@wd-logistics.cl',
  phone: '+56 9 1234 5678',
  address: 'Av. Libertador Bernardo O\'Higgins 1500, Santiago, Chile',
  created: '2025-06-01',
};

const allAssets: AssetItem[] = [
  { id: 'a1', vin: 'LFWDAU1H6N1A00001', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a2', vin: 'LFWDAU1H6N1A00002', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a3', vin: 'LFWDAU1H6N1A00003', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a4', vin: 'LFWDAU1H6N1A00004', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a5', vin: 'LFWDAU1H6N1A00005', tenant: 'Valparaiso Logistics', syncedDate: '2026-05-20 09:15' },
  { id: 'a6', vin: 'LFWDAU1H6N1A00006', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a7', vin: 'LFWDAU1H6N1A00007', tenant: 'Rancagua Fleet Services', syncedDate: '2026-05-25 11:00' },
  { id: 'a8', vin: 'LFWDAU1H6N1A00008', tenant: 'Santiago Transport', syncedDate: '2026-05-28 14:30' },
  { id: 'a9', vin: 'LFWDAU1H6N1A00009', tenant: '智利物流集团', syncedDate: '2026-06-01 10:00' },
  { id: 'a10', vin: 'LFWDAU1H6N1A00010', tenant: 'Quillota Transporte', syncedDate: '2026-05-30 08:00' },
];

const allBizUsers: BizUserItem[] = [
  { id: 'bu1', nickname: 'carlos_admin', email: 'carlos.gomez@wd-logistics.cl', role: 'Admin', created: '2025-06-01' },
  { id: 'bu2', nickname: 'maria_op', email: 'maria.g@stgo-transport.cl', role: 'Operator', created: '2025-07-15' },
  { id: 'bu3', nickname: 'juan_mon', email: 'juan.perez@vap-log.cl', role: 'Monitor', created: '2025-08-20' },
  { id: 'bu4', nickname: 'ana_disp', email: 'ana.m@rf-svc.cl', role: 'Dispatcher', created: '2025-09-10' },
  { id: 'bu5', nickname: 'pedro_op', email: 'pedro.s@qt.cl', role: 'Operator', created: '2025-10-05' },
  { id: 'bu6', nickname: 'luis_admin', email: 'luis.fernandez@wd-logistics.cl', role: 'Admin', created: '2025-11-01' },
];

const rolesData = [
  { id: 'br1', name: 'Admin', type: 'admin', permissions: ['Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance', 'Monitor', 'Tenant Config', 'User Mgmt', 'Role Mgmt', 'Asset Allocation'] },
  { id: 'br2', name: 'Operator', type: 'operator', permissions: ['Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance'] },
  { id: 'br3', name: 'Monitor', type: 'monitor', permissions: ['Monitor', 'Vehicles (Read)', 'Trips (Read)', 'Risk (Read)'] },
  { id: 'br4', name: 'Dispatcher', type: 'dispatcher', permissions: ['Vehicles', 'Trips', 'Monitor', 'Fence', 'Driving'] },
];

const tenantsList = ['智利物流集团', 'Santiago Transport', 'Valparaiso Logistics', 'Rancagua Fleet Services', 'Quillota Transporte'];

const roleColors: Record<string, string> = {
  admin: '#1677ff',
  operator: '#52c41a',
  monitor: '#faad14',
  dispatcher: '#722ed1',
};

const roleDescs: Record<string, string> = {
  admin: 'biz.role_desc_admin',
  operator: 'biz.role_desc_operator',
  monitor: 'biz.role_desc_monitor',
  dispatcher: 'biz.role_desc_dispatcher',
};

// ============ Component ============
const Biz: React.FC = () => {
  const { t } = useTranslation();
  const bz = useAppStore((s) => s.bz);
  const setBz = useAppStore((s) => s.setBz);
  const tenant = useAppStore((s) => s.tenant);

  // Permissions state
  const [checkedPerms, setCheckedPerms] = useState<string[]>(['Vehicles', 'Risk']);

  // Assets state
  const [assets, setAssets] = useState<AssetItem[]>([]);
  
  useEffect(() => {
    setAssets(getAssetItems());
  }, [tenant]);

  const [vinAssetFilter, setVinAssetFilter] = useState('');
  const [tenantAssetFilter, setTenantAssetFilter] = useState<string[] | undefined>(undefined);
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<React.Key[]>([]);
  const [assetModal, setAssetModal] = useState<{ visible: boolean; type: string; record: AssetItem | null }>({ visible: false, type: '', record: null });
  const [syncLoading, setSyncLoading] = useState(false);

  const handleDeleteAsset = (record: AssetItem) => {
    const vehicleList = [
      'LFWDAU1H6N1A00001', 'LFWDAU1H6N1A00002', 'LFWDAU1H6N1A00003',
      'LFWDAU1H6N1A00004', 'LFWDAU1H6N1A00005',
    ];
    if (vehicleList.includes(record.vin)) {
      message.warning('该资产已关联设备，不可删除');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据无法恢复，是否继续？',
      onOk: () => {
        setAssets(prev => prev.filter(a => a.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleBatchAllocate = () => {
    if (selectedAssetKeys.length === 0) {
      message.warning('请选择指定数据操作');
      return;
    }
    setAssetModal({ visible: true, type: 'allocate', record: null });
  };

  const handleSyncAssets = () => {
    setSyncLoading(true);
    setTimeout(() => {
      setSyncLoading(false);
      message.success('资产同步完成');
    }, 1000);
  };

  // Users state
  const [users, setUsers] = useState<BizUserItem[]>(allBizUsers);
  const [nickFilter, setNickFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BizUserItem | null>(null);
  const [userForm] = Form.useForm();

  // Roles state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm] = Form.useForm();

  // Permissions tab --------------------
  const onPermCheckChange = (values: string[]) => {
    setCheckedPerms(values);
  };

  const renderPermissionsTab = () => (
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('biz.tenant_hierarchy')} size="small">
          <Tree
            defaultExpandAll
            treeData={tenantTreeData}
            onSelect={(keys) => console.log('selected tenant:', keys)}
          />
        </Card>
      </Col>
      <Col span={18}>
        <Card title={t('biz.function_permissions')} size="small">
          <Checkbox.Group
            options={functionPermissions.map((p) => ({ label: t(permI18nMap[p] || p), value: p }))}
            value={checkedPerms}
            onChange={onPermCheckChange}
          />
        </Card>
      </Col>
    </Row>
  );

  // Info tab ---------------------------
  const renderInfoTab = () => (
    <Card title={t('biz.info_title')}>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label={t('tenant.name')}>{tenantInfo.name}</Descriptions.Item>
        <Descriptions.Item label={t('tenant.code')}>{tenantInfo.code}</Descriptions.Item>
        <Descriptions.Item label={t('tenant.admin')}>{tenantInfo.admin}</Descriptions.Item>
        <Descriptions.Item label={t('tenant.contact')}>{tenantInfo.contact}</Descriptions.Item>
        <Descriptions.Item label={t('tenant.phone')}>{tenantInfo.phone}</Descriptions.Item>
        <Descriptions.Item label={t('fence.address')}>{tenantInfo.address}</Descriptions.Item>
        <Descriptions.Item label={t('tenant.created')}>{tenantInfo.created}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  // Assets tab -------------------------
  const handleAssetSearch = () => {
    let filtered = allAssets;
    if (vinAssetFilter) {
      filtered = filtered.filter((a) => matchVinSearch(vinAssetFilter, a.vin));
    }
    if (tenantAssetFilter && tenantAssetFilter.length > 0) {
      const filtered = filtered.filter((a) => {
        if (tenantAssetFilter.includes('__unassigned__')) {
          if (!a.tenant) return true;
        }
        const tenantFilters = tenantAssetFilter.filter(v => v !== '__unassigned__');
        if (tenantFilters.length > 0 && a.tenant) {
          return tenantFilters.includes(a.tenant);
        }
        return !a.tenant && tenantAssetFilter.includes('__unassigned__');
      });
    }
    setAssets(filtered);
  };

  const assetColumns = [
    {
      title: t('veh.vin'),
      dataIndex: 'vin',
      key: 'vin',
      render: (v: string) => maskVin(v),
    },
    {
      title: t('tenant.name'),
      dataIndex: 'tenant',
      key: 'tenant',
    },
    {
      title: t('biz.sync'),
      dataIndex: 'syncedDate',
      key: 'syncedDate',
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: AssetItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => setAssetModal({ visible: true, type: 'allocate', record })}
          >
            {t('biz.allocate')}
          </Button>
          <Button
            type="link"
            onClick={() => setAssetModal({ visible: true, type: 'history', record })}
          >
            {t('biz.history')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAsset(record)}
          >
            {t('biz.action.del', '删除')}
          </Button>
        </Space>
      ),
    },
  ];

  const renderAssetsTab = () => (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder={t('veh.vin')}
            value={vinAssetFilter}
            onChange={(e) => setVinAssetFilter(e.target.value)}
            style={{ width: 180 }}
          />
          <Select
            placeholder={t('biz.all_tenants')}
            allowClear
            mode="multiple"
            style={{ width: 260 }}
            value={tenantAssetFilter}
            onChange={setTenantAssetFilter}
            options={[...tenantsList.map((tn) => ({ value: tn, label: tn })), { value: '__unassigned__', label: '未划拨' }]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleAssetSearch}>
            {t('common.search')}
          </Button>
          <Button icon={<ReloadOutlined />} loading={syncLoading} onClick={handleSyncAssets}>{t('biz.sync', '同步')}</Button>
        </Space>
      </Card>
      <Card 
        title={t('biz.assets_title')} 
        extra={
          <Button 
            type="primary" 
            disabled={selectedAssetKeys.length === 0} 
            onClick={handleBatchAllocate}
          >
            批量划拨 ({selectedAssetKeys.length})
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={assetColumns}
          dataSource={assets}
          rowSelection={{
            selectedRowKeys: selectedAssetKeys,
            onChange: setSelectedAssetKeys,
          }}
          pagination={{ showTotal: (total) => `${total} ${t('common.records')}` }}
        />
      </Card>

      <Modal
        title={`${assetModal.type === 'allocate' ? t('biz.allocate') : t('biz.history')} - ${assetModal.record?.vin ?? ''}`}
        open={assetModal.visible}
        onCancel={() => setAssetModal({ visible: false, type: '', record: null })}
        footer={
          <Button onClick={() => setAssetModal({ visible: false, type: '', record: null })}>
            {t('common.close')}
          </Button>
        }
      >
        {assetModal.type === 'allocate' ? (
          <Form layout="vertical">
            <Form.Item label={t('biz.vehicle_select')}>
              <Input 
                value={assetModal.record ? assetModal.record.vin : `已选择 ${selectedAssetKeys.length} 辆车`} 
                disabled 
              />
            </Form.Item>
            <Form.Item label={t('tenant.name')}>
              <Select
                placeholder={t('biz.all_tenants')}
                options={tenantsList.map((tn) => ({ value: tn, label: tn }))}
              />
            </Form.Item>
          </Form>
        ) : (
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: t('biz.transfer_time', '划拨时间'), dataIndex: 'transferTime', key: 'transferTime' },
              { title: t('biz.operator', '变更人'), dataIndex: 'operator', key: 'operator' },
              { title: t('biz.before_tenant', '划拨前租户'), dataIndex: 'beforeTenant', key: 'beforeTenant' },
              { title: t('biz.after_tenant', '划拨后租户'), dataIndex: 'afterTenant', key: 'afterTenant' },
            ]}
            dataSource={[
              { id: 'h1', beforeTenant: '智利物流集团', afterTenant: 'Santiago Transport', operator: 'Admin', transferTime: '2026-05-01 10:00' },
              { id: 'h2', beforeTenant: 'Santiago Transport', afterTenant: 'Valparaiso Logistics', operator: 'Carlos', transferTime: '2026-04-15 14:30' },
            ]}
          />
        )}
      </Modal>
    </div>
  );

  // Users tab --------------------------
  const handleUserSearch = () => {
    let filtered = allBizUsers;
    if (nickFilter) {
      filtered = filtered.filter((u) => u.nickname.toLowerCase().includes(nickFilter.toLowerCase()));
    }
    if (emailFilter) {
      filtered = filtered.filter((u) => u.email.toLowerCase().includes(emailFilter.toLowerCase()));
    }
    setUsers(filtered);
  };

  const handleUserSave = () => {
    userForm.validateFields().then((values) => {
      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, nickname: values.nickname, email: values.email, role: values.role }
              : u,
          ),
        );
        message.success(t('common.done'));
      } else {
        const newUser: BizUserItem = {
          id: `bu${Date.now()}`,
          nickname: values.nickname,
          email: values.email,
          role: values.role,
          created: new Date().toISOString().slice(0, 10),
        };
        setUsers((prev) => [newUser, ...prev]);
        message.success(t('toast.created'));
      }
      setUserModalOpen(false);
      setEditingUser(null);
      userForm.resetFields();
    });
  };

  const openNewUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalOpen(true);
  };

  const openEditUser = (user: BizUserItem) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalOpen(true);
  };

  const userColumns = [
    { title: t('tenant.nickname'), dataIndex: 'nickname', key: 'nickname' },
    { title: t('tenant.email'), dataIndex: 'email', key: 'email' },
    {
      title: t('tenant.role'),
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <Tag color={roleColors[v.toLowerCase()] || 'default'}>{v}</Tag>
      ),
    },
    { title: t('tenant.created'), dataIndex: 'created', key: 'created' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: BizUserItem) => (
        <Space>
          <Button type="link">{t('biz.action.reset')}</Button>
          <Button type="link" onClick={() => openEditUser(record)}>
            {t('biz.action.edit')}
          </Button>
          <Button type="link" danger>{t('biz.action.del')}</Button>
        </Space>
      ),
    },
  ];

  const renderUsersTab = () => (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder={t('tenant.nickname')}
            value={nickFilter}
            onChange={(e) => setNickFilter(e.target.value)}
            style={{ width: 160 }}
          />
          <Input
            placeholder={t('tenant.email')}
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleUserSearch}>
            {t('common.search')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNewUser}>
            {t('common.add')}
          </Button>
        </Space>
      </Card>
      <Card>
        <Table
          rowKey="id"
          columns={userColumns}
          dataSource={users}
          pagination={{ showTotal: (total) => `${total} ${t('common.records')}` }}
        />
      </Card>

      <Modal
        title={editingUser ? t('biz.edit_user') : t('biz.create_user')}
        open={userModalOpen}
        onOk={handleUserSave}
        onCancel={() => {
          setUserModalOpen(false);
          setEditingUser(null);
          userForm.resetFields();
        }}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="nickname"
            label={t('tenant.nickname')}
            rules={[{ required: true, message: t('tenant.nickname') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('tenant.email')}
            rules={[
              { required: true, message: t('tenant.email') },
              { type: 'email', message: t('tenant.email') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label={t('tenant.role')}
            rules={[{ required: true, message: t('tenant.role') }]}
          >
            <Select
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'Operator', label: 'Operator' },
                { value: 'Monitor', label: 'Monitor' },
                { value: 'Dispatcher', label: 'Dispatcher' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  // Roles tab --------------------------
  const renderRolesTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setRoleModalOpen(true)}>
          {t('biz.new_role')}
        </Button>
      </div>
      <Row gutter={[16, 16]}>
        {rolesData.map((role) => (
          <Col xs={24} sm={12} lg={6} key={role.id}>
            <Card
              title={
                <Tag color={roleColors[role.type] || 'default'} style={{ fontSize: 14, padding: '2px 12px' }}>
                  {role.name}
                </Tag>
              }
              size="small"
              style={{ height: '100%' }}
            >
              <p style={{ color: '#666', fontSize: 13, minHeight: 40 }}>
                {t(roleDescs[role.type] || '')}
              </p>
              <div>
                <strong>Permissions:</strong>
                <ul style={{ paddingLeft: 16, marginTop: 8, fontSize: 12, color: '#555' }}>
                  {role.permissions.map((perm, idx) => (
                    <li key={idx}>{perm}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={t('biz.new_role')}
        open={roleModalOpen}
        onCancel={() => {
          setRoleModalOpen(false);
          roleForm.resetFields();
        }}
        onOk={() => {
          roleForm.validateFields().then(() => {
            message.success(t('toast.created'));
            setRoleModalOpen(false);
            roleForm.resetFields();
          });
        }}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            name="roleName"
            label={t('tenant.role')}
            rules={[{ required: true, message: t('tenant.role') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('biz.function_permissions')}>
            <Checkbox.Group
              options={functionPermissions.map((p) => ({ label: t(permI18nMap[p] || p), value: p }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  // ============ Main render ============
  const tabItems = [
    { key: 'permission', label: t('biz.tab.permissions'), children: renderPermissionsTab() },
    { key: 'info', label: t('biz.tab.info'), children: renderInfoTab() },
    { key: 'assets', label: t('biz.tab.assets'), children: renderAssetsTab() },
    { key: 'users', label: t('biz.tab.users'), children: renderUsersTab() },
    { key: 'roles', label: t('biz.tab.roles'), children: renderRolesTab() },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('title.biz')}</h2>
        <span style={{ color: '#666', fontSize: 13 }}>{t('tenant.sub')}</span>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            {tabItems.map((tab) => (
              <Button
                key={tab.key}
                type={bz === tab.key ? 'primary' : 'default'}
                onClick={() => setBz(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </Space>
        </div>
        <div>
          {tabItems.find((t) => t.key === bz)?.children}
        </div>
      </Card>
    </div>
  );
};

export default Biz;
