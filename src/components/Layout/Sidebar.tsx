import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  CarOutlined,
  MonitorOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  ProfileOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '@/store';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const setMt = useAppStore((s) => s.setMt);
  const setRt = useAppStore((s) => s.setRt);
  const setDt = useAppStore((s) => s.setDt);
  const setBt = useAppStore((s) => s.setBt);
  const setBz = useAppStore((s) => s.setBz);

  const currentPath = location.pathname;

  const [openKeys, setOpenKeys] = React.useState<string[]>([]);

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('menu.home'),
    },
    {
      key: 'sub_vehicles',
      icon: <CarOutlined />,
      label: t('menu.vehicles'),
      children: [
        { key: '/vehicles', label: t('sidebar.vehicle_list') },
      ],
    },
    {
      key: 'sub_monitor',
      icon: <MonitorOutlined />,
      label: t('menu.monitor'),
      children: [
        { key: '/monitor?tab=location', label: t('sidebar.realtime_location') },
        { key: '/monitor?tab=playback', label: t('sidebar.trajectory_playback') },
      ],
    },
    {
      key: 'sub_risk',
      icon: <WarningOutlined />,
      label: t('menu.risk'),
      children: [
        { key: '/risk?tab=fence', label: t('sidebar.fence_alerts') },
        { key: '/risk?tab=fault', label: t('sidebar.fault_alerts') },
        { key: '/risk?tab=battery', label: t('sidebar.battery_alerts') },
      ],
    },
    {
      key: 'sub_driving',
      icon: <SafetyOutlined />,
      label: t('menu.driving'),
      children: [
        { key: '/driving?tab=alert', label: t('sidebar.driving_alerts') },
        { key: '/driving?tab=report', label: t('sidebar.driving_reports') },
      ],
    },
    {
      key: 'sub_battery',
      icon: <ThunderboltOutlined />,
      label: t('menu.battery'),
      children: [
        { key: '/battery?tab=monitor', label: t('sidebar.battery_monitor') },
        { key: '/battery?tab=charge', label: t('sidebar.charge_records') },
      ],
    },
    {
      key: 'sub_trips',
      icon: <EnvironmentOutlined />,
      label: t('menu.trips'),
      children: [
        { key: '/trips', label: t('sidebar.trip_records') },
      ],
    },
    {
      key: 'sub_fence',
      icon: <EnvironmentOutlined />,
      label: t('menu.fence'),
      children: [
        { key: '/fence', label: t('sidebar.fence_management') },
      ],
    },
    {
      key: 'sub_repair',
      icon: <ToolOutlined />,
      label: t('menu.repair'),
      children: [
        { key: '/repair', label: t('sidebar.repair_records') },
      ],
    },
    {
      key: 'sub_tenant',
      icon: <TeamOutlined />,
      label: t('menu.tenant'),
      children: [
        { key: '/tenant', label: t('sidebar.tenant_management') },
      ],
    },
    {
      key: 'sub_biz',
      icon: <ProfileOutlined />,
      label: t('menu.biz'),
      children: [
        { key: '/biz?tab=permission', label: t('sidebar.tenant_permissions') },
        { key: '/biz?tab=info', label: t('sidebar.tenant_info') },
        { key: '/biz?tab=assets', label: t('sidebar.asset_allocation') },
        { key: '/biz?tab=users', label: t('sidebar.user_management') },
        { key: '/biz?tab=roles', label: t('sidebar.role_management') },
      ],
    },
    {
      key: 'sub_vehicle_data',
      icon: <DatabaseOutlined />,
      label: t('menu.vehicle_data'),
      children: [
        { key: '/vehicle-signal', label: t('sidebar.vehicle_signal') },
        { key: '/data-export', label: t('sidebar.data_export') },
      ],
    },
    {
      key: 'sub_sys',
      icon: <SettingOutlined />,
      label: t('menu.sys'),
      children: [
        { key: '/sys/users', label: t('sidebar.user_management') },
        { key: '/sys/roles', label: t('sidebar.role_management') },
        { key: '/sys/audit-log', label: t('sidebar.audit_log') },
      ],
    },
  ];

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('sub_')) return;

    const url = new URL(key, window.location.origin);
    const path = url.pathname;
    const tab = url.searchParams.get('tab');

    if (tab) {
      if (path === '/monitor') setMt(tab);
      else if (path === '/risk') setRt(tab);
      else if (path === '/driving') setDt(tab);
      else if (path === '/battery') setBt(tab);
      else if (path === '/biz') setBz(tab);
    }
    navigate(path);
  };

  const getSelectedKey = () => {
    let key = currentPath;
    const store = useAppStore.getState();
    if (currentPath.startsWith('/vehicles')) key = '/vehicles';
    if (currentPath === '/monitor') key = `/monitor?tab=${store._mt}`;
    if (currentPath === '/risk') key = `/risk?tab=${store._rt}`;
    if (currentPath === '/driving') key = `/driving?tab=${store._dt}`;
    if (currentPath === '/battery') key = `/battery?tab=${store._bt}`;
    if (currentPath === '/biz') key = `/biz?tab=${store.bz}`;
    if (currentPath === '/sys') key = '/sys/users';
    if (currentPath.startsWith('/sys/')) key = currentPath;
    return key;
  };

  const selectedKeys = [getSelectedKey(), currentPath];

  React.useEffect(() => {
    const map: Record<string, string> = {
      '/vehicles': 'sub_vehicles',
      '/monitor': 'sub_monitor',
      '/risk': 'sub_risk',
      '/driving': 'sub_driving',
      '/battery': 'sub_battery',
      '/trips': 'sub_trips',
      '/fence': 'sub_fence',
      '/repair': 'sub_repair',
      '/tenant': 'sub_tenant',
      '/biz': 'sub_biz',
      '/vehicle-signal': 'sub_vehicle_data',
      '/data-export': 'sub_vehicle_data',
      '/sys/users': 'sub_sys',
      '/sys/roles': 'sub_sys',
      '/sys/audit-log': 'sub_sys',
    };
    const rootPath = '/' + currentPath.split('/')[1];
    const parent = map[currentPath] || map[rootPath];
    if (parent && !openKeys.includes(parent)) {
      setOpenKeys([parent]);
    }
  }, [currentPath]);

  return (
    <div
      style={{
        width: collapsed ? 80 : 200,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #f0f0f0',
        background: '#fff',
        transition: 'width 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: '1px solid #f0f0f0',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <circle cx="16" cy="16" r="14" stroke="#1677ff" strokeWidth="2" fill="#e6f4ff" />
          <path
            d="M16 6V16L22 20"
            stroke="#1677ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="2" fill="#1677ff" />
        </svg>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', color: '#1677ff' }}>
            {t('app.logo', 'WINDROSE')}
          </span>
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={menuItems}
        onClick={handleClick}
        style={{ borderRight: 'none', flex: 1, overflowY: 'auto' }}
        inlineIndent={16}
      />
    </div>
  );
};

export default Sidebar;
