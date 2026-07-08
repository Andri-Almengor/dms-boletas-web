import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard });
  const stats = data?.stats || data || {};

  return (
    <div className="page">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>Resumen inicial del sistema.</p>
      </div>

      {error && <div className="warning-box">No se pudo cargar el dashboard. Se muestran valores temporales.</div>}

      <div className="stats-grid">
        <StatCard title="Boletas abiertas" value={isLoading ? '...' : (stats.abiertas ?? 0)} hint="Pendientes o en proceso" />
        <StatCard title="Finalizadas" value={isLoading ? '...' : (stats.finalizadas ?? 0)} hint="Boletas cerradas" />
        <StatCard title="Clientes" value={isLoading ? '...' : (stats.clientes ?? 0)} hint="Registrados" />
        <StatCard title="Técnicos" value={isLoading ? '...' : (stats.tecnicos ?? 0)} hint="Usuarios activos" />
      </div>

      <div className="panel">
        <h3>Fase 1 instalada</h3>
        <p>La base del frontend ya está lista: login, sesión, rutas protegidas, layout, API central y estructura modular.</p>
      </div>
    </div>
  );
}
