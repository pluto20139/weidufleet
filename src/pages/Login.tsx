import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

const { Title, Text } = Typography;

const generateCaptcha = (): string =>
  Math.random().toString(36).slice(2, 6).toUpperCase();

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setPage = useAppStore((s) => s.setPage);
  const setUser = useAppStore((s) => s.setUser);
  const setToken = useAppStore((s) => s.setToken);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);

  useEffect(() => {
    setPage('login');
  }, [setPage]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
  };

  const handleSubmit = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      doLogin('Staff User', values.email);
      setLoading(false);
    }, 800);
  };

  const doLogin = (name: string, email: string) => {
    setUser({ name, email });
    setToken('mock-token-12345');
    setPage('dashboard');
    navigate('/dashboard', { replace: true });
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
          <Form.Item label={t('login.email')} name="email" initialValue="admin@weidu.cl">
            <Input prefix={<MailOutlined />} size="large" placeholder="admin@weidu.cl" />
          </Form.Item>

          <Form.Item label={t('login.pwd')} name="password" initialValue="12345678">
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="12345678" />
          </Form.Item>

          <Form.Item label={t('login.code')} name="captcha" rules={[{ required: true, message: '' }]}>
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

    </div>
  );
};

export default Login;
