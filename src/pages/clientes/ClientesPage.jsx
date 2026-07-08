import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, MapPin, MessageSquare, Plus, Save, Search, Send, Trash2, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/authNormalize.js';
import { deleteCliente, emptyCliente, emptyContact, emptyLocation, fetchClientes, saveCliente, sendChatTest } from '../../services/clientesService.js';

export default function ClientesPage() {
  const { sessionToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '' });
  const [form, setForm] = useState(emptyCliente());
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);

  const canCreate = hasPermission(user, PERMISSIONS.CLIENTES_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.CLIENTES_EDIT);

  const clientesQuery = useQuery({
    queryKey: ['clientes', filters],
    queryFn: () => fetchClientes(sessionToken, filters),
    enabled: Boolean(sessionToken),
  });

  const clientes = clientesQuery.data || [];
  const filtered = useMemo(() => {
    return clientes.filter((cliente) => {
      const haystack = `${cliente.Nombre} ${cliente.Notas} ${cliente.ChatWebhookURL} ${cliente.Contactos.map((c) => `${c.Nombre} ${c.Correo}`).join(' ')}`.toLowerCase();
      return !filters.search || haystack.includes(filters.search.toLowerCase());
    });
  }, [clientes, filters.search]);

  const saveMutation = useMutation({
    mutationFn: () => saveCliente(sessionToken, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setMessage({ type: 'success', text: 'Cliente guardado correctamente.' });
      closeForm();
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (clienteId) => deleteCliente(sessionToken, clienteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setMessage({ type: 'success', text: 'Cliente eliminado correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const chatMutation = useMutation({
    mutationFn: (cliente) => sendChatTest(sessionToken, cliente),
    onSuccess: () => setMessage({ type: 'success', text: 'Prueba enviada al Google Chat configurado.' }),
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  function openCreate() {
    setForm(emptyCliente());
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(cliente) {
    setForm(cliente);
    setShowForm(true);
    setMessage(null);
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyCliente());
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateContact(id, field, value) {
    updateForm('Contactos', form.Contactos.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)));
  }

  function updateLocation(id, field, value) {
    updateForm('Ubicaciones', form.Ubicaciones.map((location) => (location.id === id ? { ...location, [field]: value } : location)));
  }

  function addEquipmentLocation(locationId) {
    updateForm(
      'Ubicaciones',
      form.Ubicaciones.map((location) =>
        location.id === locationId ? { ...location, UbicacionesEquipo: [...location.UbicacionesEquipo, ''] } : location
      )
    );
  }

  function updateEquipmentLocation(locationId, index, value) {
    updateForm(
      'Ubicaciones',
      form.Ubicaciones.map((location) => {
        if (location.id !== locationId) return location;
        const next = [...location.UbicacionesEquipo];
        next[index] = value;
        return { ...location, UbicacionesEquipo: next };
      })
    );
  }

  return (
    <div className="page clientes-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Fase 5 · CRM operativo</span>
          <h1>Clientes</h1>
          <p>Contactos, correos, notas, ubicaciones jerárquicas y webhook de Google Chat por cliente.</p>
        </div>
        {canCreate ? (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo cliente
          </button>
        ) : null}
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="kpi-grid">
        <Kpi icon={Building2} label="Clientes" value={clientes.length} />
        <Kpi icon={Mail} label="Correos" value={clientes.reduce((sum, item) => sum + item.Correos.length + item.Contactos.filter((c) => c.Correo).length, 0)} />
        <Kpi icon={MapPin} label="Ubicaciones" value={clientes.reduce((sum, item) => sum + item.Ubicaciones.length, 0)} />
        <Kpi icon={MessageSquare} label="Chats" value={clientes.filter((item) => item.ChatWebhookURL).length} />
      </div>

      {showForm ? (
        <section className="card enterprise-card client-form-card">
          <div className="section-header compact">
            <div>
              <span className="eyebrow">{form.ClienteID ? `Cliente ${form.ClienteID}` : 'Nuevo cliente'}</span>
              <h2>{form.Nombre || 'Ficha de cliente'}</h2>
            </div>
            <button className="icon-button" onClick={closeForm}><X size={18} /></button>
          </div>

          <div className="form-section">
            <h3>Información general</h3>
            <div className="form-grid">
              <Field label="Cliente ID" value={form.ClienteID || 'Automático'} disabled />
              <Field label="Nombre" value={form.Nombre} onChange={(value) => updateForm('Nombre', value)} />
              <Field label="Notas" value={form.Notas} onChange={(value) => updateForm('Notas', value)} placeholder="Ej: Se necesita curso de contratista" />
              <Field label="Google Chat webhook" value={form.ChatWebhookURL} onChange={(value) => updateForm('ChatWebhookURL', value)} placeholder="Webhook del espacio de Chat" />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header compact">
              <h3>Contactos</h3>
              <button className="btn btn-secondary" type="button" onClick={() => updateForm('Contactos', [...form.Contactos, emptyContact()])}>
                <UserPlus size={18} /> Agregar contacto
              </button>
            </div>
            {form.Contactos.length === 0 ? <div className="empty-state small">Sin contactos.</div> : null}
            <div className="nested-list">
              {form.Contactos.map((contact) => (
                <div className="nested-row" key={contact.id}>
                  <Field label="Nombre" value={contact.Nombre} onChange={(value) => updateContact(contact.id, 'Nombre', value)} />
                  <Field label="Cargo" value={contact.Cargo} onChange={(value) => updateContact(contact.id, 'Cargo', value)} />
                  <Field label="Correo" value={contact.Correo} onChange={(value) => updateContact(contact.id, 'Correo', value)} />
                  <Field label="Teléfono" value={contact.Telefono} onChange={(value) => updateContact(contact.id, 'Telefono', value)} />
                  <button className="icon-button danger" type="button" onClick={() => updateForm('Contactos', form.Contactos.filter((item) => item.id !== contact.id))}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="section-header compact">
              <h3>Ubicaciones</h3>
              <button className="btn btn-secondary" type="button" onClick={() => updateForm('Ubicaciones', [...form.Ubicaciones, emptyLocation()])}>
                <MapPin size={18} /> Agregar ubicación
              </button>
            </div>
            {form.Ubicaciones.length === 0 ? <div className="empty-state small">Sin ubicaciones.</div> : null}
            <div className="location-grid">
              {form.Ubicaciones.map((location) => (
                <div className="location-card" key={location.id}>
                  <div className="section-header compact">
                    <strong>{location.Nombre || 'Nueva ubicación'}</strong>
                    <button className="icon-button danger" type="button" onClick={() => updateForm('Ubicaciones', form.Ubicaciones.filter((item) => item.id !== location.id))}><Trash2 size={17} /></button>
                  </div>
                  <Field label="Ubicación general" value={location.Nombre} onChange={(value) => updateLocation(location.id, 'Nombre', value)} placeholder="Edificio Principal, Castillo Azul..." />
                  <Field label="Detalle" value={location.Detalle} onChange={(value) => updateLocation(location.id, 'Detalle', value)} />
                  <div className="section-header compact">
                    <span className="muted">Ubicaciones del equipo</span>
                    <button className="btn btn-secondary compact-btn" type="button" onClick={() => addEquipmentLocation(location.id)}>Agregar punto</button>
                  </div>
                  {location.UbicacionesEquipo.map((point, index) => (
                    <Field key={`${location.id}-${index}`} label={`Punto ${index + 1}`} value={point} onChange={(value) => updateEquipmentLocation(location.id, index, value)} placeholder="Sótano 4, Data Center, Recepción..." />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions sticky-actions">
            <button className="btn btn-secondary" type="button" onClick={closeForm}>Cancelar</button>
            <button className="btn btn-primary" type="button" disabled={saveMutation.isPending || (!canCreate && !canEdit)} onClick={() => saveMutation.mutate()}>
              <Save size={18} /> Guardar cliente
            </button>
          </div>
        </section>
      ) : null}

      <section className="card enterprise-card filters-card">
        <div className="form-grid filters-grid">
          <Field label="Buscar cliente" value={filters.search} icon={Search} onChange={(value) => setFilters({ ...filters, search: value })} placeholder="Nombre, contacto, correo, nota o chat" />
        </div>
      </section>

      <section className="client-grid">
        {filtered.map((cliente) => (
          <article className="card enterprise-card client-card" key={cliente.ClienteID || cliente.Nombre}>
            <div className="section-header compact">
              <div>
                <span className="eyebrow">{cliente.ClienteID || 'Cliente'}</span>
                <h2>{cliente.Nombre}</h2>
              </div>
              {canEdit ? <button className="icon-button" onClick={() => openEdit(cliente)}><Plus size={17} /></button> : null}
            </div>
            {cliente.Notas ? <p className="note-box">{cliente.Notas}</p> : null}
            <div className="client-meta">
              <span><Mail size={15} /> {cliente.Contactos.filter((c) => c.Correo).length || cliente.Correos.length} correos</span>
              <span><MapPin size={15} /> {cliente.Ubicaciones.length} ubicaciones</span>
              <span><MessageSquare size={15} /> {cliente.ChatWebhookURL ? 'Chat configurado' : 'Sin Chat'}</span>
            </div>
            <div className="contact-preview">
              {cliente.Contactos.slice(0, 3).map((contact) => (
                <span className="mini-chip" key={contact.id}>{contact.Nombre || contact.Correo}</span>
              ))}
            </div>
            <div className="form-actions">
              {cliente.ChatWebhookURL ? (
                <button className="btn btn-secondary" type="button" onClick={() => chatMutation.mutate(cliente)}>
                  <Send size={16} /> Enviar prueba
                </button>
              ) : null}
              {canEdit ? <button className="btn btn-secondary" type="button" onClick={() => openEdit(cliente)}>Editar</button> : null}
              {canEdit ? <button className="btn btn-secondary danger-text" type="button" onClick={() => deleteMutation.mutate(cliente.ClienteID)}>Eliminar</button> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="kpi-card enterprise-kpi">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
