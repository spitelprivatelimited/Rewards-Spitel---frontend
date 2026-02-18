import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignForm from './pages/CampaignForm';
import Clients from './pages/Clients';
import Redemption from './pages/Redemption';
import Redemptions from './pages/Redemptions';
import Coupons from './pages/Coupons';
import DiningForm from './pages/DiningForm';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<PrivateRoute roles={['ADMIN', 'CLIENT']}><CampaignForm /></PrivateRoute>} />
        <Route path="campaigns/:id/edit" element={<PrivateRoute roles={['ADMIN', 'CLIENT']}><CampaignForm /></PrivateRoute>} />
        <Route path="clients" element={<PrivateRoute roles={['ADMIN']}><Clients /></PrivateRoute>} />
        <Route path="redeem" element={<Redemption />} />
        <Route path="redemptions" element={<Redemptions />} />
        <Route path="coupons" element={<PrivateRoute roles={['ADMIN', 'CLIENT']}><Coupons /></PrivateRoute>} />
        <Route path="dining" element={<PrivateRoute roles={['ADMIN', 'CLIENT', 'CASHIER']}><DiningForm /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
