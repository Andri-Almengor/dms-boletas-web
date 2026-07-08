import { apiGet, apiPost } from './apiClient.js';

const DEFAULT_CATALOGS = {
  estados: ['Pendiente', 'En proceso', 'Finalizada'],
  categorias: ['M.correctivo', 'M.preventivo', 'Instalación'],
  tiposDispositivo: ['Cámara', 'Bocina', 'Control de acceso', 'Puerta', 'Lector', 'Servidor'],
  fabricantes: [
    { id: 'axis', nombre: 'Axis', tipos: ['Cámara', 'Bocina'] },
    { id: 'hid', nombre: 'HID', tipos: ['Control de acceso', 'Lector'] },
    { id: 'lenel', nombre: 'LenelS2', tipos: ['Control de acceso'] },
  ],
  modelos: [
    { id: 'axis-p3265', nombre: 'P3265-LV', fabricante: 'Axis', tipoDispositivo: 'Cámara' },
    { id: 'axis-c1310', nombre: 'C1310-E', fabricante: 'Axis', tipoDispositivo: 'Bocina' },
    { id: 'hid-signo', nombre: 'Signo', fabricante: 'HID', tipoDispositivo: 'Lector' },
  ],
  clientes: [],
  ubicaciones: [],
  usuarios: [],
  preguntasDinamicas: {
    Cámara: ['Limpieza', 'Visualización', 'Montaje', 'Enfoque'],
    Bocina: ['Audio', 'Conexión', 'Montaje', 'Prueba de volumen'],
    Puerta: ['Cierre', 'Alineación', 'Bisagras', 'Sensor'],
    'Control de acceso': ['Lector', 'Apertura', 'Evento en sistema', 'Botón de salida'],
  },
};

export async function fetchBoletas(sessionToken, filters = {}) {
  const response = await apiGet('getBoletas', cleanPayload({ sessionToken, token: sessionToken, ...filters }));
  const rows = response.boletas || response.rows || response.data || [];
  return Array.isArray(rows) ? rows.map(normalizeBoleta) : [];
}

export async function fetchBoletaCatalogs(sessionToken) {
  try {
    const response = await apiGet('getBoletaCatalogs', { sessionToken, token: sessionToken });
    return mergeCatalogs(response.catalogs || response.data || response);
  } catch (error) {
    console.warn('No se pudieron cargar catálogos desde backend, usando catálogos base.', error);
    return DEFAULT_CATALOGS;
  }
}

export async function saveBoleta(sessionToken, boleta) {
  const response = await apiPost('saveBoleta', {
    sessionToken,
    token: sessionToken,
    boleta: cleanPayload(boleta),
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar la boleta.');
  return normalizeBoleta(response.boleta || response.row || response.data || response);
}

export async function deleteBoleta(sessionToken, boletaId) {
  const response = await apiPost('deleteBoleta', {
    sessionToken,
    token: sessionToken,
    BoletaID: boletaId,
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo eliminar la boleta.');
  return response;
}

export async function uploadBoletaEvidence(sessionToken, boletaId, evidence) {
  const response = await apiPost('saveBoletaEvidence', {
    sessionToken,
    token: sessionToken,
    BoletaID: boletaId,
    evidencia: cleanPayload(evidence),
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar la evidencia.');
  return response.evidencia || response.data || response;
}

export async function saveBoletaSignature(sessionToken, boletaId, signatureDataUrl) {
  const response = await apiPost('saveBoletaSignature', {
    sessionToken,
    token: sessionToken,
    BoletaID: boletaId,
    firma: signatureDataUrl,
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar la firma.');
  return response.firma || response.data || response;
}

export async function generateBoletaPdf(sessionToken, boletaId) {
  return runBoletaAction(sessionToken, 'generateBoletaPdf', boletaId, 'No se pudo generar el PDF.');
}

export async function sendBoletaEmail(sessionToken, boletaId, options = {}) {
  return runBoletaAction(sessionToken, 'sendBoletaEmail', boletaId, 'No se pudo enviar el correo.', options);
}

export async function sendBoletaChat(sessionToken, boletaId, options = {}) {
  return runBoletaAction(sessionToken, 'sendBoletaChat', boletaId, 'No se pudo enviar el mensaje de Google Chat.', options);
}

export async function finalizeBoleta(sessionToken, boletaId, options = {}) {
  return runBoletaAction(sessionToken, 'finalizeBoleta', boletaId, 'No se pudo finalizar la boleta.', options);
}

export async function sendBoletaTest(sessionToken, boletaId, channel = 'chat') {
  return runBoletaAction(sessionToken, 'sendBoletaTest', boletaId, 'No se pudo enviar la prueba.', { channel, modoPrueba: true });
}

async function runBoletaAction(sessionToken, action, boletaId, fallbackError, extra = {}) {
  const response = await apiPost(action, {
    sessionToken,
    token: sessionToken,
    BoletaID: boletaId,
    boletaId,
    ...extra,
  });

  if (response.ok === false) throw new Error(response.error || fallbackError);
  return response.boleta ? normalizeBoleta(response.boleta) : response;
}

export async function fileToDataUrl(file) {
  if (!file) return '';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mergeCatalogs(remote = {}) {
  return {
    ...DEFAULT_CATALOGS,
    ...remote,
    estados: safeArray(remote.estados, DEFAULT_CATALOGS.estados),
    categorias: safeArray(remote.categorias, DEFAULT_CATALOGS.categorias),
    tiposDispositivo: safeArray(remote.tiposDispositivo || remote.tipos, DEFAULT_CATALOGS.tiposDispositivo),
    fabricantes: safeArray(remote.fabricantes, DEFAULT_CATALOGS.fabricantes),
    modelos: safeArray(remote.modelos, DEFAULT_CATALOGS.modelos),
    clientes: safeArray(remote.clientes, DEFAULT_CATALOGS.clientes),
    ubicaciones: safeArray(remote.ubicaciones, DEFAULT_CATALOGS.ubicaciones),
    usuarios: safeArray(remote.usuarios, DEFAULT_CATALOGS.usuarios),
    preguntasDinamicas: remote.preguntasDinamicas || remote.preguntas || DEFAULT_CATALOGS.preguntasDinamicas,
  };
}

function safeArray(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function normalizeBoleta(item = {}) {
  const asignados = item.AsignadoA || item.asignadoA || item.asignados || '';
  return {
    ...item,
    BoletaID: item.BoletaID || item.boletaId || item.id || '',
    Version: item.Version || item.version || '',
    Estado: item.Estado || item.estado || 'Pendiente',
    Fecha: normalizeDate(item.Fecha || item.fecha),
    HoraInicio: item.HoraInicio || item.horaInicio || '',
    HoraFinal: item.HoraFinal || item.horaFinal || '',
    HorasTotales: item.HorasTotales || item.horasTotales || '',
    ClienteID: item.ClienteID || item.clienteId || '',
    Cliente: item.Cliente || item.cliente || '',
    UbicacionID: item.UbicacionID || item.ubicacionId || '',
    Ubicacion: item.Ubicacion || item.ubicacion || '',
    UbicacionEquipo: item.UbicacionEquipo || item.ubicacionEquipo || '',
    Supervisor: item.Supervisor || item.supervisor || '',
    CorreoCliente: item.CorreoCliente || item.correoCliente || '',
    CorreoSupervisor: item.CorreoSupervisor || item.correoSupervisor || '',
    Categoria: item.Categoria || item.categoria || '',
    TipoDispositivo: item.TipoDispositivo || item.tipoDispositivo || '',
    DispositivoID: item.DispositivoID || item.dispositivoId || '',
    Fabricante: item.Fabricante || item.fabricante || '',
    Modelo: item.Modelo || item.modelo || '',
    Serie: item.Serie || item.serie || '',
    Titulo: item.Titulo || item.titulo || '',
    TipoFalla: item.TipoFalla || item.tipoFalla || '',
    RazonVisita: item.RazonVisita || item.razonVisita || '',
    Descripcion: item.Descripcion || item.descripcion || '',
    PruebasRealizadas: item.PruebasRealizadas || item.pruebasRealizadas || '',
    Resultado: item.Resultado || item.resultado || '',
    Recomendaciones: item.Recomendaciones || item.recomendaciones || '',
    AsignadoA: Array.isArray(asignados) ? asignados : String(asignados).split(',').map((v) => v.trim()).filter(Boolean),
    Firma: item.Firma || item.firma || '',
    DocumentoURL: item.DocumentoURL || item.documentoUrl || '',
    PDFURL: item.PDFURL || item.pdfUrl || '',
    CarpetaURL: item.CarpetaURL || item.carpetaUrl || '',
    CreadoPor: item.CreadoPor || item.creadoPor || '',
    ActualizadoPor: item.ActualizadoPor || item.actualizadoPor || '',
    FechaCreacion: item.FechaCreacion || item.fechaCreacion || '',
    FechaActualizacion: item.FechaActualizacion || item.fechaActualizacion || '',
    evidencias: item.evidencias || item.Evidencias || [],
    respuestasDinamicas: item.respuestasDinamicas || item.RespuestasDinamicas || {},
  };
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function cleanPayload(value) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([, entry]) => entry !== undefined && entry !== null)
  );
}
