import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { deleteCatalogItem, fetchAdminCatalogs, saveCatalogItem } from '../../services/adminService.js';

export default function CategoriesAdminPage() {
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ id: '', nombre: '', activo: true });
  const [message, setMessage] = useState(null);

  const catalogsQuery = useQuery({
    queryKey: ['admin-catalogs'],
    queryFn: () => fetchAdminCatalogs(sessionToken),
    enabled: Boolean(sessionToken),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveCatalogItem(sessionToken, 'categorias', { ...form, Nombre: form.nombre }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-catalogs'] });
      setForm({ id: '', nombre: '', activo: true });
      setMessage({ type: 'success', text: 'Categoría guardada correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteCatalogItem(sessionToken, 'categorias', itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-catalogs'] });
      setMessage({ type: 'success', text: 'Categoría eliminada correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const rows = catalogsQuery.data?.categorias || [];

  return (
    <div className="page admin-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Categorías</h1>
          <p>Catálogo usado por boletas: M.correctivo, M.preventivo, Instalación y nuevas categorías.</p>
        </div>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="grid-2 catalog-layout">
        <div className="card enterprise-card form-card">
          <h2>{form.id ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <label className="field"><span>ID</span><input disabled value={form.id || 'Automático'} /></label>
          <label className="field"><span>Nombre</span><input value={form.nombre} placeholder="M.correctivo, M.preventivo, Instalación..." onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
          <label className="check-item"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />Activo</label>
          <button type="button" className="btn btn-primary" onClick={() => saveMutation.mutate()}><Save size={18} /> Guardar categoría</button>
        </div>

        <div className="card enterprise-card table-card">
          <h2>Categorías registradas</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Nombre</th><th>Activo</th><th>Acciones</th></tr></thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id || item.ID || item.nombre || item.Nombre}>
                    <td>{item.nombre || item.Nombre}</td>
                    <td>{item.activo ?? item.Activo ? 'Sí' : 'No'}</td>
                    <td><div className="row-actions"><button className="btn btn-secondary compact-btn" onClick={() => setForm({ id: item.id || item.ID || '', nombre: item.nombre || item.Nombre || '', activo: item.activo ?? item.Activo ?? true })}>Editar</button><button className="icon-button danger" onClick={() => deleteMutation.mutate(item.id || item.ID || item.nombre || item.Nombre)}><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
