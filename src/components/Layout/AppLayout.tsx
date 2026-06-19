import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '@/store';

const { Sider, Header, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth check from store: if the store indicates a login page or no user, redirect
  const page = useAppStore((s) => s.page);
  const user = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);

  // Demo Mode: Relax authentication guard to prevent redirecting on page refresh.
  // We only redirect if the page state explicitly says we are on 'login'.
  React.useEffect(() => {
    if (page === 'login') {
      navigate('/login', { replace: true });
    }
    if (user?.mustChangePassword && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [page, navigate, user, location.pathname]);

  // If we're on the login page according to the store, don't render the layout
  if (page === 'login') {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: 0,
            background: '#fff',
            height: 56,
            lineHeight: '56px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Topbar />
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 56px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
