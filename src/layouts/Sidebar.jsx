import { NavLink } from 'react-router-dom';
import { Boxes, Building2, ClipboardList, Home, Settings, Tag, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { hasPermission, PERMISSIONS } from '../utils/authNormalize.js';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/boletas', label: 'Boletas', icon: ClipboardList, permission: PERMISSIONS.BOLETAS_VIEW },
  { to: '/clientes', label: 'Clientes', icon: Building2, permission: PERMISSIONS.CLIENTES_VIEW },
];

const adminNav = [
  { to: '/admin', label: 'Administración', icon: Settings, permission: PERMISSIONS.ADMIN_VIEW },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, permission: PERMISSIONS.USERS_MANAGE },
  { to: '/admin/clientes', label: 'Admin clientes', icon: Building2, permission: PERMISSIONS.CLIENTES_EDIT },
  { to: '/admin/categorias', label: 'Categorías', icon: Tag, permission: PERMISSIONS.CATALOGS_MANAGE },
  { to: '/admin/catalogos', label: 'Catálogos', icon: Boxes, permission: PERMISSIONS.CATALOGS_MANAGE },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings, permission: PERMISSIONS.CONFIG_MANAGE },
];

export function Sidebar() {
  const { user } = useAuth();
  const visibleNav = nav.filter((item) => !item.permission || hasPermission(user, item.permission));
  const visibleAdminNav = adminNav.filter((item) => hasPermission(user, item.permission));

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
        {visibleNav.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        {visibleAdminNav.length ? (
          <>
            <div className="nav-section">Admin</div>
            {visibleAdminNav.map((item) => (
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
