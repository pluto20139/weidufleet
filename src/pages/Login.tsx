import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Modal } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store';
import { getTenantItems } from '@/api/mock';

const { Title, Text } = Typography;

const generateCaptcha = (): string =>
  Math.random().toString(36).slice(2, 6).toUpperCase();

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setPage = useAppStore((s) => s.setPage);
  const setUser = useAppStore((s) => s.setUser);
  const setToken = useAppStore((s) => s.setToken);
  const setTenant = useAppStore((s) => s.setTenant);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [forcePwdModalOpen, setForcePwdModalOpen] = useState(false);
  const [forcePwdForm] = Form.useForm();

  useEffect(() => {
    setPage('login');
  }, [setPage]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
  };

  const handleSubmit = (values: any) => {
    // P1-1: captcha validation
    if (values.captcha && values.captcha.toUpperCase() !== captcha) {
      message.error('验证码错误');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulate mustChangePassword for first-time login (initial password)
      const mustChangePwd = values.password === '12345678';
      doLogin('Staff User', values.email, mustChangePwd);
      setLoading(false);
    }, 800);
  };

  const doLogin = (name: string, email: string, mustChangePwd: boolean = false) => {
    setUser({ name, email, mustChangePassword: mustChangePwd });
    setToken('mock-token-12345');

    // P0-3: Select first non-expired tenant
    const tenants = getTenantItems();
    const nonExpiredTenant = tenants.find(t => !t.expired);
    if (nonExpiredTenant) {
      setTenant(nonExpiredTenant.id);
    }

    if (mustChangePwd) {
      // P0-4: Show force password change modal
      setForcePwdModalOpen(true);
    } else {
      setPage('dashboard');
      navigate('/dashboard', { replace: true });
    }
  };

  const handleForcePwdSubmit = () => {
    forcePwdForm.validateFields().then(() => {
      // Update user to no longer require password change
      setUser({ name: 'Staff User', email: useAppStore.getState().user?.email || '', mustChangePassword: false });
      setForcePwdModalOpen(false);
      forcePwdForm.resetFields();
      message.success(t('toast.password_changed'));
      setPage('dashboard');
      navigate('/dashboard', { replace: true });
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4, color: '#1e3a5f' }}>
            {t('app.title')}
          </Title>
          <Text type="secondary">{t('login.sub')}</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            label={t('login.email')}
            name="email"
            initialValue="admin@weidu.cl"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} size="large" placeholder="admin@weidu.cl" />
          </Form.Item>

          <Form.Item
            label={t('login.pwd')}
            name="password"
            initialValue="12345678"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, max: 18, message: '密码长度为8-18位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="12345678" />
          </Form.Item>

          <Form.Item
            label={t('login.code')}
            name="captcha"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              prefix={<KeyOutlined />}
              size="large"
              placeholder={t('login.placeholder')}
              addonAfter={
                <span
                  onClick={refreshCaptcha}
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 4,
                    color: '#2563eb',
                    userSelect: 'none',
                    background: '#f0f5ff',
                    padding: '0 8px',
                    borderRadius: 4,
                  }}
                >
                  {captcha}
                </span>
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ borderRadius: 8, height: 44, fontSize: 16 }}
            >
              {loading ? t('login.signing_in') : t('login.btn')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('app.title')}
          </Text>
        </div>
      </Card>

      {/* P0-4: Force Password Change Modal (not closable) */}
      <Modal
        title={t('login.change_pwd')}
        open={forcePwdModalOpen}
        closable={false}
        maskClosable={false}
        onOk={handleForcePwdSubmit}
        okText={t('common.submit')}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <div style={{ marginBottom: 16, color: '#faad14' }}>
          首次登录或密码已被重置，请修改密码后继续使用。
        </div>
        <Form form={forcePwdForm} layout="vertical">
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

export default Login;
