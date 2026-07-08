import { useMemo, useState } from 'react';
import { CalendarDays, FileText, Filter, Plus, Search } from 'lucide-react';

const initialBoletas = [
  {
    BoletaID: 266,
    Estado: 'Pendiente',
    Fecha: new Date().toISOString().slice(0, 10),
    Cliente: 'Asamblea Legislativa',
    Titulo: 'Revisión de cámara en edificio central',
    Categoria: 'M.correctivo',
    TipoDispositivo: 'Cámara',
    AsignadoA: 'Andrick Almengor, Francisco Murillo',
  },
];

const emptyForm = {
  Estado: 'Pendiente',
  Fecha: new Date().toISOString().slice(0, 10),
  HoraInicio: '',
  HoraFinal: '',
  Cliente: '',
  Ubicacion: '',
  Supervisor: '',
  CorreoCliente: '',
  Categoria: 'M.correctivo',
  TipoDispositivo: 'Cámara',
  Fabricante: '',
  Modelo: '',
  Serie: '',
  Titulo: '',
  RazonVisita: '',
  Descripcion: '',
  PruebasRealizadas: '',
  Resultado: '',
  Recomendaciones: '',
  AsignadoA: '',
  TipoFalla: '',
  UbicacionEquipo: '',
};

export default function BoletasPage() {
  const [boletas, setBoletas] = useState(initialBoletas);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: '', estado: '', cliente: '', fecha: '' });
  const [evidencias, setEvidencias] = useState([]);

  const filtered = useMemo(() => {
    return boletas.filter((item) => {
      const haystack = `${item.BoletaID} ${item.Cliente} ${item.Titulo} ${item.AsignadoA}`.toLowerCase();
      const matchesSearch = !filters.search || haystack.includes(filters.search.toLowerCase());
      const matchesEstado = !filters.estado || item.Estado === filters.estado;
      const matchesCliente = !filters.cliente || item.Cliente.toLowerCase().includes(filters.cliente.toLowerCase());
      const matchesFecha = !filters.fecha || item.Fecha === filters.fecha;
      return matchesSearch && matchesEstado && matchesCliente && matchesFecha;
    });
  }, [boletas, filters]);

  function saveBoleta() {
    const nextId = Math.max(266, ...boletas.map((item) => Number(item.BoletaID) || 0)) + 1;
    setBoletas([{ ...form, BoletaID: nextId }, ...boletas]);
    setForm(emptyForm);
    setEvidencias([]);
    setShowForm(false);
  }

  function addEvidence() {
    setEvidencias([...evidencias, { id: crypto.randomUUID(), nombre: '', nota: '', archivo: '' }]);
  }

  function updateEvidence(id, field, value) {
    setEvidencias(evidencias.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Boletas</h1>
          <p>Fase 4: listado, filtros, formulario inicial y evidencias.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
          <Plus size={18} /> Nueva boleta
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi icon={FileText} label="Total" value={boletas.length} />
        <Kpi icon={CalendarDays} label="Hoy" value={boletas.filter((item) => item.Fecha === new Date().toISOString().slice(0, 10)).length} />
        <Kpi icon={Filter} label="Pendientes" value={boletas.filter((item) => item.Estado === 'Pendiente').length} />
        <Kpi icon={Search} label="Filtradas" value={filtered.length} />
      </div>

      {showForm ? (
        <div className="card boleta-form-card">
          <h2>Nueva boleta</h2>
          <div className="form-grid">
            <Field label="Título" value={form.Titulo} onChange={(value) => setForm({ ...form, Titulo: value })} />
            <Field label="Fecha" type="date" value={form.Fecha} onChange={(value) => setForm({ ...form, Fecha: value })} />
            <Field label="Hora inicio" type="time" value={form.HoraInicio} onChange={(value) => setForm({ ...form, HoraInicio: value })} />
            <Field label="Hora final" type="time" value={form.HoraFinal} onChange={(value) => setForm({ ...form, HoraFinal: value })} />
            <Field label="Cliente" value={form.Cliente} onChange={(value) => setForm({ ...form, Cliente: value })} />
            <Field label="Ubicación general" value={form.Ubicacion} onChange={(value) => setForm({ ...form, Ubicacion: value })} />
            <Field label="Ubicación equipo" value={form.UbicacionEquipo} onChange={(value) => setForm({ ...form, UbicacionEquipo: value })} />
            <Field label="Supervisor" value={form.Supervisor} onChange={(value) => setForm({ ...form, Supervisor: value })} />
            <Field label="Correo cliente" value={form.CorreoCliente} onChange={(value) => setForm({ ...form, CorreoCliente: value })} />
            <Select label="Categoría" value={form.Categoria} onChange={(value) => setForm({ ...form, Categoria: value })} options={['M.correctivo', 'M.preventivo', 'Instalacion']} />
            <Select label="Tipo dispositivo" value={form.TipoDispositivo} onChange={(value) => setForm({ ...form, TipoDispositivo: value })} options={['Cámara', 'Bocina', 'Puerta', 'Control de acceso']} />
            <Field label="Fabricante" value={form.Fabricante} onChange={(value) => setForm({ ...form, Fabricante: value })} />
            <Field label="Modelo" value={form.Modelo} onChange={(value) => setForm({ ...form, Modelo: value })} />
            <Field label="Serie" value={form.Serie} onChange={(value) => setForm({ ...form, Serie: value })} />
            <Field label="Asignado a" value={form.AsignadoA} onChange={(value) => setForm({ ...form, AsignadoA: value })} placeholder="Separar técnicos por coma" />
            <Field label="Tipo falla" value={form.TipoFalla} onChange={(value) => setForm({ ...form, TipoFalla: value })} />
          </div>

          <div className="form-grid single">
            <TextArea label="Razón de visita" value={form.RazonVisita} onChange={(value) => setForm({ ...form, RazonVisita: value })} />
            <TextArea label="Descripción" value={form.Descripcion} onChange={(value) => setForm({ ...form, Descripcion: value })} />
            <TextArea label="Pruebas realizadas" value={form.PruebasRealizadas} onChange={(value) => setForm({ ...form, PruebasRealizadas: value })} />
            <TextArea label="Resultado" value={form.Resultado} onChange={(value) => setForm({ ...form, Resultado: value })} />
            <TextArea label="Recomendaciones" value={form.Recomendaciones} onChange={(value) => setForm({ ...form, Recomendaciones: value })} />
          </div>

          <div className="evidence-panel">
            <div className="section-header">
              <h3>Evidencias</h3>
              <button className="btn btn-secondary" type="button" onClick={addEvidence}>Agregar evidencia</button>
            </div>
            {evidencias.length === 0 ? <p className="muted">Puedes agregar N evidencias con nombre, nota y archivo.</p> : null}
            {evidencias.map((item) => (
              <div className="evidence-row" key={item.id}>
                <Field label="Nombre" value={item.nombre} onChange={(value) => updateEvidence(item.id, 'nombre', value)} />
                <Field label="Archivo/URL" value={item.archivo} onChange={(value) => updateEvidence(item.id, 'archivo', value)} />
                <TextArea label="Nota" value={item.nota} onChange={(value) => updateEvidence(item.id, 'nota', value)} />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={saveBoleta}>Guardar boleta</button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <div className="form-grid filters-grid">
          <Field label="Buscar" value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} placeholder="Boleta, cliente, título o técnico" />
          <Select label="Estado" value={filters.estado} onChange={(value) => setFilters({ ...filters, estado: value })} options={['', 'Pendiente', 'Finalizada']} />
          <Field label="Cliente" value={filters.cliente} onChange={(value) => setFilters({ ...filters, cliente: value })} />
          <Field label="Fecha" type="date" value={filters.fecha} onChange={(value) => setFilters({ ...filters, fecha: value })} />
        </div>
      </div>

      <div className="card table-card">
        <h2>Listado de boletas</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Boleta</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Dispositivo</th>
                <th>Asignado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.BoletaID}>
                  <td>{item.BoletaID}</td>
                  <td><span className="status-pill">{item.Estado}</span></td>
                  <td>{item.Fecha}</td>
                  <td>{item.Cliente}</td>
                  <td>{item.Titulo}</td>
                  <td>{item.Categoria}</td>
                  <td>{item.TipoDispositivo}</td>
                  <td>{item.AsignadoA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((item) => <option key={item} value={item}>{item || 'Todos'}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows="3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
