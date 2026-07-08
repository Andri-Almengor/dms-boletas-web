import { apiGet, apiPost } from './apiClient.js';

export async function fetchMantenimientos(sessionToken, filters = {}) {
  const response = await apiGet('getMantenimientos', { sessionToken, token: sessionToken, ...filters });
  const rows = response.mantenimientos || response.rows || response.data || [];
  return Array.isArray(rows) ? rows.map(normalizeMantenimiento) : [];
}

export async function saveMantenimiento(sessionToken, mantenimiento) {
  const response = await apiPost('saveMantenimiento', {
    sessionToken,
    token: sessionToken,
    mantenimiento,
  });
  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar el mantenimiento.');
  return normalizeMantenimiento(response.mantenimiento || response.row || response.data || response);
}

export async function finalizeMantenimiento(sessionToken, mantenimientoId) {
  const response = await apiPost('finalizeMantenimiento', {
    sessionToken,
    token: sessionToken,
    MantenimientoID: mantenimientoId,
    mantenimientoId,
  });
  if (response.ok === false) throw new Error(response.error || 'No se pudo finalizar el mantenimiento.');
  return response;
}

export function emptyMantenimiento() {
  return {
    MantenimientoID: '',
    Fecha: new Date().toISOString().slice(0, 10),
    ClienteRef: '',
    Cliente: '',
    TituloMantenimiento: '',
    Estado: 'Pendiente',
    Responsable: '',
    DescripcionGeneral: '',
    FechaFinalizacion: '',
    evidencias: [],
  };
}

export function emptyMantenimientoEvidence() {
  return {
    id: crypto.randomUUID(),
    EvidenciaMantenimientoID: '',
    NombreDispositivo: '',
    Zona: '',
    Categoria: 'Cámara',
    Funcionamiento: 'Sí',
    EnUso: 'Sí, en uso',
    Observacion: '',
    Imagenes: [],
  };
}

function normalizeMantenimiento(item = {}) {
  return {
    ...item,
    MantenimientoID: item.MantenimientoID || item.id || '',
    Fecha: normalizeDate(item.Fecha || item.fecha),
    ClienteRef: item.ClienteRef || item.clienteRef || item.ClienteID || '',
    Cliente: item.Cliente || item.cliente || '',
    TituloMantenimiento: item.TituloMantenimiento || item.tituloMantenimiento || item.Titulo || '',
    Estado: item.Estado || item.estado || 'Pendiente',
    Responsable: item.Responsable || item.responsable || '',
    DescripcionGeneral: item.DescripcionGeneral || item.descripcionGeneral || '',
    FechaFinalizacion: item.FechaFinalizacion || item.fechaFinalizacion || '',
    evidencias: item.evidencias || item.Evidencias || item.RelatedEvidencia_Mantenimientos || [],
  };
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toISOString().slice(0, 10);
}
