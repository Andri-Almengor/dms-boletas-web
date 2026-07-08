import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="top-header">
      <div>
        <h1>Sistema de Boletas DMS</h1>
        <p>Gestión técnica, evidencias, PDF, correos y Google Chat.</p>
      </div>
      <div className="user-menu">
        <UserCircle size={24} />
        <div className="user-text">
          <strong>{user?.nombre || user?.name || user?.username || 'Usuario'}</strong>
          <span>{user?.rol || user?.role || 'Técnico'}</span>
        </div>
        <button className="icon-button" onClick={logout} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
