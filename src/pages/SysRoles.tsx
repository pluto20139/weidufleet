import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Modal,
  Tree,
  Radio,
  Space,
  Tabs,
  message,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// ============ Types ============
interface RoleData {
  id: string;
  name: string;
  key: string;
  parentId: string | null;
  permissions: string[];
  dataScope: string;
  linkedUserCount: number;
}

// ============ Mock Data ============
const initialRoles: RoleData[] = [
  { id: 'r1', name: '平台运营', key: 'platform_ops', parentId: null, permissions: ['User Management', 'Vehicle Management', 'Trip Management', 'Alert Management', 'Report Generation', 'Monitor', 'Dashboard View', 'Trip Dispatch'], dataScope: '全部下级', linkedUserCount: 3 },
  { id: 'r2', name: '财务', key: 'finance', parentId: 'r1', permissions: ['Report Generation', 'Report View', 'Dashboard View'], dataScope: '仅本级', linkedUserCount: 2 },
  { id: 'r3', name: '业务主管', key: 'biz_lead', parentId: 'r2', permissions: ['Vehicle Management', 'Trip Management', 'Report Generation'], dataScope: '本级+下级', linkedUserCount: 0 },
  { id: 'r4', name: 'System Admin', key: 'admin', parentId: null, permissions: ['User Management', 'Role Management', 'System Config', 'Audit Logs', 'Vehicle Management', 'Trip Management', 'Alert Management', 'Report Generation', 'Monitor', 'Dashboard View', 'Report View', 'Alert View', 'Trip Dispatch', 'Vehicle Assignment', 'Route Planning', 'Fence Management', 'Maintenance Management'], dataScope: '全部下级租户', linkedUserCount: 1 },
  { id: 'r5', name: 'System Monitor', key: 'monitor', parentId: null, permissions: ['Dashboard View', 'Report View', 'Alert View', 'Monitor'], dataScope: '仅本级', linkedUserCount: 1 },
  { id: 'r6', name: 'System Dispatcher', key: 'dispatcher', parentId: null, permissions: ['Trip Dispatch', 'Vehicle Assignment', 'Route Planning'], dataScope: '本级+下级', linkedUserCount: 0 },
];

const permTreeData = [
  {
    title: '系统管理',
    key: 'system',
    children: [
      { title: '用户管理', key: 'User Management' },
      { title: '角色管理', key: 'Role Management' },
      { title: '系统配置', key: 'System Config' },
      { title: '审计日志', key: 'Audit Logs' },
    ],
  },
  {
    title: '业务功能',
    key: 'business',
    children: [
      { title: '车辆管理', key: 'Vehicle Management' },
      { title: '行程管理', key: 'Trip Management' },
      { title: '预警管理', key: 'Alert Management' },
      { title: '报告生成', key: 'Report Generation' },
      { title: '围栏管理', key: 'Fence Management' },
      { title: '维修管理', key: 'Maintenance Management' },
    ],
  },
  {
    title: '监控功能',
    key: 'monitor',
    children: [
      { title: '实时监控', key: 'Monitor' },
      { title: '仪表盘查看', key: 'Dashboard View' },
      { title: '报告查看', key: 'Report View' },
      { title: '预警查看', key: 'Alert View' },
    ],
  },
  {
    title: '调度功能',
    key: 'dispatch',
    children: [
      { title: '行程调度', key: 'Trip Dispatch' },
      { title: '车辆分配', key: 'Vehicle Assignment' },
      { title: '路线规划', key: 'Route Planning' },
    ],
  },
];

// ============ Component ============
const SysRoles: React.FC = () => {
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('function');
  const [editingPerms, setEditingPerms] = useState<string[]>([]);
  const [editingDataScope, setEditingDataScope] = useState('仅本级');

  // Inline editing for new role
  const [inlineEditing, setInlineEditing] = useState<{ parentId: string | null; name: string; isEdit: boolean; editId?: string } | null>(null);

  const selectedRole = roles.find(r => r.id === selectedRoleId) || null;

  // Build tree data from roles
  const buildRoleTree = (): any[] => {
    const rootRoles = roles.filter(r => !r.parentId);
    const getChildren = (parentId: string): any[] => {
      return roles
        .filter(r => r.parentId === parentId)
        .map(r => ({
          title: r.name,
          key: r.id,
          children: getChildren(r.id),
          isLeaf: !roles.some(c => c.parentId === r.id),
        }));
    };
    return rootRoles.map(r => ({
      title: r.name,
      key: r.id,
      children: getChildren(r.id),
      isLeaf: !roles.some(c => c.parentId === r.id),
    }));
  };

  const handleSelectRole = (selectedKeys: any[]) => {
    if (selectedKeys.length === 0) return;
    const roleId = selectedKeys[0] as string;
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    setSelectedRoleId(roleId);
    setEditingPerms([...role.permissions]);
    setEditingDataScope(role.dataScope);
    setActiveTab('function');
  };

  const handleSavePerms = () => {
    if (!selectedRoleId) return;
    setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: [...editingPerms], dataScope: editingDataScope } : r));
    message.success('保存成功');
  };

  const handleCancelPerms = () => {
    if (selectedRole) {
      setEditingPerms([...selectedRole.permissions]);
      setEditingDataScope(selectedRole.dataScope);
    }
  };

  const handleDeleteRole = (role: RoleData) => {
    if (role.key === 'admin') {
      message.warning('管理员角色不可删除');
      return;
    }
    const hasLinked = role.linkedUserCount > 0;
    const content = hasLinked
      ? '该角色已关联用户，删除后用户无相关权限，是否继续？'
      : '删除后数据无法恢复，是否继续？';

    Modal.confirm({
      title: '确认要删除该角色吗？',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: <span style={{ color: '#ff4d4f' }}>{content}</span>,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setRoles(prev => prev.filter(r => r.id !== role.id));
        if (selectedRoleId === role.id) setSelectedRoleId(null);
        message.success('删除成功');
      },
    });
  };

  // Inline new role creation
  const handleStartAddRole = (parentId: string | null = null) => {
    setInlineEditing({ parentId, name: '', isEdit: false });
  };

  const handleStartEditRole = (role: RoleData) => {
    setInlineEditing({ parentId: role.parentId, name: role.name, isEdit: true, editId: role.id });
  };

  const handleConfirmInline = () => {
    if (!inlineEditing) return;
    const name = inlineEditing.name.trim();
    if (!name) {
      message.warning('请输入角色名称');
      return;
    }
    const nameExists = roles.some(r => r.name === name && r.id !== inlineEditing.editId);
    if (nameExists) {
      message.error('角色名称已存在，请更换');
      return;
    }
    if (inlineEditing.isEdit && inlineEditing.editId) {
      setRoles(prev => prev.map(r => r.id === inlineEditing.editId ? { ...r, name } : r));
      message.success('修改成功');
    } else {
      const newRole: RoleData = {
        id: `r${Date.now()}`,
        name,
        key: name.toLowerCase().replace(/\s+/g, '_'),
        parentId: inlineEditing.parentId,
        permissions: [],
        dataScope: '仅本级',
        linkedUserCount: 0,
      };
      setRoles(prev => [...prev, newRole]);
      message.success('创建成功');
    }
    setInlineEditing(null);
  };

  const handleCancelInline = () => {
    setInlineEditing(null);
  };

  // Render role tree node with action icons
  const renderRoleTreeNode = (treeData: any[]): any[] => {
    return treeData.map(node => {
      const role = roles.find(r => r.id === node.key);
      const isInlineEditingThis = inlineEditing?.isEdit && inlineEditing.editId === node.key;

      if (isInlineEditingThis) {
        return {
          title: (
            <Space size={4}>
              <Input
                size="small"
                value={inlineEditing.name}
                onChange={e => setInlineEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="请输入角色名称"
                style={{ width: 160 }}
                onPressEnter={handleConfirmInline}
              />
              <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={handleConfirmInline} />
              <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={handleCancelInline} />
            </Space>
          ),
          key: node.key,
          children: node.children ? renderRoleTreeNode(node.children) : [],
        };
      }

      return {
        title: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '2px 0',
              background: selectedRoleId === node.key ? '#e6f4ff' : 'transparent',
              borderRadius: 4,
            }}
          >
            <span>{node.title}</span>
            {role && (
              <Space size={2} style={{ marginLeft: 8 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ fontSize: 12 }} />}
                    onClick={() => handleStartEditRole(role)}
                  />
                </Tooltip>
                {role.key === 'admin' ? (
                  <Tooltip title="管理员角色不可删除">
                    <Button type="text" size="small" icon={<DeleteOutlined style={{ fontSize: 12 }} />} disabled />
                  </Tooltip>
                ) : (
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                      onClick={() => handleDeleteRole(role)}
                    />
                  </Tooltip>
                )}
              </Space>
            )}
          </div>
        ),
        key: node.key,
        children: node.children ? renderRoleTreeNode(node.children) : undefined,
      };
    });
  };

  const roleTreeData = buildRoleTree();
  const enhancedTreeData = renderRoleTreeNode(roleTreeData);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
        系统管理 / 角色管理
      </div>

      {/* New Role Button */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleStartAddRole(null)}>
          + 新增角色
        </Button>
        {inlineEditing && !inlineEditing.isEdit && (
          <Space size={4} style={{ marginLeft: 12 }}>
            <Input
              size="small"
              value={inlineEditing.name}
              onChange={e => setInlineEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="请输入角色名称"
              style={{ width: 180 }}
              onPressEnter={handleConfirmInline}
            />
            <Button type="text" size="small" icon={<CheckOutlined style={{ color: '#52c41a' }} />} onClick={handleConfirmInline} />
            <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ff4d4f' }} />} onClick={handleCancelInline} />
          </Space>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Role Tree */}
        <Card size="small" style={{ width: 280, minHeight: 400 }}>
          {enhancedTreeData.length > 0 ? (
            <Tree
              treeData={enhancedTreeData}
              defaultExpandAll
              selectedKeys={selectedRoleId ? [selectedRoleId] : []}
              onSelect={handleSelectRole}
              blockNode
            />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
              <Text type="secondary">暂无角色</Text>
            </div>
          )}
        </Card>

        {/* Right: Permission Config */}
        <Card size="small" style={{ flex: 1, minHeight: 400 }}>
          {selectedRole ? (
            <>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'function', label: '功能权限' },
                  { key: 'data', label: '数据权限' },
                ]}
              />

              {activeTab === 'function' ? (
                <>
                  <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 16 }}>
                    <Tree
                      checkable
                      defaultExpandAll
                      treeData={permTreeData}
                      checkedKeys={editingPerms}
                      onCheck={(keys) => {
                        if (Array.isArray(keys)) {
                          setEditingPerms(keys as string[]);
                        } else {
                          setEditingPerms(keys.checked as string[]);
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px 0' }}>
                  <Radio.Group value={editingDataScope} onChange={e => setEditingDataScope(e.target.value)}>
                    <Space direction="vertical">
                      <Radio value="仅本级">仅本级</Radio>
                      <Radio value="本级+下级">本级+下级</Radio>
                      <Radio value="全部下级">全部下级</Radio>
                      <Radio value="全部下级租户">全部下级租户</Radio>
                    </Space>
                  </Radio.Group>
                </div>
              )}

              {/* Bottom actions */}
              <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Space>
                  <Button type="primary" onClick={handleSavePerms}>保存</Button>
                  <Button onClick={handleCancelPerms}>取消</Button>
                </Space>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
              <Text type="secondary">请从左侧选择一个角色</Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SysRoles;
