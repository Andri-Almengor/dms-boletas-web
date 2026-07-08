import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FileText, Mail, MessageSquare, Send, Wand2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { finalizeBoleta, generateBoletaPdf, sendBoletaChat, sendBoletaEmail, sendBoletaTest } from '../../services/boletasService.js';

export default function OperacionesPage() {
  const { sessionToken } = useAuth();
  const [boletaId, setBoletaId] = useState('');
  const [copyClient, setCopyClient] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [message, setMessage] = useState(null);

  const actionMutation = useMutation({
    mutationFn: async (action) => {
      if (!boletaId) throw new Error('Indica el número de boleta.');
      if (action === 'pdf') return generateBoletaPdf(sessionToken, boletaId);
      if (action === 'email') return sendBoletaEmail(sessionToken, boletaId, { copiaCliente: copyClient, modoPrueba: testMode });
      if (action === 'chat') return sendBoletaChat(sessionToken, boletaId, { modoPrueba: testMode });
      if (action === 'test') return sendBoletaTest(sessionToken, boletaId, 'chat');
      if (action === 'finalize') return finalizeBoleta(sessionToken, boletaId, { copiaCliente: copyClient, modoPrueba: testMode });
      return null;
    },
    onSuccess: () => setMessage({ type: 'success', text: 'Acción ejecutada correctamente.' }),
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  return (
    <div className="page operaciones-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Fase 6 · Entrega y cierre</span>
          <h1>Operaciones de boletas</h1>
          <p>Generación de PDF, envío por correo, Google Chat, pruebas y finalización controlada.</p>
        </div>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <section className="card enterprise-card operation-console">
        <div className="form-section">
          <h2>Centro de finalización</h2>
          <p className="muted">El PDF usa la plantilla existente; las evidencias van a Drive, correo y Google Chat, no dentro del PDF.</p>
          <div className="form-grid">
            <label className="field">
              <span>Boleta ID</span>
              <input value={boletaId} onChange={(event) => setBoletaId(event.target.value)} placeholder="Ej: 266" />
            </label>
            <label className="check-card">
              <input type="checkbox" checked={copyClient} onChange={(event) => setCopyClient(event.target.checked)} />
              <span>Copiar al correo del cliente</span>
            </label>
            <label className="check-card">
              <input type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} />
              <span>Modo prueba</span>
            </label>
          </div>
        </div>

        <div className="operation-grid">
          <ActionCard icon={FileText} title="Generar PDF" description="Crea documento/PDF con firma y plantilla actual." onClick={() => actionMutation.mutate('pdf')} />
          <ActionCard icon={Mail} title="Enviar correo" description="Adjunta PDF, links Drive e informe técnico." onClick={() => actionMutation.mutate('email')} />
          <ActionCard icon={MessageSquare} title="Enviar Google Chat" description="Publica resumen y links de evidencias." onClick={() => actionMutation.mutate('chat')} />
          <ActionCard icon={Send} title="Enviar prueba" description="Prueba el webhook configurado sin cerrar boleta." onClick={() => actionMutation.mutate('test')} />
          <ActionCard icon={CheckCircle2} title="Finalizar boleta" description="Marca Finalizada y dispara flujo completo." primary onClick={() => actionMutation.mutate('finalize')} />
        </div>
      </section>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, onClick, primary = false }) {
  return (
    <button className={`operation-card ${primary ? 'primary' : ''}`} type="button" onClick={onClick}>
      <Icon size={24} />
      <strong>{title}</strong>
      <span>{description}</span>
      <Wand2 size={16} />
    </button>
  );
}
