import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export default function ClientesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['clientes'], queryFn: api.listClientes });
  const rows = data?.rows || data?.clientes || [];

  return (
    <div className="page">
      <div className="page-title row-between">
        <div>
          <h2>Clientes</h2>
          <p>Consulta de clientes. La edición vendrá en Fase 2.</p>
        </div>
      </div>
      {isLoading && <p>Cargando clientes...</p>}
      {error && <div className="warning-box">Todavía falta ajustar el endpoint listClientes del backend o no hay datos.</div>}
      <div className="table-card">
        <table>
          <thead><tr><th>ID</th><th>Cliente</th><th>Correo</th><th>Chat</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan="4">Sin clientes para mostrar.</td></tr> : rows.map((c, i) => (
              <tr key={c.ClienteID || c.id || i}>
                <td>{c.ClienteID || c.id}</td>
                <td>{c.Cliente || c.Clientes || c.nombre}</td>
                <td>{c.CorreoCliente || c.Correo || c.correo}</td>
                <td>{c.ChatURL ? 'Configurado' : 'Sin chat'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
