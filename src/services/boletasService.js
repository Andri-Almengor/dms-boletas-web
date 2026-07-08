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
  const categorias = normalizeNameList(remote.categorias || remote.categories || remote.Categorias, 'Categoria');
  const tiposDispositivo = normalizeNameList(remote.tiposDispositivo || remote.tipos || remote.deviceTypes || remote.TiposDispositivo, 'TipoDispositivo');
  const fabricantes = normalizeFabricantes(remote.fabricantes || remote.manufacturers || remote.Fabricantes);
  const modelos = normalizeModelos(remote.modelos || remote.models || remote.Modelos);
  const clientes = normalizeClientes(remote.clientes || remote.clients || remote.Clientes);
  const ubicaciones = normalizeUbicaciones(remote.ubicaciones || remote.locations || remote.Ubicaciones);
  const usuarios = normalizeUsuarios(remote.usuarios || remote.users || remote.Usuarios);
  const preguntasDinamicas = normalizePreguntas(remote.preguntasDinamicas || remote.preguntas || remote.questions || remote.PreguntasDinamicas);

  return {
    ...DEFAULT_CATALOGS,
    ...remote,
    estados: normalizeNameList(remote.estados || remote.Estados, null, DEFAULT_CATALOGS.estados),
    categorias: categorias.length ? categorias : DEFAULT_CATALOGS.categorias,
    tiposDispositivo: tiposDispositivo.length ? tiposDispositivo : DEFAULT_CATALOGS.tiposDispositivo,
    fabricantes: fabricantes.length ? fabricantes : DEFAULT_CATALOGS.fabricantes,
    modelos: modelos.length ? modelos : DEFAULT_CATALOGS.modelos,
    clientes,
    ubicaciones,
    usuarios,
    preguntasDinamicas: Object.keys(preguntasDinamicas).length ? preguntasDinamicas : DEFAULT_CATALOGS.preguntasDinamicas,
  };
}

function normalizeNameList(value, nameKey, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      return item?.nombre || item?.Nombre || item?.name || item?.[nameKey] || item?.Categoria || item?.TipoDispositivo || item?.Fabricante || item?.Modelo || item?.id || '';
    })
    .filter(Boolean);
}

function normalizeFabricantes(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return { id: item, nombre: item, tipos: [] };
    return {
      ...item,
      id: item.id || item.ID || item.FabricanteID || item.RowID || item.Fabricante || item.nombre || item.Nombre || '',
      nombre: item.nombre || item.Nombre || item.Fabricante || item.name || '',
      tipos: normalizeToArray(item.tipos || item.Tipos || item.tipoDispositivo || item.TipoDispositivo || item.TiposDispositivo),
    };
  }).filter((item) => item.nombre);
}

function normalizeModelos(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return { id: item, nombre: item, modelo: item, fabricante: '', tipoDispositivo: '' };
    const nombre = item.nombre || item.Nombre || item.modelo || item.Modelo || item.name || '';
    return {
      ...item,
      id: item.id || item.ID || item.ModeloID || item.RowID || nombre,
      nombre,
      modelo: nombre,
      fabricante: item.fabricante || item.Fabricante || item.NombreFabricante || '',
      tipoDispositivo: item.tipoDispositivo || item.TipoDispositivo || item.tipo || item.Tipo || '',
      imagenReferencia: item.imagenReferencia || item.ImagenReferencia || item.ImagenReferenciaURL || '',
    };
  }).filter((item) => item.nombre);
}

function normalizeClientes(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return { ClienteID: item, Cliente: item, Nombre: item };
    const nombre = item.Nombre || item.nombre || item.Cliente || item.Clientes || item.name || '';
    return {
      ...item,
      ClienteID: item.ClienteID || item.id || item.ID || item.RowID || nombre,
      Cliente: nombre,
      Nombre: nombre,
      CorreoCliente: item.CorreoCliente || item.CorreoPrincipal || item.Correo || item.email || '',
      ChatWebhookURL: item.ChatWebhookURL || item.ChatURL || item.GoogleChatURL || '',
    };
  }).filter((item) => item.Cliente);
}

function normalizeUbicaciones(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return { UbicacionID: item, Ubicacion: item, Nombre: item };
    const nombre = item.Ubicacion || item.Nombre || item.nombre || item.ubicacion || '';
    return {
      ...item,
      UbicacionID: item.UbicacionID || item.id || item.ID || item.RowID || nombre,
      Ubicacion: nombre,
      Nombre: nombre,
      ClienteID: item.ClienteID || item.clienteId || item.Cliente || item.cliente || '',
    };
  }).filter((item) => item.Ubicacion);
}

function normalizeUsuarios(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return { UsuarioID: item, Nombre: item, Correo: '' };
    const nombre = item.Nombre || item.name || item.nombre || item.Username || item.Usuario || item.Correo || '';
    return {
      ...item,
      UsuarioID: item.UsuarioID || item.id || item.ID || item.RowID || nombre,
      Nombre: nombre,
      Correo: item.Correo || item.email || item.Email || '',
      Rol: item.Rol || item.role || item.RolID || '',
      Activo: item.Activo ?? item.activo ?? true,
    };
  }).filter((item) => item.Nombre);
}

function normalizePreguntas(value) {
  if (!value) return {};
  if (!Array.isArray(value) && typeof value === 'object') return value;
  if (!Array.isArray(value)) return {};

  return value.reduce((acc, item) => {
    const tipo = item.tipoDispositivo || item.TipoDispositivo || item.Tipo || item.tipo || '';
    const pregunta = item.pregunta || item.Pregunta || item.nombre || item.Nombre || '';
    if (!tipo || !pregunta) return acc;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(pregunta);
    return acc;
  }, {});
}

function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(/[,|;]/).map((item) => item.trim()).filter(Boolean);
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
