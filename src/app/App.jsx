import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import BoletasPage from '../pages/boletas/BoletasPage.jsx';
import ClientesPage from '../pages/clientes/ClientesPage.jsx';
import AdminPage from '../pages/admin/AdminPage.jsx';
import UsersAdminPage from '../pages/admin/UsersAdminPage.jsx';
import ClientsAdminPage from '../pages/admin/ClientsAdminPage.jsx';
import CategoriesAdminPage from '../pages/admin/CategoriesAdminPage.jsx';
import CatalogsAdminPage from '../pages/admin/CatalogsAdminPage.jsx';
import ConfigAdminPage from '../pages/admin/ConfigAdminPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cambiar-clave" element={<ChangePasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boletas" element={<BoletasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />

          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/usuarios" element={<UsersAdminPage />} />
          <Route path="/admin/clientes" element={<ClientsAdminPage />} />
          <Route path="/admin/categorias" element={<CategoriesAdminPage />} />
          <Route path="/admin/catalogos" element={<CatalogsAdminPage />} />
          <Route path="/admin/configuracion" element={<ConfigAdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
