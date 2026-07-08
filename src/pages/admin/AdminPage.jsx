import { Link } from 'react-router-dom';
import { Building2, Settings, Tag, Users } from 'lucide-react';

const items = [
  { to: '/admin/usuarios', title: 'Usuarios', text: 'Crear usuarios, roles y permisos.', icon: Users },
  { to: '/admin/clientes', title: 'Clientes', text: 'Administrar clientes, contactos, chats y notas.', icon: Building2 },
  { to: '/admin/categorias', title: 'Categorías', text: 'Administrar categorías de boletas.', icon: Tag },
  { to: '/admin/configuracion', title: 'Configuración', text: 'Correos CC, Chat, modo prueba y Drive.', icon: Settings },
];

export default function AdminPage() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Administración</h1>
        <p>Panel inicial para configurar el sistema.</p>
      </div>

      <div className="admin-grid">
        {items.map((item) => (
          <Link className="admin-card" to={item.to} key={item.to}>
            <item.icon />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
