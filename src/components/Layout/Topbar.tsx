import React, { useState } from 'react';
import { Breadcrumb, Avatar, Button, Space, Dropdown, Modal, Form, Input, Select, message, Tag } from 'antd';
import { UserOutlined, KeyOutlined, LogoutOutlined, SwapOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { getTenantItems } from '@/api/mock';

const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': 'menu.home',
  '/vehicles': 'menu.vehicles',
  '/monitor': 'menu.monitor',
  '/risk': 'menu.risk',
  '/driving': 'menu.driving',
  '/battery': 'menu.battery',
  '/trips': 'menu.trips',
  '/fence': 'menu.fence',
  '/repair': 'menu.repair',
  '/tenant': 'menu.tenant',
  '/biz': 'menu.biz',
  '/sys': 'menu.sys',
};

const langLabels: Record<string, { label: string; flag: string }> = {
  zh: { label: '中文', flag: 'ZH' },
  en: { label: 'English', flag: 'EN' },
  es: { label: 'Español', flag: 'ES' },
};

const langOrder = ['zh', 'en', 'es'];

const Topbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const tenant = useAppStore((s) => s.tenant);
  const setTenant = useAppStore((s) => s.setTenant);
  const setToken = useAppStore((s) => s.setToken);
  const setUser = useAppStore((s) => s.setUser);
  const setPage = useAppStore((s) => s.setPage);

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm] = Form.useForm();

  const tenants = getTenantItems();

  const currentBreadcrumbName =
    breadcrumbNameMap[location.pathname] || 'menu.home';

  const handleLangSwitch = () => {
    const currentIndex = langOrder.indexOf(lang);
    const nextIndex = (currentIndex + 1) % langOrder.length;
    const nextLang = langOrder[nextIndex] as any;
    setLang(nextLang);
    i18n.changeLanguage(nextLang);
    dayjs.locale(nextLang === 'zh' ? 'zh-cn' : nextLang);
  };

  const handleChangePassword = () => {
    setPwdModalOpen(true);
  };

  const handlePwdSubmit = () => {
    pwdForm.validateFields().then(() => {
      message.success(t('toast.password_changed'));
      setPwdModalOpen(false);
      pwdForm.resetFields();
    });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setTenant(null);
    setPage('login');
    message.success(t('toast.logged_out'));
    navigate('/login', { replace: true });
  };

  const dropdownItems = [
    {
      key: 'changePwd',
      icon: <KeyOutlined />,
      label: t('login.change_pwd'),
      onClick: handleChangePassword,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={{ color: '#ff4d4f' }}>{t('common.logout')}</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: t('menu.home'),
          },
          {
            title: t(currentBreadcrumbName),
          },
        ]}
      />

      {/* Right side */}
      <Space size="middle">
        {/* Tenant Select Dropdown */}
        <Select
          value={tenant}
          onChange={(val) => {
            const selected = tenants.find(t => t.id === val);
            if (selected?.expired) {
              message.error('该租户服务已过期，无法切换');
              return;
            }
            setTenant(val);
          }}
          style={{ width: tenants.length === 1 ? 160 : 200 }}
          disabled={tenants.length === 1}
          suffixIcon={<SwapOutlined style={{ color: '#999' }} />}
          optionRender={(option) => {
            const t = tenants.find(tn => tn.id === option.value);
            return (
              <span>
                {option.label}
                {t?.expired && <Tag color="red" style={{ marginLeft: 8 }}>服务过期</Tag>}
              </span>
            );
          }}
          options={tenants.map((t) => ({
            value: t.id,
            label: t.name,
            disabled: t.expired === true,
          }))}
        />

        {/* Language Switch Button */}
        <Button size="small" onClick={handleLangSwitch} style={{ minWidth: 60 }}>
          {langLabels[lang]?.flag || 'ZH'}
        </Button>

        {/* User Dropdown */}
        <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size="small"
              style={{ backgroundColor: '#1677ff', verticalAlign: 'middle' }}
              icon={<UserOutlined />}
            />
            <span style={{ fontSize: 14, color: '#333' }}>{t('common.admin')}</span>
          </Space>
        </Dropdown>
      </Space>

      {/* Change Password Modal */}
      <Modal
        title={t('login.change_pwd')}
        open={pwdModalOpen}
        onOk={handlePwdSubmit}
        onCancel={() => {
          setPwdModalOpen(false);
          pwdForm.resetFields();
        }}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label={t('login.old_pwd')}
            rules={[
              { required: true, message: t('login.old_pwd') },
              { min: 6, message: t('login.pwd_min') },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('login.new_pwd')}
            dependencies={['oldPassword']}
            rules={[
              { required: true, message: t('login.new_pwd') },
              { min: 6, message: t('login.pwd_min') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('oldPassword') !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('login.pwd_same')));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('login.confirm_pwd')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('login.confirm_pwd') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('login.pwd_mismatch')));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Topbar;
