import { useMemo, useState } from 'react';
import { Camera, CircleHelp, Factory, PackageSearch, Plus } from 'lucide-react';

const initialDeviceTypes = [
  { id: 'camara', nombre: 'Cámara', activo: true },
  { id: 'bocina', nombre: 'Bocina', activo: true },
  { id: 'puerta', nombre: 'Puerta', activo: true },
];

const initialManufacturers = [
  { id: 'axis', nombre: 'Axis', activo: true },
  { id: 'hid', nombre: 'HID', activo: true },
];

const initialModels = [
  { id: 'm1', tipoDispositivo: 'Cámara', fabricante: 'Axis', modelo: 'P3265-LVE', imagenReferencia: '' },
  { id: 'm2', tipoDispositivo: 'Bocina', fabricante: 'Axis', modelo: 'C1310-E', imagenReferencia: '' },
];

const initialQuestions = [
  { id: 'q1', tipoDispositivo: 'Cámara', pregunta: '¿Tiene visualización?', tipoRespuesta: 'Sí/No', obligatorio: true },
  { id: 'q2', tipoDispositivo: 'Cámara', pregunta: '¿Tiene grabación?', tipoRespuesta: 'Sí/No', obligatorio: true },
  { id: 'q3', tipoDispositivo: 'Puerta', pregunta: '¿Cierra correctamente?', tipoRespuesta: 'Sí/No', obligatorio: true },
];

const tabs = [
  { id: 'tipos', label: 'Tipos', icon: Camera },
  { id: 'fabricantes', label: 'Fabricantes', icon: Factory },
  { id: 'modelos', label: 'Modelos', icon: PackageSearch },
  { id: 'preguntas', label: 'Preguntas', icon: CircleHelp },
];

export default function CatalogsAdminPage() {
  const [activeTab, setActiveTab] = useState('tipos');
  const [deviceTypes, setDeviceTypes] = useState(initialDeviceTypes);
  const [manufacturers, setManufacturers] = useState(initialManufacturers);
  const [models, setModels] = useState(initialModels);
  const [questions, setQuestions] = useState(initialQuestions);

  const typeNames = useMemo(() => deviceTypes.map((item) => item.nombre), [deviceTypes]);
  const manufacturerNames = useMemo(() => manufacturers.map((item) => item.nombre), [manufacturers]);

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Catálogos</h1>
          <p>Tipos de dispositivo, fabricantes, modelos y preguntas dinámicas para boletas.</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tipos' && (
        <DeviceTypesPanel items={deviceTypes} onChange={setDeviceTypes} />
      )}

      {activeTab === 'fabricantes' && (
        <ManufacturersPanel items={manufacturers} onChange={setManufacturers} />
      )}

      {activeTab === 'modelos' && (
        <ModelsPanel
          items={models}
          onChange={setModels}
          typeNames={typeNames}
          manufacturerNames={manufacturerNames}
        />
      )}

      {activeTab === 'preguntas' && (
        <QuestionsPanel items={questions} onChange={setQuestions} typeNames={typeNames} />
      )}
    </div>
  );
}

function DeviceTypesPanel({ items, onChange }) {
  const [nombre, setNombre] = useState('');

  function addItem() {
    if (!nombre.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), nombre: nombre.trim(), activo: true }]);
    setNombre('');
  }

  return (
    <CatalogSection
      title="Tipos de dispositivo"
      description="Ejemplo: Cámara, Bocina, Puerta, Control de acceso, Torniquete."
      form={
        <>
          <label className="field">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Cámara" />
          </label>
          <button className="btn btn-primary" type="button" onClick={addItem}>
            <Plus size={18} /> Agregar tipo
          </button>
        </>
      }
      rows={items}
      columns={['nombre', 'activo']}
    />
  );
}

function ManufacturersPanel({ items, onChange }) {
  const [nombre, setNombre] = useState('');

  function addItem() {
    if (!nombre.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), nombre: nombre.trim(), activo: true }]);
    setNombre('');
  }

  return (
    <CatalogSection
      title="Fabricantes"
      description="Estos fabricantes se usan después para filtrar modelos según el dispositivo."
      form={
        <>
          <label className="field">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Axis" />
          </label>
          <button className="btn btn-primary" type="button" onClick={addItem}>
            <Plus size={18} /> Agregar fabricante
          </button>
        </>
      }
      rows={items}
      columns={['nombre', 'activo']}
    />
  );
}

function ModelsPanel({ items, onChange, typeNames, manufacturerNames }) {
  const [form, setForm] = useState({ tipoDispositivo: typeNames[0] || '', fabricante: manufacturerNames[0] || '', modelo: '', imagenReferencia: '' });

  function addItem() {
    if (!form.tipoDispositivo || !form.fabricante || !form.modelo.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), ...form, modelo: form.modelo.trim() }]);
    setForm({ ...form, modelo: '', imagenReferencia: '' });
  }

  return (
    <CatalogSection
      title="Modelos por dispositivo y fabricante"
      description="Si eliges Cámara + Axis, solo aparecerán modelos de cámaras Axis en la boleta."
      form={
        <>
          <label className="field">
            <span>Tipo de dispositivo</span>
            <select value={form.tipoDispositivo} onChange={(e) => setForm({ ...form, tipoDispositivo: e.target.value })}>
              {typeNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Fabricante</span>
            <select value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })}>
              {manufacturerNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Modelo</span>
            <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej. P3265-LVE" />
          </label>
          <label className="field">
            <span>Imagen de referencia</span>
            <input value={form.imagenReferencia} onChange={(e) => setForm({ ...form, imagenReferencia: e.target.value })} placeholder="URL de Drive o imagen" />
          </label>
          <button className="btn btn-primary" type="button" onClick={addItem}>
            <Plus size={18} /> Agregar modelo
          </button>
        </>
      }
      rows={items}
      columns={['tipoDispositivo', 'fabricante', 'modelo', 'imagenReferencia']}
    />
  );
}

function QuestionsPanel({ items, onChange, typeNames }) {
  const [form, setForm] = useState({ tipoDispositivo: typeNames[0] || '', pregunta: '', tipoRespuesta: 'Sí/No', obligatorio: true });

  function addItem() {
    if (!form.tipoDispositivo || !form.pregunta.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), ...form, pregunta: form.pregunta.trim() }]);
    setForm({ ...form, pregunta: '' });
  }

  return (
    <CatalogSection
      title="Preguntas dinámicas por dispositivo"
      description="Estas preguntas aparecen automáticamente en la boleta según el tipo de dispositivo."
      form={
        <>
          <label className="field">
            <span>Tipo de dispositivo</span>
            <select value={form.tipoDispositivo} onChange={(e) => setForm({ ...form, tipoDispositivo: e.target.value })}>
              {typeNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Pregunta</span>
            <input value={form.pregunta} onChange={(e) => setForm({ ...form, pregunta: e.target.value })} placeholder="Ej. ¿Tiene visualización?" />
          </label>
          <label className="field">
            <span>Tipo de respuesta</span>
            <select value={form.tipoRespuesta} onChange={(e) => setForm({ ...form, tipoRespuesta: e.target.value })}>
              <option>Sí/No</option>
              <option>Texto</option>
              <option>Número</option>
              <option>Lista</option>
            </select>
          </label>
          <label className="check-item">
            <input type="checkbox" checked={form.obligatorio} onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })} />
            Obligatorio
          </label>
          <button className="btn btn-primary" type="button" onClick={addItem}>
            <Plus size={18} /> Agregar pregunta
          </button>
        </>
      }
      rows={items}
      columns={['tipoDispositivo', 'pregunta', 'tipoRespuesta', 'obligatorio']}
    />
  );
}

function CatalogSection({ title, description, form, rows, columns }) {
  return (
    <div className="grid-2 catalog-layout">
      <form className="card form-card" onSubmit={(e) => e.preventDefault()}>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        {form}
      </form>

      <div className="card table-card">
        <h2>Registros</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column}>{formatColumn(column)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column}>{formatValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatColumn(value) {
  return String(value)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return value || '-';
}
