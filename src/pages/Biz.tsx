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
  TreeSelect,
  Checkbox,
  Descriptions,
  Space,
  Row,
  Col,
  Radio,
  message,
  Tooltip,
  Typography,
} from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
  { id: 'br1', name: 'Admin', type: 'admin', permissions: ['Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance', 'Monitor', 'Tenant Config', 'User Mgmt', 'Role Mgmt', 'Asset Allocation'], linkedUserCount: 1 },
  { id: 'br2', name: 'Operator', type: 'operator', permissions: ['Vehicles', 'Risk', 'Driving', 'Battery', 'Trips', 'Fence', 'Maintenance'], linkedUserCount: 2 },
  { id: 'br3', name: 'Monitor', type: 'monitor', permissions: ['Monitor', 'Vehicles (Read)', 'Trips (Read)', 'Risk (Read)'], linkedUserCount: 1 },
  { id: 'br4', name: 'Dispatcher', type: 'dispatcher', permissions: ['Vehicles', 'Trips', 'Monitor', 'Fence', 'Driving'], linkedUserCount: 1 },
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

const getAllTreeKeys = (nodes: TreeDataNode[]): string[] =>
  nodes.flatMap(n => [n.key as string, ...(n.children ? getAllTreeKeys(n.children) : [])]);

// ============ Component ============
const Biz: React.FC = () => {
  const { t } = useTranslation();
  const bz = useAppStore((s) => s.bz);
  const setBz = useAppStore((s) => s.setBz);
  const tenant = useAppStore((s) => s.tenant);

  // Permissions state
  const [checkedPerms, setCheckedPerms] = useState<string[]>(['Vehicles', 'Risk']);
  const [selectedTenantKey, setSelectedTenantKey] = useState<string>('root');
  const [selectedRoleTenantKey, setSelectedRoleTenantKey] = useState<string>('root');
  const [permTreeModal, setPermTreeModal] = useState<{ open: boolean; mode: 'add' | 'edit'; parentKey: string; editKey?: string; editName?: string }>({ open: false, mode: 'add', parentKey: '' });

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
  const [assetSyncTimeRange, setAssetSyncTimeRange] = useState<[any, any] | null>(null);

  const handleResetAssets = () => {
    setVinAssetFilter('');
    setTenantAssetFilter(undefined);
    setAssetSyncTimeRange(null);
    setAssets(getAssetItems());
  };

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
  const [userRoleFilter, setUserRoleFilter] = useState<string[] | undefined>(undefined);
  const [userDateRange, setUserDateRange] = useState<[any, any] | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BizUserItem | null>(null);
  const [userForm] = Form.useForm();
  const [resetPwdModal, setResetPwdModal] = useState<{ open: boolean; user: BizUserItem | null; newPwd: string }>({ open: false, user: null, newPwd: '' });

  // Roles state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm] = Form.useForm();
  const [selectedBizRoleId, setSelectedBizRoleId] = useState<string | null>(null);
  const [bizRoleActiveTab, setBizRoleActiveTab] = useState<'function' | 'data'>('function');
  const [bizEditingPerms, setBizEditingPerms] = useState<string[]>([]);
  const [bizEditingDataScope, setBizEditingDataScope] = useState('全部下级租户');
  const [bizInlineEditing, setBizInlineEditing] = useState<{ name: string; isEdit: boolean; editId?: string } | null>(null);

  const selectedBizRole = rolesData.find(r => r.id === selectedBizRoleId) || null;

  // Permissions tab --------------------
  const onPermCheckChange = (values: string[]) => {
    setCheckedPerms(values);
  };

  const handlePermTreeAdd = (parentKey: string) => {
    const name = window.prompt('请输入名称');
    if (name?.trim()) message.success(`已添加: ${name}`);
  };
  const handlePermTreeEdit = (key: string, currentName: string) => {
    const name = window.prompt('修改名称', currentName);
    if (name?.trim()) message.success(`已修改: ${name}`);
  };
  const handlePermTreeDelete = (key: string) => {
    Modal.confirm({ title: '确认删除', content: '如果存在下级时不可删除，是否继续？', onOk: () => message.success('删除成功') });
  };

  const renderPermTreeNode = (nodes: TreeDataNode[]): TreeDataNode[] => nodes.map(node => ({
    ...node,
    title: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span>{String(node.title)}</span>
        {node.key !== 'root' && (
          <Space size={2} onClick={e => e.stopPropagation()}>
            <Button type="text" size="small" icon={<EditOutlined style={{ fontSize: 12 }} />} onClick={() => handlePermTreeEdit(node.key as string, String(node.title))} />
            <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 12 }} />} onClick={() => handlePermTreeDelete(node.key as string)} />
          </Space>
        )}
        {node.key !== 'root' && !node.children?.length && (
          <Button type="text" size="small" icon={<PlusOutlined style={{ fontSize: 12 }} />} onClick={(e) => { e.stopPropagation(); handlePermTreeAdd(node.key as string); }} />
        )}
      </div>
    ),
    children: node.children ? renderPermTreeNode(node.children) : undefined,
  }));

  const renderPermissionsTab = () => (
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('biz.tenant_hierarchy')} size="small" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handlePermTreeAdd('root')}>添加</Button>}>
          <Tree defaultExpandAll treeData={renderPermTreeNode(tenantTreeData)} onSelect={(keys) => console.log('selected tenant:', keys)} />
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
  const [infoTreeSearch, setInfoTreeSearch] = useState('');

  const filterInfoTree = (nodes: TreeDataNode[], keyword: string): TreeDataNode[] => {
    if (!keyword) return nodes;
    return nodes.reduce<TreeDataNode[]>((acc, node) => {
      const title = String(node.title);
      const filteredChildren = node.children ? filterInfoTree(node.children, keyword) : [];
      if (title.toLowerCase().includes(keyword.toLowerCase()) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
      }
      return acc;
    }, []);
  };

  const renderInfoTab = () => (
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('biz.tenant_hierarchy')} size="small">
          <Input placeholder="搜索租户" value={infoTreeSearch} onChange={e => setInfoTreeSearch(e.target.value)} style={{ marginBottom: 8 }} allowClear />
          <Tree defaultExpandAll treeData={filterInfoTree(tenantTreeData, infoTreeSearch)}
            onSelect={(keys) => { if (keys.length) console.log('info tenant selected:', keys); }} />
        </Card>
      </Col>
      <Col span={18}>
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
      </Col>
    </Row>
  );

  // Assets tab -------------------------
  const handleAssetSearch = () => {
    let filtered = [...getAssetItems()];
    if (vinAssetFilter) {
      filtered = filtered.filter((a) => a.vin.toLowerCase() === vinAssetFilter.toLowerCase());
    }
    if (tenantAssetFilter && tenantAssetFilter.length > 0) {
      filtered = filtered.filter((a) => {
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
    if (assetSyncTimeRange && assetSyncTimeRange[0] && assetSyncTimeRange[1]) {
      const start = assetSyncTimeRange[0];
      const end = assetSyncTimeRange[1];
      filtered = filtered.filter((a) => {
        const d = (a as any).syncedDate ? (a as any).syncedDate.slice(0, 10) : '';
        return d >= start.format('YYYY-MM-DD') && d <= end.format('YYYY-MM-DD');
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
          <TreeSelect
            placeholder={t('biz.all_tenants')}
            allowClear
            multiple
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
            style={{ width: 260 }}
            value={tenantAssetFilter}
            onChange={setTenantAssetFilter}
            treeData={[...tenantTreeData.map(n => ({ title: String(n.title), value: String(n.key), children: n.children?.map(c => ({ title: String(c.title), value: String(c.key) })) })), { title: '未划拨', value: '__unassigned__' }]}
          />
          <DatePicker.RangePicker format="YYYY-MM-DD" onChange={(dates) => setAssetSyncTimeRange(dates)} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleAssetSearch}>{t('common.search')}</Button>
          <Button onClick={handleResetAssets}>{t('common.reset')}</Button>
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
    if (userRoleFilter && userRoleFilter.length > 0) {
      filtered = filtered.filter((u) => userRoleFilter.includes(u.role));
    }
    if (userDateRange && userDateRange[0] && userDateRange[1]) {
      const start = userDateRange[0].format('YYYY-MM-DD');
      const end = userDateRange[1].format('YYYY-MM-DD');
      filtered = filtered.filter((u) => u.created >= start && u.created <= end);
    }
    setUsers(filtered);
  };

  const handleResetUsers = () => {
    setNickFilter('');
    setEmailFilter('');
    setUserRoleFilter(undefined);
    setUserDateRange(null);
    setUsers(allBizUsers);
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

  const handleResetPwd = (user: BizUserItem) => {
    Modal.confirm({
      title: '确认重置密码',
      content: `确认将用户 ${user.nickname} 的密码重置为初始密码？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const newPwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setResetPwdModal({ open: true, user, newPwd });
      },
    });
  };

  const handleDeleteUser = (user: BizUserItem) => {
    if (user.role === 'Admin') {
      message.warning('管理员角色账号不可删除');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据无法恢复，是否继续？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        message.success('删除成功');
      },
    });
  };

  const userColumns = [
    { title: t('tenant.index', '序号'), width: 60, render: (_: unknown, __: unknown, i: number) => i + 1 },
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
          <Button type="link" onClick={() => handleResetPwd(record)}>{t('biz.action.reset')}</Button>
          <Button type="link" onClick={() => openEditUser(record)}>{t('biz.action.edit')}</Button>
          {record.role === 'Admin' ? (
            <Tooltip title="管理员角色账号不可删除"><Button type="link" danger disabled>{t('biz.action.del')}</Button></Tooltip>
          ) : (
            <Button type="link" danger onClick={() => handleDeleteUser(record)}>{t('biz.action.del')}</Button>
          )}
        </Space>
      ),
    },
  ];

  const renderUsersTab = () => (
    <>
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('biz.tenant_hierarchy')} size="small">
          <Tree defaultExpandAll treeData={tenantTreeData} selectedKeys={[selectedTenantKey]}
            onSelect={(keys) => { if (keys.length) setSelectedTenantKey(keys[0] as string); }} />
        </Card>
      </Col>
      <Col span={18}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input placeholder={t('tenant.nickname')} value={nickFilter} onChange={(e) => setNickFilter(e.target.value)} style={{ width: 140 }} />
            <Input placeholder={t('tenant.email')} value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} style={{ width: 180 }} />
            <Select mode="multiple" placeholder={t('tenant.role')} allowClear style={{ width: 180 }}
              value={userRoleFilter} onChange={setUserRoleFilter}
              options={rolesData.map(r => ({ value: r.name, label: r.name }))} />
            <DatePicker.RangePicker format="YYYY-MM-DD" onChange={(dates) => setUserDateRange(dates)} />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleUserSearch}>{t('common.search')}</Button>
            <Button onClick={handleResetUsers}>{t('common.reset')}</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewUser}>{t('common.add')}</Button>
          </Space>
        </Card>
        <Card>
          <Table rowKey="id" columns={userColumns} dataSource={users}
            pagination={{ showTotal: (total) => `${total} ${t('common.records')}` }} />
        </Card>
      </Col>
    </Row>

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
                { value: 'Admin', label: 'Admin', disabled: editingUser?.role === 'Admin' },
                { value: 'Operator', label: 'Operator' },
                { value: 'Monitor', label: 'Monitor' },
                { value: 'Dispatcher', label: 'Dispatcher' },
              ]}
              disabled={editingUser?.role === 'Admin'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Result Modal */}
      <Modal
        title="密码已重置"
        open={resetPwdModal.open}
        onOk={() => setResetPwdModal({ open: false, user: null, newPwd: '' })}
        onCancel={() => setResetPwdModal({ open: false, user: null, newPwd: '' })}
        okText={t('common.done')}
        cancelText={t('common.close')}
      >
        <Card size="small" style={{ background: '#f6ffed', marginTop: 12 }}>
          <p><strong>{t('tenant.nickname')}:</strong> {resetPwdModal.user?.nickname}</p>
          <p><strong>{t('tenant.email')}:</strong> {resetPwdModal.user?.email}</p>
          <p><strong>{t('tenant.password')}:</strong> {resetPwdModal.newPwd}</p>
        </Card>
        <Button
          type="primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            if (resetPwdModal.user) {
              navigator.clipboard.writeText(`邮箱:${resetPwdModal.user.email}\n密码:${resetPwdModal.newPwd}`);
              message.success('复制成功');
            }
          }}
        >
          复制信息
        </Button>
      </Modal>
    </>
  );

  // Roles tab --------------------------
  const handleSelectBizRole = (keys: any[]) => {
    if (keys.length === 0) return;
    const roleId = keys[0] as string;
    const role = rolesData.find(r => r.id === roleId);
    if (!role) return;
    setSelectedBizRoleId(roleId);
    setBizEditingPerms([...role.permissions]);
    setBizEditingDataScope('全部下级租户');
    setBizRoleActiveTab('function');
  };

  const handleBizRoleSavePerms = () => {
    if (!selectedBizRoleId) return;
    message.success('保存成功');
  };

  const handleBizRoleCancelPerms = () => {
    if (selectedBizRole) {
      setBizEditingPerms([...selectedBizRole.permissions]);
      setBizEditingDataScope('全部下级租户');
    }
  };

  const handleDeleteBizRole = (role: typeof rolesData[0]) => {
    if (role.type === 'admin') {
      message.warning('管理员角色不可删除');
      return;
    }
    const content = role.linkedUserCount && role.linkedUserCount > 0
      ? '该角色已关联用户，删除后用户无相关权限，是否继续？'
      : '删除后数据无法恢复，是否继续？';
    Modal.confirm({
      title: '确认要删除该角色吗？',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: <span style={{ color: '#ff4d4f' }}>{content}</span>,
      okText: '确定',
      cancelText: '取消',
      onOk: () => message.success('删除成功'),
    });
  };

  const handleBizInlineConfirm = () => {
    if (!bizInlineEditing) return;
    const name = bizInlineEditing.name.trim();
    if (!name) { message.warning('请输入角色名称'); return; }
    const nameExists = rolesData.some(r => r.name === name && r.id !== bizInlineEditing.editId);
    if (nameExists) { message.error('角色名称已存在，请更换'); return; }
    message.success(bizInlineEditing.isEdit ? '修改成功' : '创建成功');
    setBizInlineEditing(null);
  };

  const bizRoleTreeData = rolesData.map(role => {
    const isEditing = bizInlineEditing?.isEdit && bizInlineEditing.editId === role.id;
    if (isEditing) {
      return {
        title: (
          <Space size={4}>
            <Input size="small" value={bizInlineEditing.name}
              onChange={e => setBizInlineEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="请输入角色名称" style={{ width: 140 }} maxLength={10} onPressEnter={handleBizInlineConfirm} />
            <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={handleBizInlineConfirm} />
            <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={() => setBizInlineEditing(null)} />
          </Space>
        ),
        key: role.id,
        isLeaf: true,
      };
    }
    return {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0', background: selectedBizRoleId === role.id ? '#e6f4ff' : 'transparent', borderRadius: 4 }}>
          <span>{role.name}</span>
          <Space size={2} style={{ marginLeft: 8 }} onClick={e => e.stopPropagation()}>
            {role.type === 'admin' ? (
              <Tooltip title="管理员角色不可编辑">
                <Button type="text" size="small" icon={<EditOutlined style={{ fontSize: 12 }} />} disabled />
              </Tooltip>
            ) : (
              <Tooltip title="编辑">
                <Button type="text" size="small" icon={<EditOutlined style={{ fontSize: 12 }} />} onClick={() => setBizInlineEditing({ name: role.name, isEdit: true, editId: role.id })} />
              </Tooltip>
            )}
            {role.type === 'admin' ? (
              <Tooltip title="管理员角色不可删除">
                <Button type="text" size="small" icon={<DeleteOutlined style={{ fontSize: 12 }} />} disabled />
              </Tooltip>
            ) : (
              <Tooltip title="删除">
                <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 12 }} />} onClick={() => handleDeleteBizRole(role)} />
              </Tooltip>
            )}
          </Space>
        </div>
      ),
      key: role.id,
      isLeaf: true,
    };
  });

  const bizPermTreeData = [
    { title: '业务功能', key: 'biz_funcs', children: functionPermissions.map(p => ({ title: t(permI18nMap[p] || p), key: p })) },
    { title: '管理功能', key: 'admin_funcs', children: [
      { title: '租户配置', key: 'Tenant Config' },
      { title: '用户管理', key: 'User Mgmt' },
      { title: '角色管理', key: 'Role Mgmt' },
      { title: '资产分配', key: 'Asset Allocation' },
    ]},
  ];

  const renderRolesTab = () => (
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('biz.tenant_hierarchy')} size="small">
          <Tree defaultExpandAll treeData={tenantTreeData} selectedKeys={[selectedRoleTenantKey]}
            onSelect={(keys) => { if (keys.length) setSelectedRoleTenantKey(keys[0] as string); }} />
        </Card>
      </Col>
      <Col span={18}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setBizInlineEditing({ name: '', isEdit: false })}>
          {t('biz.new_role')}
        </Button>
        {bizInlineEditing && !bizInlineEditing.isEdit && (
          <Space size={4} style={{ marginLeft: 12 }}>
            <Input size="small" value={bizInlineEditing.name}
              onChange={e => setBizInlineEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="请输入角色名称" style={{ width: 180 }} maxLength={10} onPressEnter={handleBizInlineConfirm} />
            <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={handleBizInlineConfirm} />
            <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={() => setBizInlineEditing(null)} />
          </Space>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Role List */}
        <Card size="small" style={{ width: 240, minHeight: 400 }}>
          <Tree treeData={bizRoleTreeData} defaultExpandAll selectedKeys={selectedBizRoleId ? [selectedBizRoleId] : []} onSelect={handleSelectBizRole} blockNode />
        </Card>
        {/* Right: Permission Config */}
        <Card size="small" style={{ flex: 1, minHeight: 400 }}>
          {selectedBizRole ? (
            <>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <Button type={bizRoleActiveTab === 'function' ? 'primary' : 'default'} size="small" onClick={() => setBizRoleActiveTab('function')}>功能权限</Button>
                <Button type={bizRoleActiveTab === 'data' ? 'primary' : 'default'} size="small" onClick={() => setBizRoleActiveTab('data')}>数据权限</Button>
              </div>
              {bizRoleActiveTab === 'function' ? (
                selectedBizRole.type === 'admin' ? (
                  <div style={{ padding: '16px 0', color: '#999' }}>
                    <Typography.Text type="secondary">管理员角色权限不可修改，默认为全部权限。</Typography.Text>
                    <div style={{ marginTop: 12 }}>
                      <Tree checkable defaultExpandAll treeData={bizPermTreeData} checkedKeys={selectedBizRole.permissions} disabled />
                    </div>
                  </div>
                ) : (
                  <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 16 }}>
                    <Tree checkable defaultExpandAll treeData={bizPermTreeData} checkedKeys={bizEditingPerms}
                      onCheck={(keys) => { if (Array.isArray(keys)) setBizEditingPerms(keys as string[]); else setBizEditingPerms(keys.checked as string[]); }} />
                  </div>
                )
              ) : (
                <div style={{ padding: '16px 0' }}>
                  {selectedBizRole.type === 'admin' ? (
                    <Typography.Text type="secondary">管理员角色数据权限默认为“全部下级租户”，不可修改。</Typography.Text>
                  ) : (
                    <Radio.Group value={bizEditingDataScope} onChange={e => setBizEditingDataScope(e.target.value)}>
                      <Space direction="vertical">
                        <Radio value="仅本级">仅本级</Radio>
                        <Radio value="本级+下级">本级+下级</Radio>
                        <Radio value="全部下级">全部下级</Radio>
                        <Radio value="全部下级租户">全部下级租户</Radio>
                      </Space>
                    </Radio.Group>
                  )}
                </div>
              )}
              {selectedBizRole.type !== 'admin' && (
                <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  <Space>
                    <Button type="primary" onClick={handleBizRoleSavePerms}>保存</Button>
                    <Button onClick={handleBizRoleCancelPerms}>取消</Button>
                  </Space>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
              <Typography.Text type="secondary">请从左侧选择一个角色</Typography.Text>
            </div>
          )}
        </Card>
      </div>
      <Modal
        title={t('biz.new_role')}
        open={roleModalOpen}
        onCancel={() => { setRoleModalOpen(false); roleForm.resetFields(); }}
        onOk={() => { roleForm.validateFields().then(() => { message.success(t('toast.created')); setRoleModalOpen(false); roleForm.resetFields(); }); }}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="roleName" label={t('tenant.role')} rules={[{ required: true, message: t('tenant.role') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('biz.function_permissions')}>
            <Checkbox.Group options={functionPermissions.map((p) => ({ label: t(permI18nMap[p] || p), value: p }))} />
          </Form.Item>
        </Form>
      </Modal>
      </Col>
    </Row>
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
        <div>
          {tabItems.find((t) => t.key === bz)?.children}
        </div>
      </Card>
    </div>
  );
};

export default Biz;
