import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export default function BoletasPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['boletas'], queryFn: () => api.listBoletas({ limit: 20 }) });
  const rows = data?.rows || data?.boletas || [];

  return (
    <div className="page">
      <div className="page-title row-between">
        <div>
          <h2>Boletas</h2>
          <p>Listado inicial conectado al backend.</p>
        </div>
        <button className="primary-button">Nueva boleta</button>
      </div>
      {isLoading && <p>Cargando boletas...</p>}
      {error && <div className="warning-box">Todavía falta ajustar el endpoint listBoletas del backend o no hay datos.</div>}
      <div className="table-card">
        <table>
          <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan="5">Sin boletas para mostrar.</td></tr> : rows.map((b, i) => (
              <tr key={b.BoletaID || b.id || i}>
                <td>{b.BoletaID || b.id}</td>
                <td>{b.Titulo || b.titulo}</td>
                <td>{b.Cliente || b.cliente}</td>
                <td>{b.Estado || b.estado}</td>
                <td>{b.Fecha || b.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
