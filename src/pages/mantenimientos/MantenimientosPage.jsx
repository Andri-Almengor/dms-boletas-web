import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ClipboardCheck, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { emptyMantenimiento, emptyMantenimientoEvidence, fetchMantenimientos, finalizeMantenimiento, saveMantenimiento } from '../../services/mantenimientosService.js';

export default function MantenimientosPage() {
  const { sessionToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', estado: '', fecha: '' });
  const [form, setForm] = useState(emptyMantenimiento());
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);

  const mantenimientosQuery = useQuery({
    queryKey: ['mantenimientos', filters],
    queryFn: () => fetchMantenimientos(sessionToken, filters),
    enabled: Boolean(sessionToken),
  });

  const mantenimientos = mantenimientosQuery.data || [];
  const filtered = useMemo(() => mantenimientos.filter((item) => {
    const haystack = `${item.MantenimientoID} ${item.Cliente} ${item.TituloMantenimiento} ${item.Responsable}`.toLowerCase();
    return (!filters.search || haystack.includes(filters.search.toLowerCase())) &&
      (!filters.estado || item.Estado === filters.estado) &&
      (!filters.fecha || item.Fecha === filters.fecha);
  }), [mantenimientos, filters]);

  const saveMutation = useMutation({
    mutationFn: () => saveMantenimiento(sessionToken, {
      ...form,
      Responsable: form.Responsable || user?.name || user?.email || '',
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      setMessage({ type: 'success', text: 'Mantenimiento guardado correctamente.' });
      closeForm();
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id) => finalizeMantenimiento(sessionToken, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      setMessage({ type: 'success', text: 'Mantenimiento finalizado correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  function openNew() {
    setForm(emptyMantenimiento());
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(item) {
    setForm({ ...emptyMantenimiento(), ...item });
    setShowForm(true);
    setMessage(null);
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyMantenimiento());
  }

  function updateEvidence(id, field, value) {
    setForm((current) => ({
      ...current,
      evidencias: current.evidencias.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  }

  const stats = {
    total: mantenimientos.length,
    pendientes: mantenimientos.filter((item) => item.Estado === 'Pendiente').length,
    finalizados: mantenimientos.filter((item) => String(item.Estado).toLowerCase().includes('final')).length,
    evidencias: mantenimientos.reduce((sum, item) => sum + (item.evidencias?.length || 0), 0),
  };

  return (
    <div className="page mantenimientos-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Fase 7 · Mantenimientos</span>
          <h1>Mantenimientos</h1>
          <p>Control mejorado de mantenimientos con evidencias por dispositivo, estado y checklist técnico.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Nuevo mantenimiento</button>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="kpi-grid">
        <Kpi icon={ClipboardCheck} label="Total" value={stats.total} />
        <Kpi icon={CalendarDays} label="Pendientes" value={stats.pendientes} />
        <Kpi icon={CheckCircle2} label="Finalizados" value={stats.finalizados} />
        <Kpi icon={Search} label="Evidencias" value={stats.evidencias} />
      </div>

      {showForm ? (
        <section className="card enterprise-card maintenance-form-card">
          <div className="section-header compact">
            <div>
              <span className="eyebrow">{form.MantenimientoID || 'Nuevo registro'}</span>
              <h2>{form.TituloMantenimiento || 'Mantenimiento técnico'}</h2>
            </div>
            <button className="icon-button" onClick={closeForm}><X size={18} /></button>
          </div>

          <div className="form-section">
            <h3>Encabezado</h3>
            <div className="form-grid">
              <Field label="ID" value={form.MantenimientoID || 'Automático'} disabled />
              <Field label="Fecha" type="date" value={form.Fecha} onChange={(value) => setForm({ ...form, Fecha: value })} />
              <Field label="Cliente" value={form.Cliente} onChange={(value) => setForm({ ...form, Cliente: value })} />
              <Field label="Título" value={form.TituloMantenimiento} onChange={(value) => setForm({ ...form, TituloMantenimiento: value })} />
              <Field label="Estado" value={form.Estado} onChange={(value) => setForm({ ...form, Estado: value })} />
              <Field label="Responsable" value={form.Responsable} onChange={(value) => setForm({ ...form, Responsable: value })} />
            </div>
            <label className="field">
              <span>Descripción general</span>
              <textarea rows="3" value={form.DescripcionGeneral || ''} onChange={(event) => setForm({ ...form, DescripcionGeneral: event.target.value })} />
            </label>
          </div>

          <div className="form-section">
            <div className="section-header compact">
              <h3>Evidencias por dispositivo</h3>
              <button className="btn btn-secondary" type="button" onClick={() => setForm({ ...form, evidencias: [...form.evidencias, emptyMantenimientoEvidence()] })}>Agregar evidencia</button>
            </div>
            {form.evidencias.length === 0 ? <div className="empty-state small">Sin dispositivos agregados.</div> : null}
            <div className="maintenance-evidence-grid">
              {form.evidencias.map((item) => (
                <div className="maintenance-evidence-card" key={item.id || item.EvidenciaMantenimientoID}>
                  <div className="section-header compact">
                    <strong>{item.NombreDispositivo || 'Dispositivo'}</strong>
                    <button className="icon-button danger" type="button" onClick={() => setForm({ ...form, evidencias: form.evidencias.filter((row) => row.id !== item.id) })}><Trash2 size={17} /></button>
                  </div>
                  <Field label="Nombre" value={item.NombreDispositivo} onChange={(value) => updateEvidence(item.id, 'NombreDispositivo', value)} />
                  <Field label="Zona" value={item.Zona} onChange={(value) => updateEvidence(item.id, 'Zona', value)} />
                  <Field label="Categoría" value={item.Categoria} onChange={(value) => updateEvidence(item.id, 'Categoria', value)} />
                  <Field label="Funcionamiento" value={item.Funcionamiento} onChange={(value) => updateEvidence(item.id, 'Funcionamiento', value)} />
                  <Field label="En uso" value={item.EnUso} onChange={(value) => updateEvidence(item.id, 'EnUso', value)} />
                  <label className="field">
                    <span>Observación</span>
                    <textarea rows="3" value={item.Observacion || ''} onChange={(event) => updateEvidence(item.id, 'Observacion', event.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions sticky-actions">
            <button className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => saveMutation.mutate()}><Save size={18} /> Guardar</button>
          </div>
        </section>
      ) : null}

      <section className="card enterprise-card filters-card">
        <div className="form-grid filters-grid">
          <Field label="Buscar" icon={Search} value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} />
          <Field label="Estado" value={filters.estado} onChange={(value) => setFilters({ ...filters, estado: value })} />
          <Field label="Fecha" type="date" value={filters.fecha} onChange={(value) => setFilters({ ...filters, fecha: value })} />
        </div>
      </section>

      <section className="card enterprise-card table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Fecha</th><th>Cliente</th><th>Título</th><th>Estado</th><th>Responsable</th><th>Evidencias</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.MantenimientoID || item.TituloMantenimiento}>
                  <td><strong>{item.MantenimientoID || '—'}</strong></td>
                  <td>{item.Fecha}</td>
                  <td>{item.Cliente}</td>
                  <td>{item.TituloMantenimiento}</td>
                  <td><span className="status-pill">{item.Estado}</span></td>
                  <td>{item.Responsable}</td>
                  <td>{item.evidencias?.length || 0}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary compact-btn" onClick={() => openEdit(item)}>Editar</button>
                      <button className="btn btn-secondary compact-btn" onClick={() => finalizeMutation.mutate(item.MantenimientoID)}>Finalizar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return <div className="kpi-card enterprise-kpi"><Icon /><span>{label}</span><strong>{value}</strong></div>;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', disabled = false, icon: Icon }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={Icon ? 'input-icon-wrap' : ''}>
        {Icon ? <Icon size={16} /> : null}
        <input disabled={disabled} type={type} value={value || ''} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />
      </div>
    </label>
  );
}
