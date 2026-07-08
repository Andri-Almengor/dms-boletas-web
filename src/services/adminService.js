import { apiGet, apiPost } from './apiClient.js';

export async function getAdminBootstrap(sessionToken) {
  return apiGet('adminBootstrap', { sessionToken, token: sessionToken });
}

export async function fetchUsers(sessionToken) {
  const response = await apiGet('getUsers', { sessionToken, token: sessionToken });
  const rows = response.users || response.usuarios || response.rows || response.data || [];
  return Array.isArray(rows) ? rows.map(normalizeUserRow) : [];
}

export async function saveUser(sessionToken, user) {
  const response = await apiPost('saveUser', { sessionToken, token: sessionToken, user, usuario: user });
  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar el usuario.');
  return normalizeUserRow(response.user || response.usuario || response.row || response.data || response);
}

export async function resetUserPassword(sessionToken, userId) {
  const response = await apiPost('resetUserPassword', { sessionToken, token: sessionToken, UsuarioID: userId, userId });
  if (response.ok === false) throw new Error(response.error || 'No se pudo reiniciar la contraseña.');
  return response;
}

export async function toggleUserActive(sessionToken, userId, active) {
  const response = await apiPost('toggleUserActive', { sessionToken, token: sessionToken, UsuarioID: userId, Activo: active });
  if (response.ok === false) throw new Error(response.error || 'No se pudo cambiar el estado del usuario.');
  return response;
}

export async function listUsers(sessionToken) {
  return { ok: true, users: await fetchUsers(sessionToken) };
}

export async function createUser(sessionToken, values) {
  return saveUser(sessionToken, values);
}

export async function updateUser(sessionToken, values) {
  return saveUser(sessionToken, values);
}

export async function fetchAdminCatalogs(sessionToken) {
  const response = await apiGet('getAdminCatalogs', { sessionToken, token: sessionToken });
  const data = response.catalogs || response.data || response;
  return {
    tipos: normalizeRows(data.tipos || data.tiposDispositivo || data.deviceTypes || []),
    fabricantes: normalizeRows(data.fabricantes || data.manufacturers || []),
    modelos: normalizeRows(data.modelos || data.models || []),
    preguntas: normalizeRows(data.preguntas || data.preguntasDinamicas || data.questions || []),
    categorias: normalizeRows(data.categorias || data.categories || []),
  };
}

export async function saveCatalogItem(sessionToken, catalog, item) {
  const response = await apiPost('saveCatalogItem', { sessionToken, token: sessionToken, catalog, item });
  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar el catálogo.');
  return response.item || response.data || response;
}

export async function deleteCatalogItem(sessionToken, catalog, itemId) {
  const response = await apiPost('deleteCatalogItem', { sessionToken, token: sessionToken, catalog, itemId, ID: itemId });
  if (response.ok === false) throw new Error(response.error || 'No se pudo eliminar el registro.');
  return response;
}

export async function listClients(sessionToken) {
  return apiGet('listClients', { sessionToken, token: sessionToken });
}

export async function saveClient(sessionToken, values) {
  return apiPost('saveClient', { sessionToken, token: sessionToken, ...values });
}

export async function listCategories(sessionToken) {
  const catalogs = await fetchAdminCatalogs(sessionToken);
  return { ok: true, categories: catalogs.categorias };
}

export async function saveCategory(sessionToken, values) {
  return saveCatalogItem(sessionToken, 'categorias', values);
}

export async function fetchConfig(sessionToken) {
  const response = await apiGet('getConfig', { sessionToken, token: sessionToken });
  const data = response.config || response.data || response;
  return {
    correosCC: data.correosCC || data.CorreosCC || 'yehuda.karmona@solutionsdms.com, raul.mayorga@solutionsdms.com, alejandra.umana@solutionsdms.com',
    correoPruebas: data.correoPruebas || data.CorreoPruebas || 'andrick.almengor@solutionsdms.com',
    chatProduccion: data.chatProduccion || data.ChatProduccion || data.GoogleChatWebhook || '',
    chatPruebas: data.chatPruebas || data.ChatPruebas || '',
    modoPruebas: normalizeBoolean(data.modoPruebas ?? data.ModoPruebas ?? false),
    templateBoletaId: data.templateBoletaId || data.TemplateBoletaID || '',
    carpetaRaizDriveId: data.carpetaRaizDriveId || data.CarpetaRaizDriveID || '',
  };
}

export async function getConfig(sessionToken) {
  return { ok: true, config: await fetchConfig(sessionToken) };
}

export async function saveConfig(sessionToken, config) {
  const response = await apiPost('saveConfig', { sessionToken, token: sessionToken, config });
  if (response.ok === false) throw new Error(response.error || 'No se pudo guardar la configuración.');
  return response.config || response.data || response;
}

export async function testConfigChannel(sessionToken, channel) {
  const response = await apiPost('testConfigChannel', { sessionToken, token: sessionToken, channel });
  if (response.ok === false) throw new Error(response.error || 'No se pudo enviar la prueba.');
  return response;
}

export function emptyUser() {
  return {
    UsuarioID: '',
    Nombre: '',
    Usuario: '',
    Correo: '',
    Rol: 'Técnico',
    PasswordTemporal: 'DMS12345',
    DebeCambiarPassword: true,
    Activo: true,
    Permisos: ['boletas.view', 'boletas.create', 'boletas.edit'],
  };
}

export const ALL_PERMISSIONS = [
  ['boletas.view', 'Ver boletas'],
  ['boletas.create', 'Crear boletas'],
  ['boletas.edit', 'Editar boletas'],
  ['boletas.delete', 'Eliminar boletas'],
  ['boletas.finalize', 'Finalizar boletas'],
  ['clientes.view', 'Ver clientes'],
  ['clientes.create', 'Crear clientes'],
  ['clientes.edit', 'Editar clientes'],
  ['maintenance.view', 'Ver mantenimientos'],
  ['maintenance.edit', 'Editar mantenimientos'],
  ['admin.view', 'Ver administración'],
  ['users.manage', 'Gestionar usuarios'],
  ['catalogs.manage', 'Gestionar catálogos'],
  ['config.manage', 'Gestionar configuración'],
];

function normalizeUserRow(row = {}) {
  if (Array.isArray(row)) {
    return {
      UsuarioID: row[0] || '',
      Nombre: row[1] || '',
      Usuario: row[1] || '',
      Rol: row[2] || row[7] || '',
      Correo: row[3] || '',
      DebeCambiarPassword: normalizeBoolean(row[6]),
      RolID: row[7] || '',
      Activo: normalizeBoolean(row[8] ?? true),
      FechaCreacion: row[9] || '',
      FechaActualizacion: row[10] || '',
      Permisos: [],
    };
  }

  return {
    ...row,
    UsuarioID: row.UsuarioID || row.UserID || row.ID || row.id || row.RowID || '',
    Nombre: row.Nombre || row.name || row.nombre || '',
    Usuario: row.Usuario || row.username || row.UsuarioNombre || row.Nombre || '',
    Correo: row.Correo || row.Email || row.email || '',
    Rol: row.Rol || row.rol || row.Role || row.role || row.Perfil || '',
    DebeCambiarPassword: normalizeBoolean(row.DebeCambiarPassword ?? row.mustChangePassword ?? false),
    Activo: normalizeBoolean(row.Activo ?? row.activo ?? true),
    Permisos: normalizePermissions(row.Permisos || row.permissions || row.PermisosJSON),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => (typeof row === 'string' ? { id: row, nombre: row, activo: true } : { id: row.id || row.ID || row.RowID || row.nombre || row.Nombre || crypto.randomUUID(), ...row }));
}

function normalizePermissions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.entries(value).filter(([, enabled]) => normalizeBoolean(enabled)).map(([key]) => key);
  return String(value).split(/[,|;]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return false;
  return ['true', '1', 'si', 'sí', 'yes', 'y', 'x', 'activo'].includes(text);
}
