import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from './components/Layout/AppLayout';
import { useAppStore } from './store/useAppStore';

// Lazy-loaded page components
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Vehicles = React.lazy(() => import('./pages/Vehicles'));
const Monitor = React.lazy(() => import('./pages/Monitor'));
const Risk = React.lazy(() => import('./pages/Risk'));
const Driving = React.lazy(() => import('./pages/Driving'));
const Battery = React.lazy(() => import('./pages/Battery'));
const Trips = React.lazy(() => import('./pages/Trips'));
const Fence = React.lazy(() => import('./pages/Fence'));
const Repair = React.lazy(() => import('./pages/Repair'));
const Tenant = React.lazy(() => import('./pages/Tenant'));
const Biz = React.lazy(() => import('./pages/Biz'));
const VehicleSignal = React.lazy(() => import('./pages/VehicleSignal'));
const DataExport = React.lazy(() => import('./pages/DataExport'));
const Sys = React.lazy(() => import('./pages/Sys'));
const SysRoles = React.lazy(() => import('./pages/SysRoles'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));

const PageLoading: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: 200,
    }}
  >
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  const page = useAppStore((s) => s.page);
  const isAuthenticated = page !== 'login';

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Login route - accessible without authentication */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        {/* Protected routes wrapped in AppLayout */}
        <Route path="/" element={<AppLayout />}>
          {/* Root redirects to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Vehicles */}
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:vin" element={<Vehicles />} />

          {/* Monitor */}
          <Route path="monitor" element={<Monitor />} />

          {/* Operations */}
          <Route path="risk" element={<Risk />} />
          <Route path="driving" element={<Driving />} />
          <Route path="battery" element={<Battery />} />
          <Route path="trips" element={<Trips />} />
          <Route path="fence" element={<Fence />} />
          <Route path="repair" element={<Repair />} />

          {/* Admin */}
          <Route path="tenant" element={<Tenant />} />
          <Route path="biz" element={<Biz />} />
          <Route path="vehicle-signal" element={<VehicleSignal />} />
          <Route path="data-export" element={<DataExport />} />
          <Route path="sys/users" element={<Sys />} />
          <Route path="sys/roles" element={<SysRoles />} />
          <Route path="sys/audit-log" element={<AuditLog />} />

          {/* Catch-all: redirect unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
