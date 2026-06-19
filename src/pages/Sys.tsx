import React, { useState, useMemo } from 'react';
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
  Space,
  Steps,
  Result,
  Tooltip,
  DatePicker,
  message,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { BizUserItem } from '@/types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// ============ Mock Data ============
const allSysUsers: BizUserItem[] = [
  { id: 'su1', nickname: '张三', email: 'qinshuai321@163.com', role: 'Admin', created: '2022-12-12 11:24:09' },
  { id: 'su2', nickname: '李四', email: 'qinshuai322@163.com', role: 'Operator', created: '2022-11-12 11:24:09' },
  { id: 'su3', nickname: '王五', email: 'qinshuai323@163.com', role: 'Operator、Monitor', created: '2022-10-12 11:24:09' },
  { id: 'su4', nickname: '赵六', email: 'qinshuai324@163.com', role: 'Operator', created: '2022-09-12 11:24:09' },
  { id: 'su5', nickname: '演示用户', email: 'qinshuai325@163.com', role: 'Monitor', created: '2022-08-12 11:24:09' },
];

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Operator', label: 'Operator' },
  { value: 'Monitor', label: 'Monitor' },
  { value: 'Dispatcher', label: 'Dispatcher' },
];

const roleColors: Record<string, string> = {
  'Admin': '#1677ff',
  'Operator': '#52c41a',
  'Monitor': '#faad14',
  'Dispatcher': '#722ed1',
};

// ============ Component ============
const Sys: React.FC = () => {
  const { t } = useTranslation();

  // ---- Users state ----
  const [users, setUsers] = useState<BizUserItem[]>(allSysUsers);
  const [nickFilter, setNickFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [createTimeRange, setCreateTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BizUserItem | null>(null);
  const [userForm] = Form.useForm();
  const [emailConflict, setEmailConflict] = useState('');

  // Reset password
  const [resetPwdStep, setResetPwdStep] = useState<{ visible: boolean; user: BizUserItem | null; step: number; newPassword: string }>({ visible: false, user: null, step: 0, newPassword: '' });

  // Create user wizard: 0=hidden, 1=step1, 2=step2(success/conflict)
  const [createStep, setCreateStep] = useState(0);
  const [createForm] = Form.useForm();
  const [newUserData, setNewUserData] = useState<{ nickname: string; email: string; roles: string[]; password: string; id: string } | null>(null);
  const [createEmailConflict, setCreateEmailConflict] = useState<BizUserItem | null>(null);

  // ---- User search ----
  const filteredUsers = useMemo(() => {
    let result = users;
    if (nickFilter) result = result.filter(u => u.nickname.toLowerCase().includes(nickFilter.toLowerCase()));
    if (emailFilter) result = result.filter(u => u.email.toLowerCase().includes(emailFilter.toLowerCase()));
    if (roleFilter.length > 0) result = result.filter(u => roleFilter.some(rf => u.role.includes(rf)));
    if (createTimeRange && createTimeRange[0] && createTimeRange[1]) {
      const start = createTimeRange[0];
      const end = createTimeRange[1];
      result = result.filter(u => {
        const d = dayjs(u.created);
        return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day'));
      });
    }
    return result;
  }, [users, nickFilter, emailFilter, roleFilter, createTimeRange]);

  const handleResetSearch = () => {
    setNickFilter('');
    setEmailFilter('');
    setRoleFilter([]);
    setCreateTimeRange(null);
    setUsers([...allSysUsers]);
  };

  // ---- Edit User ----
  const openEditUser = (user: BizUserItem) => {
    setEditingUser(user);
    setEmailConflict('');
    userForm.setFieldsValue({
      nickname: user.nickname,
      email: user.email,
      roles: user.role.split('、'),
    });
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    userForm.validateFields().then((values) => {
      const emailExists = users.some(u => u.email === values.email && u.id !== editingUser?.id);
      if (emailExists) {
        setEmailConflict('该邮箱已被使用，请更换');
        return;
      }
      if (editingUser) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, nickname: values.nickname, email: values.email, role: (values.roles as string[]).join('、') } : u));
        message.success('编辑成功');
      }
      setEditModalOpen(false);
      setEditingUser(null);
      userForm.resetFields();
    });
  };

  // ---- Create User Wizard ----
  const openNewUserWizard = () => {
    setCreateStep(1);
    setNewUserData(null);
    setCreateEmailConflict(null);
    createForm.resetFields();
  };

  const handleCreateNext = () => {
    createForm.validateFields().then((values) => {
      const existingUser = users.find(u => u.email === values.email);
      if (existingUser) {
        setCreateEmailConflict(existingUser);
        setCreateStep(2);
        return;
      }
      const password = (Math.random().toString(36).slice(2, 10) + 'A1!').slice(0, 8).toUpperCase();
      const newId = `CL${Date.now()}`;
      setNewUserData({
        nickname: values.nickname,
        email: values.email,
        roles: values.roles,
        password,
        id: newId,
      });
      setCreateStep(2);
    });
  };

  const handleCreateComplete = () => {
    if (newUserData) {
      const newUser: BizUserItem = {
        id: newUserData.id,
        nickname: newUserData.nickname,
        email: newUserData.email,
        role: newUserData.roles.join('、'),
        created: new Date().toISOString().slice(0, 10),
      };
      setUsers(prev => [newUser, ...prev]);
    }
    setCreateStep(0);
    setNewUserData(null);
    setCreateEmailConflict(null);
    createForm.resetFields();
  };

  const handleCreateBack = () => {
    setCreateStep(1);
    setCreateEmailConflict(null);
    setNewUserData(null);
  };

  const handleCreateClose = () => {
    setCreateStep(0);
    setNewUserData(null);
    setCreateEmailConflict(null);
    createForm.resetFields();
  };

  const handleCopyCreateInfo = () => {
    if (newUserData) {
      navigator.clipboard.writeText(`用户ID:${newUserData.id}\n登录邮箱:${newUserData.email}\n初始密码:${newUserData.password}`);
      message.success('复制成功');
    }
  };

  // ---- Reset Password ----
  const handleResetPwd = (user: BizUserItem) => {
    setResetPwdStep({ visible: true, user, step: 1, newPassword: '' });
  };

  const handleResetPwdConfirm = () => {
    const newPwd = (Math.random().toString(36).slice(2, 10) + 'A1!').slice(0, 8).toUpperCase();
    setResetPwdStep(prev => ({ ...prev, step: 2, newPassword: newPwd }));
  };

  const handleCopyResetInfo = () => {
    navigator.clipboard.writeText(`用户昵称:${resetPwdStep.user?.nickname}\n登录邮箱:${resetPwdStep.user?.email}\n新密码:${resetPwdStep.newPassword}`);
    message.success('复制成功');
  };

  const closeResetPwd = () => {
    setResetPwdStep({ visible: false, user: null, step: 0, newPassword: '' });
  };

  // ---- Delete User ----
  const handleDeleteUser = (user: BizUserItem) => {
    if (user.role === 'Admin' || user.role.includes('Admin')) {
      message.warning('管理员角色用户不可删除');
      return;
    }
    Modal.confirm({
      title: '确认要删除该账号吗？',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: <span style={{ color: '#ff4d4f' }}>删除账号后账号将不可用，是否继续？</span>,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        message.success('删除成功');
      },
    });
  };

  // ---- Columns ----
  const userColumns = [
    { title: '序号', width: 60, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: '用户昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '登录邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => {
        const roles = v.split('、');
        return roles.map((r, i) => (
          <Tag key={i} color={roleColors[r] || 'default'} style={{ marginRight: 2 }}>{r}</Tag>
        ));
      },
    },
    { title: '创建时间', dataIndex: 'created', key: 'created', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: BizUserItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleResetPwd(record)}>重置密码</Button>
          <Button type="link" size="small" onClick={() => openEditUser(record)}>编辑</Button>
          {(record.role === 'Admin' || record.role.includes('Admin')) ? (
            <Tooltip title="管理员角色用户不可删除">
              <Button type="link" danger size="small" disabled>删除</Button>
            </Tooltip>
          ) : (
            <Button type="link" danger size="small" onClick={() => handleDeleteUser(record)}>删除</Button>
          )}
        </Space>
      ),
    },
  ];

  // ---- Render: User List View ----
  if (createStep === 0) {
    return (
      <div>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input placeholder="用户名称" value={nickFilter} onChange={e => setNickFilter(e.target.value)} style={{ width: 140 }} allowClear />
            <Input placeholder="登录邮箱" value={emailFilter} onChange={e => setEmailFilter(e.target.value)} style={{ width: 180 }} allowClear />
            <Select
              mode="multiple"
              placeholder="角色"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ minWidth: 160 }}
              allowClear
              options={roleOptions}
            />
            <RangePicker onChange={dates => setCreateTimeRange(dates)} placeholder={['开始时间', '结束时间']} />
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button onClick={handleResetSearch}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNewUserWizard}>+ 新增用户</Button>
          </Space>
        </Card>
        <Card>
          <Table
            rowKey="id"
            columns={userColumns}
            dataSource={filteredUsers}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: ['10', '20', '50', '100'],
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              showQuickJumper: true,
            }}
          />
        </Card>

        {/* Edit User Modal */}
        <Modal
          title="编辑用户"
          open={editModalOpen}
          onOk={handleEditSave}
          onCancel={() => { setEditModalOpen(false); setEditingUser(null); userForm.resetFields(); setEmailConflict(''); }}
          okText="确定"
          cancelText="取消"
        >
          <Form form={userForm} layout="vertical">
            <Form.Item name="nickname" label="用户昵称" rules={[{ required: true, message: '请输入用户昵称' }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="登录邮箱"
              rules={[
                { required: true, message: '请输入登录邮箱' },
                { type: 'email', message: '请输入正确格式的邮箱' },
              ]}
            >
              <Input onChange={() => setEmailConflict('')} />
            </Form.Item>
            {emailConflict && (
              <div style={{ color: '#ff4d4f', marginTop: -16, marginBottom: 12, fontSize: 12 }}>{emailConflict}</div>
            )}
            <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
              <Select mode="multiple" options={roleOptions} placeholder="请选择角色" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          title={resetPwdStep.step === 2 ? '重置密码' : '确认要重置该账号的密码吗？'}
          open={resetPwdStep.visible}
          onCancel={closeResetPwd}
          footer={
            resetPwdStep.step === 1 ? (
              <Space>
                <Button onClick={closeResetPwd}>取消</Button>
                <Button type="primary" onClick={handleResetPwdConfirm}>确定</Button>
              </Space>
            ) : (
              <Space>
                <Button onClick={closeResetPwd}>关闭</Button>
                <Button type="primary" onClick={handleCopyResetInfo}>复制信息</Button>
              </Space>
            )
          }
        >
          {resetPwdStep.step === 1 && (
            <div>
              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 22, marginRight: 8, verticalAlign: 'middle' }} />
              <span style={{ fontSize: 15 }}>即将重置用户 <strong>{resetPwdStep.user?.nickname}</strong> 的密码</span>
              <p style={{ color: '#ff4d4f', marginTop: 12, marginLeft: 30 }}>重置密码后该账号旧密码将不可用，是否继续？</p>
            </div>
          )}
          {resetPwdStep.step === 2 && (
            <div>
              <div style={{ color: '#52c41a', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
                <span style={{ fontSize: 24, marginRight: 8 }}>✓</span>
                用户密码已重置成功，请使用新密码登录
              </div>
              <Card size="small" style={{ background: '#f6ffed' }}>
                <p><strong>用户昵称：</strong>{resetPwdStep.user?.nickname}</p>
                <p><strong>登录邮箱：</strong>{resetPwdStep.user?.email}</p>
                <p><strong>新密码：</strong><Text code>{resetPwdStep.newPassword}</Text></p>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ---- Render: Create User Wizard ----
  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
        系统管理 / 用户管理 / 新增用户
      </div>

      <Card>
        {/* Steps */}
        <Steps
          current={createStep - 1}
          items={[
            { title: '创建账号' },
            { title: '完成创建' },
          ]}
          style={{ maxWidth: 400, margin: '0 auto 32px' }}
        />

        {/* Step 1: Form */}
        {createStep === 1 && (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Form form={createForm} layout="vertical">
              <Form.Item name="nickname" label="用户昵称" rules={[{ required: true, message: '请输入用户昵称' }]}>
                <Input placeholder="请输入用户昵称" />
              </Form.Item>
              <Form.Item
                name="email"
                label="登录邮箱"
                rules={[
                  { required: true, message: '请输入登录邮箱' },
                  { type: 'email', message: '请输入正确格式的邮箱' },
                ]}
                extra="用于用户登录使用，并验证用户唯一性，请确保邮箱的有效及准确性"
              >
                <Input placeholder="请输入登录邮箱" />
              </Form.Item>
              <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select mode="multiple" options={roleOptions} placeholder="请选择角色" />
              </Form.Item>
            </Form>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button onClick={handleCreateClose}>返回</Button>
                <Button type="primary" onClick={handleCreateNext}>下一步</Button>
              </Space>
            </div>
          </div>
        )}

        {/* Step 2: Success or Conflict */}
        {createStep === 2 && !createEmailConflict && newUserData && (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <Result
              status="success"
              title="创建成功"
              style={{ padding: '24px 0' }}
            />
            <div style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto' }}>
              <p><strong>用户ID：</strong>{newUserData.id}</p>
              <p><strong>登录邮箱：</strong>{newUserData.email}</p>
              <p>
                <strong>初始密码：</strong>
                <Text code>{newUserData.password}</Text>
              </p>
            </div>
            <Button style={{ marginTop: 12 }} onClick={handleCopyCreateInfo}>复制信息</Button>
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button onClick={handleCreateBack}>上一步</Button>
                <Button type="primary" onClick={handleCreateComplete}>完成</Button>
              </Space>
            </div>
          </div>
        )}

        {/* Step 2: Email Conflict */}
        {createStep === 2 && createEmailConflict && (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 48 }} />
              <h3 style={{ marginTop: 12 }}>邮箱关联用户已存在</h3>
            </div>
            <div style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto', padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <p><strong>用户ID：</strong>{createEmailConflict.id}</p>
              <p><strong>登录邮箱：</strong>{createEmailConflict.email}</p>
              <p><strong>用户昵称：</strong>{createEmailConflict.nickname}</p>
            </div>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => {
                navigator.clipboard.writeText(`用户ID:${createEmailConflict.id}\n登录邮箱:${createEmailConflict.email}\n用户昵称:${createEmailConflict.nickname}`);
                message.success('复制成功');
              }}>复制信息</Button>
              <Button type="primary" danger onClick={handleCreateComplete}>使用该账号创建</Button>
            </Space>
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button onClick={handleCreateBack}>上一步</Button>
                <Button type="primary" onClick={handleCreateComplete}>完成</Button>
              </Space>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Sys;
