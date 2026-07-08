import { useAuth } from '../auth/AuthContext.jsx';
import { RoleBadge } from '../components/common/RoleBadge.jsx';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div>
        <strong>{user?.name || user?.username || 'Usuario'}</strong>
        <div className="muted">{user?.email || user?.username}</div>
      </div>

      <div className="header-actions">
        <RoleBadge role={user?.role} />
        <button className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </div>
    </header>
  );
}
