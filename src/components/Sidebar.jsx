import { NavLink } from 'react-router-dom';
import { BarChart3, ClipboardList, Users, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/boletas', label: 'Boletas', icon: ClipboardList },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/admin', label: 'Administración', icon: Settings, permission: 'ADMIN' },
];

export default function Sidebar() {
  const { hasPermission } = useAuth();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><ShieldCheck size={22} /></div>
        <div>
          <strong>DMS</strong>
          <span>Boletas Web</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.filter(i => hasPermission(i.permission)).map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
