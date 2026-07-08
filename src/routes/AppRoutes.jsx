import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import BoletasPage from '../pages/BoletasPage.jsx';
import ClientesPage from '../pages/ClientesPage.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import NoPermissionPage from '../pages/NoPermissionPage.jsx';
import ChangePasswordPage from '../pages/ChangePasswordPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sin-permiso" element={<NoPermissionPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cambiar-clave" element={<ChangePasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boletas" element={<BoletasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="ADMIN" />}>
        <Route element={<MainLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
