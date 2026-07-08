import { apiGet, apiPost } from './apiClient.js';

export async function fetchClientes(sessionToken, filters = {}) {
  const response = await apiGet('getClientes', { sessionToken, token: sessionToken, ...filters });
  const rows = response.clientes || response.rows || response.data || [];
  return Array.isArray(rows) ? rows.map(normalizeCliente) : [];
}

export async function saveCliente(sessionToken, cliente) {
  const response = await apiPost('saveCliente', {
    sessionToken,
    token: sessionToken,
    cliente,
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar el cliente.');
  return normalizeCliente(response.cliente || response.row || response.data || response);
}

export async function deleteCliente(sessionToken, clienteId) {
  const response = await apiPost('deleteCliente', {
    sessionToken,
    token: sessionToken,
    ClienteID: clienteId,
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo eliminar el cliente.');
  return response;
}

export async function sendChatTest(sessionToken, cliente) {
  const response = await apiPost('sendChatTest', {
    sessionToken,
    token: sessionToken,
    ClienteID: cliente.ClienteID,
    ChatWebhookURL: cliente.ChatWebhookURL,
    cliente,
  });

  if (response.ok === false) throw new Error(response.error || 'No se pudo enviar la prueba al Chat.');
  return response;
}

export function normalizeCliente(item = {}) {
  return {
    ...item,
    ClienteID: item.ClienteID || item.ID || item.id || item.RowID || '',
    Nombre: item.Nombre || item.Cliente || item.Clientes || item.nombre || item.cliente || '',
    Contactos: normalizeList(item.Contactos || item.Contacto || item.contactos || item.contacto),
    Correos: normalizeList(item.Correos || item.Correo || item.correos || item.correo),
    Telefonos: normalizeList(item.Telefonos || item.Teléfonos || item.Telefono || item.telefonos || item.telefono),
    Notas: item.Notas || item.Nota || item.notas || item.nota || '',
    ChatWebhookURL: item.ChatWebhookURL || item.ChatURL || item.GoogleChatURL || item.LinkChatGoogle || item.linkChatGoogle || item.chat || '',
    Ubicaciones: normalizeLocations(item.Ubicaciones || item.ubicaciones || item.RelatedUbicaciones || []),
    Activo: normalizeBoolean(item.Activo ?? item.activo ?? true),
  };
}

export function emptyCliente() {
  return {
    ClienteID: '',
    Nombre: '',
    Contactos: [],
    Correos: [],
    Telefonos: [],
    Notas: '',
    ChatWebhookURL: '',
    Ubicaciones: [],
    Activo: true,
  };
}

export function emptyLocation() {
  return {
    id: crypto.randomUUID(),
    Nombre: '',
    Detalle: '',
    UbicacionesEquipo: [],
  };
}

export function emptyContact() {
  return {
    id: crypto.randomUUID(),
    Nombre: '',
    Cargo: '',
    Correo: '',
    Telefono: '',
  };
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeListItem);
  if (typeof value === 'object') return [normalizeListItem(value)];
  return String(value)
    .split(/[,;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ id: crypto.randomUUID(), Nombre: item, Correo: item.includes('@') ? item : '', Telefono: '' }));
}

function normalizeListItem(item) {
  if (typeof item === 'string') {
    return { id: crypto.randomUUID(), Nombre: item, Correo: item.includes('@') ? item : '', Telefono: '' };
  }

  return {
    id: item.id || item.ContactoID || crypto.randomUUID(),
    Nombre: item.Nombre || item.nombre || item.Contacto || item.contacto || '',
    Cargo: item.Cargo || item.cargo || '',
    Correo: item.Correo || item.Email || item.email || item.correo || '',
    Telefono: item.Telefono || item.Teléfono || item.telefono || '',
  };
}

function normalizeLocations(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeLocation);
  if (typeof value === 'string') {
    return value
      .split(/[,;|\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ id: crypto.randomUUID(), Nombre: item, Detalle: '', UbicacionesEquipo: [] }));
  }
  return [normalizeLocation(value)];
}

function normalizeLocation(item = {}) {
  return {
    id: item.id || item.UbicacionID || item.RowID || crypto.randomUUID(),
    UbicacionID: item.UbicacionID || item.id || '',
    Nombre: item.Nombre || item.Ubicacion || item.ubicacion || item.nombre || '',
    Detalle: item.Detalle || item.Descripcion || item.detalle || '',
    UbicacionesEquipo: normalizeEquipmentLocations(item.UbicacionesEquipo || item.ubicacionesEquipo || item.Puntos || item.puntos || []),
  };
}

function normalizeEquipmentLocations(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' ? item : item.Nombre || item.UbicacionEquipo || item.nombre || '')).filter(Boolean);
  return String(value).split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  return !['false', '0', 'no', 'inactivo'].includes(String(value || '').trim().toLowerCase());
}
