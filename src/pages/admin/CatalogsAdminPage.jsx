import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CircleHelp, Factory, PackageSearch, Plus, Save, Tag, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { deleteCatalogItem, fetchAdminCatalogs, saveCatalogItem } from '../../services/adminService.js';

const tabs = [
  { id: 'tipos', label: 'Tipos', icon: Camera },
  { id: 'fabricantes', label: 'Fabricantes', icon: Factory },
  { id: 'modelos', label: 'Modelos', icon: PackageSearch },
  { id: 'preguntas', label: 'Preguntas', icon: CircleHelp },
  { id: 'categorias', label: 'Categorías', icon: Tag },
];

export default function CatalogsAdminPage() {
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tipos');
  const [message, setMessage] = useState(null);

  const catalogsQuery = useQuery({
    queryKey: ['admin-catalogs'],
    queryFn: () => fetchAdminCatalogs(sessionToken),
    enabled: Boolean(sessionToken),
  });

  const catalogs = catalogsQuery.data || { tipos: [], fabricantes: [], modelos: [], preguntas: [], categorias: [] };
  const typeNames = useMemo(() => catalogs.tipos.map((item) => item.nombre || item.Nombre).filter(Boolean), [catalogs.tipos]);
  const manufacturerNames = useMemo(() => catalogs.fabricantes.map((item) => item.nombre || item.Nombre).filter(Boolean), [catalogs.fabricantes]);

  const saveMutation = useMutation({
    mutationFn: ({ catalog, item }) => saveCatalogItem(sessionToken, catalog, item),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-catalogs'] });
      setMessage({ type: 'success', text: 'Catálogo guardado correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ catalog, itemId }) => deleteCatalogItem(sessionToken, catalog, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-catalogs'] });
      setMessage({ type: 'success', text: 'Registro eliminado correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  function save(catalog, item) {
    saveMutation.mutate({ catalog, item });
  }

  function remove(catalog, itemId) {
    deleteMutation.mutate({ catalog, itemId });
  }

  return (
    <div className="page admin-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Catálogos</h1>
          <p>Tipos de dispositivo, fabricantes, modelos, preguntas dinámicas y categorías.</p>
        </div>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} type="button">
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tipos' && <SimpleCatalogPanel catalog="tipos" title="Tipos de dispositivo" placeholder="Ej. Cámara" rows={catalogs.tipos} onSave={save} onDelete={remove} />}
      {activeTab === 'fabricantes' && <SimpleCatalogPanel catalog="fabricantes" title="Fabricantes" placeholder="Ej. Axis" rows={catalogs.fabricantes} onSave={save} onDelete={remove} />}
      {activeTab === 'categorias' && <SimpleCatalogPanel catalog="categorias" title="Categorías" placeholder="Ej. M.correctivo" rows={catalogs.categorias} onSave={save} onDelete={remove} />}
      {activeTab === 'modelos' && <ModelsPanel rows={catalogs.modelos} typeNames={typeNames} manufacturerNames={manufacturerNames} onSave={save} onDelete={remove} />}
      {activeTab === 'preguntas' && <QuestionsPanel rows={catalogs.preguntas} typeNames={typeNames} onSave={save} onDelete={remove} />}
    </div>
  );
}

function SimpleCatalogPanel({ catalog, title, placeholder, rows, onSave, onDelete }) {
  const [form, setForm] = useState({ id: '', nombre: '', activo: true });

  function submit() {
    if (!form.nombre.trim()) return;
    onSave(catalog, { ...form, nombre: form.nombre.trim(), Nombre: form.nombre.trim() });
    setForm({ id: '', nombre: '', activo: true });
  }

  return (
    <CatalogSection
      title={title}
      form={
        <>
          <Field label="ID" value={form.id || 'Automático'} disabled />
          <Field label="Nombre" value={form.nombre} onChange={(value) => setForm({ ...form, nombre: value })} placeholder={placeholder} />
          <label className="check-item"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />Activo</label>
          <button className="btn btn-primary" type="button" onClick={submit}><Save size={18} /> Guardar</button>
        </>
      }
      rows={rows}
      columns={['nombre', 'activo']}
      onEdit={(row) => setForm({ id: row.id || row.ID || '', nombre: row.nombre || row.Nombre || '', activo: row.activo ?? row.Activo ?? true })}
      onDelete={(row) => onDelete(catalog, row.id || row.ID || row.nombre || row.Nombre)}
    />
  );
}

function ModelsPanel({ rows, typeNames, manufacturerNames, onSave, onDelete }) {
  const [form, setForm] = useState({ id: '', tipoDispositivo: typeNames[0] || '', fabricante: manufacturerNames[0] || '', modelo: '', imagenReferencia: '', activo: true });

  function submit() {
    if (!form.tipoDispositivo || !form.fabricante || !form.modelo.trim()) return;
    onSave('modelos', { ...form, modelo: form.modelo.trim(), Modelo: form.modelo.trim() });
    setForm({ ...form, id: '', modelo: '', imagenReferencia: '' });
  }

  return (
    <CatalogSection
      title="Modelos por dispositivo y fabricante"
      form={
        <>
          <Select label="Tipo de dispositivo" value={form.tipoDispositivo} options={typeNames} onChange={(value) => setForm({ ...form, tipoDispositivo: value })} />
          <Select label="Fabricante" value={form.fabricante} options={manufacturerNames} onChange={(value) => setForm({ ...form, fabricante: value })} />
          <Field label="Modelo" value={form.modelo} onChange={(value) => setForm({ ...form, modelo: value })} placeholder="Ej. P3265-LVE" />
          <Field label="Imagen referencia" value={form.imagenReferencia} onChange={(value) => setForm({ ...form, imagenReferencia: value })} />
          <button className="btn btn-primary" type="button" onClick={submit}><Plus size={18} /> Guardar modelo</button>
        </>
      }
      rows={rows}
      columns={['tipoDispositivo', 'fabricante', 'modelo', 'imagenReferencia']}
      onEdit={(row) => setForm({ ...form, ...row, modelo: row.modelo || row.Modelo || '', tipoDispositivo: row.tipoDispositivo || row.TipoDispositivo || '', fabricante: row.fabricante || row.Fabricante || '' })}
      onDelete={(row) => onDelete('modelos', row.id || row.ID || row.modelo || row.Modelo)}
    />
  );
}

function QuestionsPanel({ rows, typeNames, onSave, onDelete }) {
  const [form, setForm] = useState({ id: '', tipoDispositivo: typeNames[0] || '', pregunta: '', tipoRespuesta: 'Sí/No', obligatorio: true, activo: true });

  function submit() {
    if (!form.tipoDispositivo || !form.pregunta.trim()) return;
    onSave('preguntas', { ...form, pregunta: form.pregunta.trim(), Pregunta: form.pregunta.trim() });
    setForm({ ...form, id: '', pregunta: '' });
  }

  return (
    <CatalogSection
      title="Preguntas dinámicas por dispositivo"
      form={
        <>
          <Select label="Tipo de dispositivo" value={form.tipoDispositivo} options={typeNames} onChange={(value) => setForm({ ...form, tipoDispositivo: value })} />
          <Field label="Pregunta" value={form.pregunta} onChange={(value) => setForm({ ...form, pregunta: value })} placeholder="Ej. Limpieza" />
          <Select label="Tipo respuesta" value={form.tipoRespuesta} options={['Sí/No', 'Texto', 'Número', 'Lista']} onChange={(value) => setForm({ ...form, tipoRespuesta: value })} />
          <label className="check-item"><input type="checkbox" checked={form.obligatorio} onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })} />Obligatorio</label>
          <button className="btn btn-primary" type="button" onClick={submit}><Plus size={18} /> Guardar pregunta</button>
        </>
      }
      rows={rows}
      columns={['tipoDispositivo', 'pregunta', 'tipoRespuesta', 'obligatorio']}
      onEdit={(row) => setForm({ ...form, ...row, pregunta: row.pregunta || row.Pregunta || '', tipoDispositivo: row.tipoDispositivo || row.TipoDispositivo || '' })}
      onDelete={(row) => onDelete('preguntas', row.id || row.ID || row.pregunta || row.Pregunta)}
    />
  );
}

function CatalogSection({ title, form, rows, columns, onEdit, onDelete }) {
  return (
    <div className="grid-2 catalog-layout">
      <form className="card enterprise-card form-card" onSubmit={(e) => e.preventDefault()}>
        <h2>{title}</h2>
        {form}
      </form>

      <div className="card enterprise-card table-card">
        <h2>Registros</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr>{columns.map((column) => <th key={column}>{formatColumn(column)}</th>)}<th>Acciones</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row.ID || JSON.stringify(row)}>
                  {columns.map((column) => <td key={column}>{formatValue(row[column] ?? row[toPascal(column)])}</td>)}
                  <td><div className="row-actions"><button className="btn btn-secondary compact-btn" type="button" onClick={() => onEdit(row)}>Editar</button><button className="icon-button danger" type="button" onClick={() => onDelete(row)}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled = false, placeholder = '' }) {
  return <label className="field"><span>{label}</span><input disabled={disabled} value={value || ''} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange }) {
  return <label className="field"><span>{label}</span><select value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function toPascal(value) { return String(value).charAt(0).toUpperCase() + String(value).slice(1); }
function formatColumn(value) { return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()); }
function formatValue(value) { if (typeof value === 'boolean') return value ? 'Sí' : 'No'; return value || '-'; }
