import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  FileText,
  FolderOpen,
  ImagePlus,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Send,
  Search,
  Trash2,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import {
  deleteBoleta,
  fetchBoletaCatalogs,
  fetchBoletas,
  fileToDataUrl,
  finalizeBoleta,
  generateBoletaPdf,
  saveBoleta,
  saveBoletaSignature,
  sendBoletaChat,
  sendBoletaEmail,
  uploadBoletaEvidence,
} from '../../services/boletasService.js';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  BoletaID: '', Version: '', Estado: 'Pendiente', Fecha: today(), HoraInicio: '', HoraFinal: '', HorasTotales: '',
  ClienteID: '', Cliente: '', UbicacionID: '', Ubicacion: '', Supervisor: '', CorreoCliente: '', CorreoSupervisor: '',
  Categoria: 'M.correctivo', TipoDispositivo: 'Cámara', DispositivoID: '', Fabricante: '', Modelo: '', Serie: '',
  RazonVisita: '', Descripcion: '', PruebasRealizadas: '', Resultado: '', Recomendaciones: '', AsignadoA: [],
  Firma: '', DocumentoURL: '', PDFURL: '', CarpetaURL: '', CreadoPor: '', ActualizadoPor: '', FechaCreacion: '', FechaActualizacion: '',
  Titulo: '', TipoFalla: '', UbicacionEquipo: '', evidencias: [], respuestasDinamicas: {},
};

const emptyEvidence = () => ({ id: crypto.randomUUID(), Nombre: '', Nota: '', Archivo: '', fileName: '', preview: '', isNew: true });

export default function BoletasPage() {
  const { sessionToken, user } = useAuth();
  const queryClient = useQueryClient();
  const signatureRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: '', estado: '', cliente: '', fechaDesde: '', fechaHasta: '', tecnico: '' });
  const [message, setMessage] = useState(null);

  const boletasQuery = useQuery({ queryKey: ['boletas', filters], queryFn: () => fetchBoletas(sessionToken, filters), enabled: Boolean(sessionToken) });
  const catalogsQuery = useQuery({ queryKey: ['boleta-catalogs'], queryFn: () => fetchBoletaCatalogs(sessionToken), enabled: Boolean(sessionToken) });

  const boletas = boletasQuery.data || [];
  const catalogs = catalogsQuery.data || {};
  const isAdmin = String(user?.role || user?.Rol || '').toLowerCase().includes('admin');

  const filteredBoletas = useMemo(() => boletas.filter((item) => {
    const asignado = normalizeAssigned(item.AsignadoA).join(', ');
    const haystack = `${item.BoletaID} ${item.Cliente} ${item.Titulo} ${item.Categoria} ${item.TipoDispositivo} ${asignado}`.toLowerCase();
    const fecha = item.Fecha || '';
    return (!filters.search || haystack.includes(filters.search.toLowerCase())) &&
      (!filters.estado || item.Estado === filters.estado) &&
      (!filters.cliente || String(item.Cliente || '').toLowerCase().includes(filters.cliente.toLowerCase())) &&
      (!filters.tecnico || asignado.toLowerCase().includes(filters.tecnico.toLowerCase())) &&
      (!filters.fechaDesde || fecha >= filters.fechaDesde) &&
      (!filters.fechaHasta || fecha <= filters.fechaHasta);
  }), [boletas, filters]);

  const visibleLocations = useMemo(() => filterLocations(catalogs.ubicaciones, form.Cliente, form.ClienteID), [catalogs.ubicaciones, form.Cliente, form.ClienteID]);
  const equipmentLocations = useMemo(() => getEquipmentLocations(catalogs, form.Cliente, form.Ubicacion), [catalogs, form.Cliente, form.Ubicacion]);

  const visibleModels = useMemo(() => (catalogs.modelos || []).filter((model) => {
    const fabricante = getName(model.fabricante || model.Fabricante);
    const tipo = getName(model.tipoDispositivo || model.TipoDispositivo || model.tipo);
    return (!form.Fabricante || fabricante === form.Fabricante) && (!form.TipoDispositivo || tipo === form.TipoDispositivo);
  }), [catalogs.modelos, form.Fabricante, form.TipoDispositivo]);

  const dynamicQuestions = useMemo(() => {
    const source = catalogs.preguntasDinamicas || {};
    const questions = source[form.TipoDispositivo] || source[getName(form.TipoDispositivo)] || [];
    return Array.isArray(questions) ? questions : [];
  }, [catalogs.preguntasDinamicas, form.TipoDispositivo]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      validateBoleta(form);
      const payload = { ...form, ActualizadoPor: currentUserName(user), CreadoPor: form.CreadoPor || currentUserName(user) };
      const saved = await saveBoleta(sessionToken, payload);
      const boletaId = saved.BoletaID || form.BoletaID;

      const signatureData = signatureRef.current && !signatureRef.current.isEmpty() ? signatureRef.current.toDataURL('image/png') : '';
      if (boletaId && signatureData) await saveBoletaSignature(sessionToken, boletaId, signatureData);

      for (const evidence of (form.evidencias || []).filter((e) => e.isNew || e.Archivo)) {
        await uploadBoletaEvidence(sessionToken, boletaId, evidence);
      }
      return saved;
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['boletas'] });
      await queryClient.invalidateQueries({ queryKey: ['boleta-catalogs'] });
      setMessage({ type: 'success', text: `Boleta ${saved.BoletaID || ''} guardada correctamente.` });
      closeForm();
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (boletaId) => deleteBoleta(sessionToken, boletaId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['boletas'] }); setMessage({ type: 'success', text: 'Boleta eliminada correctamente.' }); },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, boletaId }) => {
      if (!boletaId) throw new Error('La boleta aún no tiene ID. Primero guárdala.');
      if (action === 'pdf') return generateBoletaPdf(sessionToken, boletaId);
      if (action === 'email') return sendBoletaEmail(sessionToken, boletaId, { copiaCliente: true });
      if (action === 'chat') return sendBoletaChat(sessionToken, boletaId);
      if (action === 'finalize') return finalizeBoleta(sessionToken, boletaId, { copiaCliente: true });
      return null;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['boletas'] }); setMessage({ type: 'success', text: 'Acción ejecutada correctamente.' }); },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  function openNewForm() {
    setEditingId(null);
    setForm({ ...emptyForm, Fecha: today() });
    setShowForm(true);
    setMessage(null);
  }

  function openEditForm(boleta) {
    setEditingId(boleta.BoletaID);
    setForm({ ...emptyForm, ...boleta, AsignadoA: normalizeAssigned(boleta.AsignadoA), evidencias: normalizeEvidenceForEdit(boleta.evidencias || []) });
    setShowForm(true);
    setMessage(null);
    setTimeout(() => signatureRef.current?.clear(), 0);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm, Fecha: today() });
    signatureRef.current?.clear();
  }

  function updateForm(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'Cliente') { next.ClienteID = ''; next.Ubicacion = ''; next.UbicacionID = ''; next.UbicacionEquipo = ''; }
      if (field === 'Ubicacion') { next.UbicacionID = ''; next.UbicacionEquipo = ''; }
      if (field === 'TipoDispositivo') { next.Modelo = ''; next.respuestasDinamicas = {}; }
      if (field === 'Fabricante') next.Modelo = '';
      return next;
    });
  }

  function toggleAssigned(name) {
    setForm((current) => ({ ...current, AsignadoA: current.AsignadoA.includes(name) ? current.AsignadoA.filter((item) => item !== name) : [...current.AsignadoA, name] }));
  }

  async function addEvidenceFile(id, file) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, evidencias: current.evidencias.map((item) => item.id === id ? { ...item, Archivo: dataUrl, fileName: file.name || '', preview: dataUrl } : item) }));
  }

  function updateEvidence(id, field, value) { setForm((current) => ({ ...current, evidencias: current.evidencias.map((item) => item.id === id ? { ...item, [field]: value } : item) })); }
  function removeEvidence(id) { setForm((current) => ({ ...current, evidencias: current.evidencias.filter((item) => item.id !== id) })); }
  function setDynamicAnswer(question, value) { setForm((current) => ({ ...current, respuestasDinamicas: { ...current.respuestasDinamicas, [question]: value } })); }

  const stats = {
    total: boletas.length,
    pendientes: boletas.filter((item) => item.Estado === 'Pendiente').length,
    finalizadas: boletas.filter((item) => String(item.Estado || '').toLowerCase().includes('final')).length,
    hoy: boletas.filter((item) => item.Fecha === today()).length,
  };

  return (
    <div className="page boletas-workspace">
      <div className="page-title hero-title">
        <div><span className="eyebrow">Fase 4 · Módulo principal</span><h1>Boletas técnicas</h1><p>CRUD empresarial con evidencias, firma, catálogos dependientes y finalización completa.</p></div>
        <div className="hero-actions">
          <button className="btn btn-secondary" onClick={() => { boletasQuery.refetch(); catalogsQuery.refetch(); }} disabled={boletasQuery.isFetching}>{boletasQuery.isFetching ? <Loader2 className="spin" size={18} /> : <RefreshCcw size={18} />} Actualizar</button>
          <button className="btn btn-primary" onClick={openNewForm}><Plus size={18} /> Nueva boleta</button>
        </div>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="kpi-grid">
        <Kpi icon={FileText} label="Total boletas" value={stats.total} />
        <Kpi icon={ClipboardList} label="Pendientes" value={stats.pendientes} />
        <Kpi icon={CheckCircle2} label="Finalizadas" value={stats.finalizadas} />
        <Kpi icon={CalendarDays} label="Creadas hoy" value={stats.hoy} />
      </div>

      {showForm ? (
        <section className="card boleta-form-card enterprise-card">
          <div className="section-header compact"><div><span className="eyebrow">{editingId ? `Editando boleta ${editingId}` : 'Nueva boleta'}</span><h2>{editingId ? form.Titulo || 'Editar boleta' : 'Registro técnico completo'}</h2></div><button className="icon-button" onClick={closeForm} aria-label="Cerrar formulario"><X size={18} /></button></div>

          <div className="form-section"><h3>Datos principales</h3><div className="form-grid">
            <Field label="Boleta ID" value={form.BoletaID || 'Automático por backend'} disabled />
            <Field label="Versión" value={form.Version} onChange={(value) => updateForm('Version', value)} />
            <Select label="Estado" value={form.Estado} onChange={(value) => updateForm('Estado', value)} options={catalogs.estados || []} />
            <Field label="Fecha" type="date" value={form.Fecha} onChange={(value) => updateForm('Fecha', value)} />
            <Field label="Hora inicio" type="time" value={form.HoraInicio} onChange={(value) => updateForm('HoraInicio', value)} />
            <Field label="Hora final" type="time" value={form.HoraFinal} onChange={(value) => updateForm('HoraFinal', value)} />
            <Field label="Horas totales" value={form.HorasTotales} onChange={(value) => updateForm('HorasTotales', value)} />
            <Select label="Categoría" value={form.Categoria} onChange={(value) => updateForm('Categoria', value)} options={catalogs.categorias || []} />
          </div></div>

          <div className="form-section"><h3>Cliente y ubicación</h3><div className="form-grid">
            <SmartSelect label="Cliente" value={form.Cliente} onChange={(value, item) => { updateForm('Cliente', value); if (item) { updateForm('ClienteID', item.ClienteID || item.id || ''); updateForm('CorreoCliente', item.CorreoCliente || item.CorreoPrincipal || item.Correo || form.CorreoCliente); } }} options={catalogs.clientes || []} placeholder="Seleccionar cliente" />
            <SmartSelect label="Ubicación general" value={form.Ubicacion} onChange={(value, item) => { updateForm('Ubicacion', value); if (item) updateForm('UbicacionID', item.UbicacionID || item.id || ''); }} options={visibleLocations} placeholder="Edificio, sede o zona" />
            <SmartSelect label="Ubicación del equipo" value={form.UbicacionEquipo} onChange={(value) => updateForm('UbicacionEquipo', value)} options={equipmentLocations} placeholder="Sótano 4, Piso 17, Data Center..." />
            <Field label="Supervisor" value={form.Supervisor} onChange={(value) => updateForm('Supervisor', value)} />
            <Field label="Correo cliente" type="email" value={form.CorreoCliente} onChange={(value) => updateForm('CorreoCliente', value)} />
            <Field label="Correo supervisor" type="email" value={form.CorreoSupervisor} onChange={(value) => updateForm('CorreoSupervisor', value)} />
          </div></div>

          <div className="form-section"><h3>Equipo</h3><div className="form-grid">
            <Select label="Tipo dispositivo" value={form.TipoDispositivo} onChange={(value) => updateForm('TipoDispositivo', value)} options={catalogs.tiposDispositivo || []} />
            <SmartSelect label="Fabricante" value={form.Fabricante} onChange={(value) => updateForm('Fabricante', value)} options={filterManufacturers(catalogs.fabricantes, form.TipoDispositivo)} />
            <SmartSelect label="Modelo" value={form.Modelo} onChange={(value) => updateForm('Modelo', value)} options={visibleModels} placeholder="Depende de tipo + fabricante" />
            <Field label="Dispositivo ID" value={form.DispositivoID} onChange={(value) => updateForm('DispositivoID', value)} />
            <Field label="Serie" value={form.Serie} onChange={(value) => updateForm('Serie', value)} />
            <Field label="Tipo de falla" value={form.TipoFalla} onChange={(value) => updateForm('TipoFalla', value)} />
          </div></div>

          <div className="form-section"><div className="section-header compact"><h3>Asignado a</h3><span className="muted">Selección múltiple desde Usuarios</span></div><div className="assignee-grid">
            {(catalogs.usuarios || []).map((tech) => { const name = getName(tech.Nombre || tech.nombre || tech.Correo || tech.correo || tech); const checked = form.AsignadoA.includes(name); return <button key={name} type="button" className={`assignee-chip ${checked ? 'selected' : ''}`} onClick={() => toggleAssigned(name)}><UserRoundCheck size={16} /> {name}</button>; })}
            {(catalogs.usuarios || []).length === 0 ? <p className="muted">No hay usuarios cargados desde backend todavía.</p> : null}
          </div></div>

          {dynamicQuestions.length ? <div className="form-section dynamic-panel"><h3>Preguntas dinámicas · {form.TipoDispositivo}</h3><div className="dynamic-grid">{dynamicQuestions.map((question) => <label className="dynamic-question" key={question}><span>{question}</span><div className="segmented">{['Bien', 'Revisado', 'No aplica', 'Falla'].map((value) => <button key={value} type="button" className={form.respuestasDinamicas?.[question] === value ? 'active' : ''} onClick={() => setDynamicAnswer(question, value)}>{value}</button>)}</div></label>)}</div></div> : null}

          <div className="form-section"><h3>Informe técnico</h3><div className="form-grid single">
            <Field label="Título" value={form.Titulo} onChange={(value) => updateForm('Titulo', value)} />
            <TextArea label="Razón de visita" value={form.RazonVisita} onChange={(value) => updateForm('RazonVisita', value)} />
            <TextArea label="Descripción" value={form.Descripcion} onChange={(value) => updateForm('Descripcion', value)} />
            <TextArea label="Pruebas realizadas" value={form.PruebasRealizadas} onChange={(value) => updateForm('PruebasRealizadas', value)} />
            <TextArea label="Resultado" value={form.Resultado} onChange={(value) => updateForm('Resultado', value)} />
            <TextArea label="Recomendaciones" value={form.Recomendaciones} onChange={(value) => updateForm('Recomendaciones', value)} />
          </div></div>

          <div className="form-section evidence-panel"><div className="section-header compact"><div><h3>Evidencias</h3><p className="muted">No se agregan al PDF. Se guardan para Drive, correo y Google Chat.</p></div><button className="btn btn-secondary" type="button" onClick={() => updateForm('evidencias', [...form.evidencias, emptyEvidence()])}><ImagePlus size={18} /> Agregar evidencia</button></div><div className="evidence-list">
            {form.evidencias.length === 0 ? <div className="empty-state small">Sin evidencias todavía.</div> : null}
            {form.evidencias.map((item) => <div className="evidence-row" key={item.id || item.EvidenciaID || item.Nombre}><Field label="Nombre" value={item.Nombre || ''} onChange={(value) => updateEvidence(item.id, 'Nombre', value)} /><TextArea label="Nota" value={item.Nota || ''} onChange={(value) => updateEvidence(item.id, 'Nota', value)} /><label className="field file-field"><span>Archivo</span><input type="file" onChange={(event) => addEvidenceFile(item.id, event.target.files?.[0])} />{item.fileName ? <small>{item.fileName}</small> : null}{item.ArchivoURL || item.Link || item.URL ? <a className="mini-link" href={item.ArchivoURL || item.Link || item.URL} target="_blank" rel="noreferrer">Ver archivo</a> : null}</label><button className="icon-button danger" type="button" onClick={() => removeEvidence(item.id)} aria-label="Eliminar evidencia"><Trash2 size={18} /></button></div>)}
          </div></div>

          <div className="form-section signature-panel"><div className="section-header compact"><div><h3>Firma del cliente</h3><p className="muted">Firma dibujable en canvas. Se guarda en Drive y luego se usa en el PDF.</p></div><div className="hero-actions"><button className="btn btn-secondary" type="button" onClick={() => signatureRef.current?.clear()}>Limpiar</button><button className="btn btn-secondary" type="button" onClick={() => updateForm('Firma', '')}>Volver a firmar</button></div></div><div className="signature-box"><SignatureCanvas ref={signatureRef} canvasProps={{ className: 'signature-canvas' }} /></div></div>

          <div className="form-actions sticky-actions"><button className="btn btn-secondary" type="button" onClick={closeForm}>Cancelar</button><button className="btn btn-primary" type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? <Loader2 className="spin" size={18} /> : <Save size={18} />} Guardar boleta</button></div>
        </section>
      ) : null}

      <section className="card filters-card enterprise-card"><div className="section-header compact"><div><h2>Centro de control</h2><p className="muted">Filtros avanzados para operación diaria, auditoría y seguimiento.</p></div></div><div className="form-grid filters-grid">
        <Field label="Buscar" value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} placeholder="Boleta, cliente, título, categoría o técnico" icon={Search} />
        <Select label="Estado" value={filters.estado} onChange={(value) => setFilters({ ...filters, estado: value })} options={['', ...(catalogs.estados || [])]} emptyLabel="Todos" />
        <Field label="Cliente" value={filters.cliente} onChange={(value) => setFilters({ ...filters, cliente: value })} />
        <Field label="Técnico" value={filters.tecnico} onChange={(value) => setFilters({ ...filters, tecnico: value })} />
        <Field label="Desde" type="date" value={filters.fechaDesde} onChange={(value) => setFilters({ ...filters, fechaDesde: value })} />
        <Field label="Hasta" type="date" value={filters.fechaHasta} onChange={(value) => setFilters({ ...filters, fechaHasta: value })} />
      </div></section>

      <section className="card table-card enterprise-card"><div className="section-header compact"><div><h2>Listado de boletas</h2><p className="muted">{filteredBoletas.length} resultados visibles</p></div></div>
        {boletasQuery.isLoading ? <div className="loading"><Loader2 className="spin" /> Cargando boletas...</div> : null}
        {!boletasQuery.isLoading && filteredBoletas.length === 0 ? <div className="empty-state">No hay boletas para los filtros seleccionados.</div> : null}
        {filteredBoletas.length ? <div className="table-wrap"><table className="data-table boletas-table"><thead><tr><th>Boleta</th><th>Estado</th><th>Fecha</th><th>Cliente / ubicación</th><th>Trabajo</th><th>Equipo</th><th>Asignado</th><th>Archivos</th><th>Acciones</th></tr></thead><tbody>{filteredBoletas.map((item) => <tr key={item.BoletaID || item.Titulo}><td><strong>#{item.BoletaID || '—'}</strong><span className="muted block">v{item.Version || '—'}</span></td><td><StatusPill status={item.Estado} /></td><td>{item.Fecha}<span className="muted block">{item.HoraInicio || '--:--'} - {item.HoraFinal || '--:--'}</span></td><td><strong>{item.Cliente || 'Sin cliente'}</strong><span className="muted block">{item.Ubicacion || 'Sin ubicación'} · {item.UbicacionEquipo || 'Sin punto'}</span></td><td><strong>{item.Titulo || 'Sin título'}</strong><span className="muted block">{item.Categoria || 'Sin categoría'} · {item.TipoFalla || 'Sin falla'}</span></td><td>{item.TipoDispositivo || '—'}<span className="muted block">{item.Fabricante || '—'} {item.Modelo || ''}</span></td><td>{normalizeAssigned(item.AsignadoA).map((name) => <span className="mini-chip" key={name}>{name}</span>)}</td><td><FileLinks item={item} /></td><td><div className="row-actions"><button className="icon-button" type="button" onClick={() => openEditForm(item)} aria-label="Editar"><Pencil size={17} /></button><button className="icon-button" type="button" onClick={() => actionMutation.mutate({ action: 'pdf', boletaId: item.BoletaID })} title="Generar PDF"><FileText size={17} /></button><button className="icon-button" type="button" onClick={() => actionMutation.mutate({ action: 'email', boletaId: item.BoletaID })} title="Enviar correo"><Mail size={17} /></button><button className="icon-button" type="button" onClick={() => actionMutation.mutate({ action: 'chat', boletaId: item.BoletaID })} title="Enviar Chat"><MessageSquare size={17} /></button><button className="icon-button" type="button" onClick={() => actionMutation.mutate({ action: 'finalize', boletaId: item.BoletaID })} title="Finalizar"><Send size={17} /></button>{isAdmin ? <button className="icon-button danger" type="button" onClick={() => deleteMutation.mutate(item.BoletaID)} aria-label="Eliminar"><Trash2 size={17} /></button> : null}</div></td></tr>)}</tbody></table></div> : null}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) { return <div className="kpi-card enterprise-kpi"><Icon /><span>{label}</span><strong>{value}</strong></div>; }
function Field({ label, value, onChange, type = 'text', placeholder = '', disabled = false, icon: Icon }) { return <label className="field"><span>{label}</span><div className={Icon ? 'input-icon-wrap' : ''}>{Icon ? <Icon size={16} /> : null}<input disabled={disabled} type={type} value={value || ''} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} /></div></label>; }
function Select({ label, value, onChange, options = [], emptyLabel = 'Seleccionar' }) { return <label className="field"><span>{label}</span><select value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((item) => { const optionValue = getName(item); return <option key={optionValue || emptyLabel} value={optionValue}>{optionValue || emptyLabel}</option>; })}</select></label>; }
function SmartSelect({ label, value, onChange, options = [], placeholder = 'Seleccionar', disabled = false }) { const datalistId = `${label.replace(/\s+/g, '-')}-${Math.random().toString(16).slice(2)}`; return <label className="field"><span>{label}</span><input disabled={disabled} list={datalistId} value={value || ''} placeholder={placeholder} onChange={(event) => { const selected = options.find((item) => getName(item) === event.target.value); onChange(event.target.value, selected); }} /><datalist id={datalistId}>{options.map((item) => <option key={getName(item)} value={getName(item)} />)}</datalist></label>; }
function TextArea({ label, value, onChange }) { return <label className="field"><span>{label}</span><textarea rows="3" value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>; }
function StatusPill({ status }) { const normalized = String(status || '').toLowerCase(); const className = normalized.includes('final') ? 'success' : normalized.includes('proceso') ? 'info' : 'warning'; return <span className={`status-pill ${className}`}>{status || 'Pendiente'}</span>; }
function FileLinks({ item }) { const links = [{ label: 'PDF', url: item.PDFURL, icon: FileText }, { label: 'Doc', url: item.DocumentoURL, icon: FileSignature }, { label: 'Drive', url: item.CarpetaURL, icon: FolderOpen }].filter((link) => link.url); if (!links.length) return <span className="muted">Pendiente</span>; return links.map(({ label, url, icon: Icon }) => <a className="file-chip" key={label} href={url} target="_blank" rel="noreferrer"><Icon size={14} /> {label}</a>); }
function normalizeAssigned(value) { if (Array.isArray(value)) return value.filter(Boolean); return String(value || '').split(',').map((item) => item.trim()).filter(Boolean); }
function normalizeEvidenceForEdit(items) { return items.map((item) => ({ ...item, id: item.id || item.EvidenciaID || crypto.randomUUID(), isNew: false })); }
function getName(item) { if (!item) return ''; if (typeof item === 'string') return item; return item.Nombre || item.nombre || item.Cliente || item.Ubicacion || item.UbicacionEquipo || item.Modelo || item.modelo || item.Fabricante || item.fabricante || item.TipoDispositivo || item.tipoDispositivo || item.name || item.id || ''; }
function filterManufacturers(fabricantes = [], tipo) { return fabricantes.filter((item) => { const tipos = item.tipos || item.Tipos || item.tipoDispositivo || item.TipoDispositivo || []; if (!tipo || !tipos || tipos.length === 0) return true; return Array.isArray(tipos) ? tipos.includes(tipo) : String(tipos) === tipo; }); }
function filterLocations(ubicaciones = [], cliente, clienteId) { return (ubicaciones || []).filter((item) => { const itemCliente = item.Cliente || item.cliente || item.ClienteID || item.clienteId || ''; return !cliente && !clienteId ? true : !itemCliente || itemCliente === cliente || itemCliente === clienteId; }); }
function getEquipmentLocations(catalogs, cliente, ubicacion) { const fromLocations = (catalogs.ubicaciones || []).flatMap((item) => { const matchesClient = !cliente || !item.Cliente || item.Cliente === cliente || item.ClienteID === cliente; const matchesLocation = !ubicacion || item.Ubicacion === ubicacion || item.Nombre === ubicacion; if (!matchesClient || !matchesLocation) return []; return [item.UbicacionEquipo, item.Punto, item.Area, ...(Array.isArray(item.UbicacionesEquipo) ? item.UbicacionesEquipo : [])].filter(Boolean); }); const direct = catalogs.ubicacionesEquipo || catalogs.puntosEquipo || []; return [...new Set([...fromLocations, ...direct].map(getName).filter(Boolean))].map((nombre) => ({ id: nombre, nombre })); }
function currentUserName(user) { return user?.email || user?.Correo || user?.name || user?.Nombre || ''; }
function validateBoleta(values) { const missing = []; if (!values.Cliente) missing.push('Cliente'); if (!values.Categoria) missing.push('Categoría'); if (!values.TipoDispositivo) missing.push('Tipo de dispositivo'); if (!values.Titulo) missing.push('Título'); if (!values.AsignadoA?.length) missing.push('Asignado a'); if (missing.length) throw new Error(`Completa los campos obligatorios: ${missing.join(', ')}.`); }
