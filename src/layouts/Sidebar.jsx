import { NavLink } from 'react-router-dom';
import { ClipboardList, Home, Settings, Users, Building2, Tag, Boxes } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { isAdmin } from '../utils/authNormalize.js';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/boletas', label: 'Boletas', icon: ClipboardList },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
];

const adminNav = [
  { to: '/admin', label: 'Administración', icon: Settings },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/clientes', label: 'Admin clientes', icon: Building2 },
  { to: '/admin/categorias', label: 'Categorías', icon: Tag },
  { to: '/admin/catalogos', label: 'Catálogos', icon: Boxes },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  const showAdmin = isAdmin(user);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">DMS</div>
        <div>
          <strong>Boletas</strong>
          <span>Servicio técnico</span>
        </div>
      </div>

      <nav>
        {nav.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        {showAdmin ? (
          <>
            <div className="nav-section">Admin</div>
            {adminNav.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}
