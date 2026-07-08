import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Send } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { fetchConfig, saveConfig, testConfigChannel } from '../../services/adminService.js';

export default function ConfigAdminPage() {
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null);

  const configQuery = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => fetchConfig(sessionToken),
    enabled: Boolean(sessionToken),
  });

  useEffect(() => {
    if (configQuery.data) setForm(configQuery.data);
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveConfig(sessionToken, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-config'] });
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const testMutation = useMutation({
    mutationFn: (channel) => testConfigChannel(sessionToken, channel),
    onSuccess: () => setMessage({ type: 'success', text: 'Prueba enviada correctamente.' }),
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  if (!form) return <div className="loading">Cargando configuración...</div>;

  return (
    <div className="page admin-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Configuración</h1>
          <p>Controla correos CC, modo prueba, Google Chat, plantilla PDF y carpeta raíz de Drive.</p>
        </div>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <form className="card enterprise-card form-card wide" onSubmit={(e) => e.preventDefault()}>
        <h2>Correos y Chat</h2>

        <label className="field">
          <span>Correos CC por defecto</span>
          <textarea rows="3" value={form.correosCC || ''} onChange={(e) => setForm({ ...form, correosCC: e.target.value })} />
        </label>

        <div className="form-grid">
          <Field label="Correo de pruebas" value={form.correoPruebas} onChange={(value) => setForm({ ...form, correoPruebas: value })} />
          <Field label="Chat producción" value={form.chatProduccion} onChange={(value) => setForm({ ...form, chatProduccion: value })} placeholder="Webhook Google Chat producción" />
          <Field label="Chat pruebas" value={form.chatPruebas} onChange={(value) => setForm({ ...form, chatPruebas: value })} placeholder="Webhook Google Chat pruebas" />
          <Field label="ID plantilla boleta" value={form.templateBoletaId} onChange={(value) => setForm({ ...form, templateBoletaId: value })} />
          <Field label="ID carpeta raíz Drive" value={form.carpetaRaizDriveId} onChange={(value) => setForm({ ...form, carpetaRaizDriveId: value })} />
        </div>

        <label className="check-item">
          <input type="checkbox" checked={form.modoPruebas} onChange={(e) => setForm({ ...form, modoPruebas: e.target.checked })} />
          Activar modo pruebas global
        </label>

        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={18} /> Guardar configuración
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => testMutation.mutate('chatProduccion')}>
            <Send size={18} /> Probar Chat producción
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => testMutation.mutate('chatPruebas')}>
            <Send size={18} /> Probar Chat pruebas
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => testMutation.mutate('correoPruebas')}>
            <Send size={18} /> Probar correo
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
