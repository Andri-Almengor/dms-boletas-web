import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { hasAnyPermission } from '../utils/authNormalize.js';

export function PermissionRoute({ permissions = [] }) {
  const { user } = useAuth();

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
