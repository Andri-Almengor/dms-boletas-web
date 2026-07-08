import { ClipboardCheck, Clock, FileText, Users } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenido, {user?.name || user?.username}. Rol detectado: <strong>{user?.role}</strong>.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi icon={FileText} label="Boletas abiertas" value="0" />
        <Kpi icon={ClipboardCheck} label="Finalizadas" value="0" />
        <Kpi icon={Clock} label="Horas registradas" value="0" />
        <Kpi icon={Users} label="Clientes" value="0" />
      </div>

      <div className="card">
        <h2>Estado de la Fase 2</h2>
        <p>
          Ya quedó la base para administración. La siguiente fase conectará formularios completos
          contra los endpoints del backend.
        </p>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="kpi-card">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
