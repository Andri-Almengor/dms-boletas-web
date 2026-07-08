/**
 * DMS Boletas Web - Endpoints administrativos para Google Apps Script.
 *
 * Este archivo está pensado para integrarse al backend existente.
 * No cambia la estructura de la base de datos: usa las hojas existentes si están creadas.
 *
 * Acciones cubiertas:
 * - getUsers
 * - saveUser
 * - resetUserPassword
 * - toggleUserActive
 * - getAdminCatalogs
 * - saveCatalogItem
 * - deleteCatalogItem
 * - getConfig
 * - saveConfig
 * - testConfigChannel
 */

const DMS_ADMIN_SHEETS = {
  USUARIOS: 'Usuarios',
  TIPOS_DISPOSITIVO: 'TiposDispositivo',
  FABRICANTES: 'Fabricantes',
  MODELOS: 'Modelos',
  PREGUNTAS: 'PreguntasDinamicas',
  CATEGORIAS: 'Categorias',
  CONFIG: 'Configuracion',
};

const DMS_ADMIN_HEADERS = {
  Usuarios: ['UsuarioID', 'Nombre', 'Rol', 'Correo', 'PasswordHash', 'Salt', 'DebeCambiarPassword', 'RolID', 'Activo', 'FechaCreacion', 'FechaActualizacion', 'Permisos'],
  TiposDispositivo: ['ID', 'Nombre', 'Activo', 'FechaCreacion', 'FechaActualizacion'],
  Fabricantes: ['ID', 'Nombre', 'Activo', 'FechaCreacion', 'FechaActualizacion'],
  Modelos: ['ID', 'TipoDispositivo', 'Fabricante', 'Modelo', 'ImagenReferencia', 'Activo', 'FechaCreacion', 'FechaActualizacion'],
  PreguntasDinamicas: ['ID', 'TipoDispositivo', 'Pregunta', 'TipoRespuesta', 'Obligatorio', 'Activo', 'FechaCreacion', 'FechaActualizacion'],
  Categorias: ['ID', 'Nombre', 'Activo', 'FechaCreacion', 'FechaActualizacion'],
  Configuracion: ['Clave', 'Valor', 'FechaActualizacion'],
};

/**
 * Agrega estos cases al dispatcher principal del backend:
 *
 * case 'getUsers': return dmsGetUsers_(data);
 * case 'saveUser': return dmsSaveUser_(data);
 * case 'createUser': return dmsSaveUser_(data);
 * case 'updateUser': return dmsSaveUser_(data);
 * case 'resetUserPassword': return dmsResetUserPassword_(data);
 * case 'toggleUserActive': return dmsToggleUserActive_(data);
 * case 'getAdminCatalogs': return dmsGetAdminCatalogs_(data);
 * case 'saveCatalogItem': return dmsSaveCatalogItem_(data);
 * case 'deleteCatalogItem': return dmsDeleteCatalogItem_(data);
 * case 'getConfig': return dmsGetConfig_(data);
 * case 'saveConfig': return dmsSaveConfig_(data);
 * case 'testConfigChannel': return dmsTestConfigChannel_(data);
 */

function dmsGetUsers_() {
  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.USUARIOS);
  const rows = dmsReadObjects_(sheet);
  return dmsOk_({ users: rows });
}

function dmsSaveUser_(data) {
  const user = data.user || data.usuario || data;
  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.USUARIOS);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS.Usuarios);
  const now = dmsNow_();

  const usuarioId = user.UsuarioID || user.UserID || dmsNextId_('USR');
  const existing = dmsFindRowByKey_(sheet, headers, 'UsuarioID', usuarioId);
  const current = existing ? dmsRowToObject_(headers, sheet.getRange(existing.row, 1, 1, headers.length).getValues()[0]) : {};

  let salt = current.Salt || Utilities.getUuid();
  let passwordHash = current.PasswordHash || '';

  if (user.PasswordTemporal) {
    salt = Utilities.getUuid();
    passwordHash = dmsHashPassword_(String(user.PasswordTemporal), salt);
  }

  const next = {
    UsuarioID: usuarioId,
    Nombre: user.Nombre || user.nombre || current.Nombre || '',
    Rol: user.Rol || user.rol || current.Rol || 'Técnico',
    Correo: user.Correo || user.correo || user.Email || current.Correo || '',
    PasswordHash: passwordHash,
    Salt: salt,
    DebeCambiarPassword: dmsBool_(user.DebeCambiarPassword, true),
    RolID: user.RolID || current.RolID || dmsRoleId_(user.Rol || user.rol || current.Rol || 'Técnico'),
    Activo: dmsBool_(user.Activo, true),
    FechaCreacion: current.FechaCreacion || now,
    FechaActualizacion: now,
    Permisos: Array.isArray(user.Permisos) ? user.Permisos.join(',') : (user.Permisos || current.Permisos || ''),
  };

  dmsUpsertObject_(sheet, headers, 'UsuarioID', usuarioId, next);
  return dmsOk_({ user: next });
}

function dmsResetUserPassword_(data) {
  const usuarioId = data.UsuarioID || data.userId;
  if (!usuarioId) return dmsFail_('UsuarioID requerido.');

  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.USUARIOS);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS.Usuarios);
  const found = dmsFindRowByKey_(sheet, headers, 'UsuarioID', usuarioId);
  if (!found) return dmsFail_('Usuario no encontrado.');

  const values = sheet.getRange(found.row, 1, 1, headers.length).getValues()[0];
  const user = dmsRowToObject_(headers, values);
  const salt = Utilities.getUuid();
  user.PasswordHash = dmsHashPassword_('DMS12345', salt);
  user.Salt = salt;
  user.DebeCambiarPassword = true;
  user.FechaActualizacion = dmsNow_();
  dmsWriteObjectToRow_(sheet, headers, found.row, user);
  return dmsOk_({ message: 'Contraseña reiniciada.', temporal: 'DMS12345' });
}

function dmsToggleUserActive_(data) {
  const usuarioId = data.UsuarioID || data.userId;
  if (!usuarioId) return dmsFail_('UsuarioID requerido.');

  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.USUARIOS);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS.Usuarios);
  const found = dmsFindRowByKey_(sheet, headers, 'UsuarioID', usuarioId);
  if (!found) return dmsFail_('Usuario no encontrado.');

  const user = dmsRowToObject_(headers, sheet.getRange(found.row, 1, 1, headers.length).getValues()[0]);
  user.Activo = dmsBool_(data.Activo, true);
  user.FechaActualizacion = dmsNow_();
  dmsWriteObjectToRow_(sheet, headers, found.row, user);
  return dmsOk_({ user: user });
}

function dmsGetAdminCatalogs_() {
  return dmsOk_({
    catalogs: {
      tipos: dmsReadObjects_(dmsGetSheet_(DMS_ADMIN_SHEETS.TIPOS_DISPOSITIVO)),
      fabricantes: dmsReadObjects_(dmsGetSheet_(DMS_ADMIN_SHEETS.FABRICANTES)),
      modelos: dmsReadObjects_(dmsGetSheet_(DMS_ADMIN_SHEETS.MODELOS)),
      preguntas: dmsReadObjects_(dmsGetSheet_(DMS_ADMIN_SHEETS.PREGUNTAS)),
      categorias: dmsReadObjects_(dmsGetSheet_(DMS_ADMIN_SHEETS.CATEGORIAS)),
    },
  });
}

function dmsSaveCatalogItem_(data) {
  const catalog = data.catalog || data.Catalogo;
  const item = data.item || data.registro || {};
  const sheetName = dmsCatalogSheetName_(catalog);
  if (!sheetName) return dmsFail_('Catálogo no soportado: ' + catalog);

  const sheet = dmsGetSheet_(sheetName);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS[sheetName]);
  const id = item.ID || item.id || dmsNextId_(dmsCatalogPrefix_(catalog));
  const now = dmsNow_();
  const normalized = dmsNormalizeCatalogItem_(catalog, id, item, now);
  dmsUpsertObject_(sheet, headers, 'ID', id, normalized);
  return dmsOk_({ item: normalized });
}

function dmsDeleteCatalogItem_(data) {
  const catalog = data.catalog || data.Catalogo;
  const itemId = data.itemId || data.ID;
  const sheetName = dmsCatalogSheetName_(catalog);
  if (!sheetName) return dmsFail_('Catálogo no soportado: ' + catalog);

  const sheet = dmsGetSheet_(sheetName);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS[sheetName]);
  const found = dmsFindRowByKey_(sheet, headers, 'ID', itemId) || dmsFindRowByKey_(sheet, headers, 'Nombre', itemId);
  if (!found) return dmsFail_('Registro no encontrado.');
  sheet.deleteRow(found.row);
  return dmsOk_({ deleted: itemId });
}

function dmsGetConfig_() {
  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.CONFIG);
  dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS.Configuracion);
  const rows = dmsReadObjects_(sheet);
  const config = {};
  rows.forEach((row) => config[row.Clave] = row.Valor);
  return dmsOk_({ config: dmsConfigDefaults_(config) });
}

function dmsSaveConfig_(data) {
  const config = data.config || data;
  const sheet = dmsGetSheet_(DMS_ADMIN_SHEETS.CONFIG);
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS.Configuracion);
  const merged = dmsConfigDefaults_(config);
  Object.keys(merged).forEach((key) => {
    dmsUpsertObject_(sheet, headers, 'Clave', key, { Clave: key, Valor: merged[key], FechaActualizacion: dmsNow_() });
  });
  return dmsOk_({ config: merged });
}

function dmsTestConfigChannel_(data) {
  const channel = data.channel || 'chatPruebas';
  const config = dmsGetConfig_().config;
  const text = 'Prueba DMS Boletas Web - ' + channel + ' - ' + dmsNow_();

  if (channel === 'correoPruebas') {
    GmailApp.sendEmail(config.correoPruebas, 'Prueba DMS Boletas Web', text);
    return dmsOk_({ sent: true, channel: channel });
  }

  const url = channel === 'chatProduccion' ? config.chatProduccion : config.chatPruebas;
  if (!url) return dmsFail_('Webhook no configurado para ' + channel);
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: text }),
    muteHttpExceptions: true,
  });
  return dmsOk_({ sent: true, channel: channel });
}

function dmsGetSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (DMS_ADMIN_HEADERS[name]) dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS[name]);
  return sheet;
}

function dmsEnsureHeaders_(sheet, headers) {
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const isEmpty = current.every((value) => !value);
  if (isEmpty) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0].filter(Boolean);
}

function dmsReadObjects_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const headers = dmsEnsureHeaders_(sheet, DMS_ADMIN_HEADERS[sheet.getName()] || []);
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map((row) => dmsRowToObject_(headers, row));
}

function dmsRowToObject_(headers, row) {
  const obj = {};
  headers.forEach((header, index) => obj[header] = row[index]);
  return obj;
}

function dmsFindRowByKey_(sheet, headers, key, value) {
  if (!value) return null;
  const keyIndex = headers.indexOf(key);
  if (keyIndex < 0 || sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(value)) return { row: i + 2 };
  }
  return null;
}

function dmsUpsertObject_(sheet, headers, key, keyValue, obj) {
  const found = dmsFindRowByKey_(sheet, headers, key, keyValue);
  if (found) dmsWriteObjectToRow_(sheet, headers, found.row, obj);
  else sheet.appendRow(headers.map((header) => obj[header] !== undefined ? obj[header] : ''));
}

function dmsWriteObjectToRow_(sheet, headers, rowNumber, obj) {
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map((header) => obj[header] !== undefined ? obj[header] : '')]);
}

function dmsNormalizeCatalogItem_(catalog, id, item, now) {
  if (catalog === 'modelos') {
    return {
      ID: id,
      TipoDispositivo: item.TipoDispositivo || item.tipoDispositivo || '',
      Fabricante: item.Fabricante || item.fabricante || '',
      Modelo: item.Modelo || item.modelo || '',
      ImagenReferencia: item.ImagenReferencia || item.imagenReferencia || '',
      Activo: dmsBool_(item.Activo ?? item.activo, true),
      FechaCreacion: item.FechaCreacion || now,
      FechaActualizacion: now,
    };
  }
  if (catalog === 'preguntas') {
    return {
      ID: id,
      TipoDispositivo: item.TipoDispositivo || item.tipoDispositivo || '',
      Pregunta: item.Pregunta || item.pregunta || '',
      TipoRespuesta: item.TipoRespuesta || item.tipoRespuesta || 'Sí/No',
      Obligatorio: dmsBool_(item.Obligatorio ?? item.obligatorio, true),
      Activo: dmsBool_(item.Activo ?? item.activo, true),
      FechaCreacion: item.FechaCreacion || now,
      FechaActualizacion: now,
    };
  }
  return {
    ID: id,
    Nombre: item.Nombre || item.nombre || '',
    Activo: dmsBool_(item.Activo ?? item.activo, true),
    FechaCreacion: item.FechaCreacion || now,
    FechaActualizacion: now,
  };
}

function dmsCatalogSheetName_(catalog) {
  const map = {
    tipos: DMS_ADMIN_SHEETS.TIPOS_DISPOSITIVO,
    tiposDispositivo: DMS_ADMIN_SHEETS.TIPOS_DISPOSITIVO,
    fabricantes: DMS_ADMIN_SHEETS.FABRICANTES,
    modelos: DMS_ADMIN_SHEETS.MODELOS,
    preguntas: DMS_ADMIN_SHEETS.PREGUNTAS,
    categorias: DMS_ADMIN_SHEETS.CATEGORIAS,
  };
  return map[catalog];
}

function dmsCatalogPrefix_(catalog) {
  return { tipos: 'TIP', tiposDispositivo: 'TIP', fabricantes: 'FAB', modelos: 'MOD', preguntas: 'PRE', categorias: 'CAT' }[catalog] || 'CAT';
}

function dmsConfigDefaults_(config) {
  return {
    correosCC: config.correosCC || config.CorreosCC || 'yehuda.karmona@solutionsdms.com, raul.mayorga@solutionsdms.com, alejandra.umana@solutionsdms.com',
    correoPruebas: config.correoPruebas || config.CorreoPruebas || 'andrick.almengor@solutionsdms.com',
    chatProduccion: config.chatProduccion || config.ChatProduccion || '',
    chatPruebas: config.chatPruebas || config.ChatPruebas || '',
    modoPruebas: dmsBool_(config.modoPruebas || config.ModoPruebas, false),
    templateBoletaId: config.templateBoletaId || config.TemplateBoletaID || '',
    carpetaRaizDriveId: config.carpetaRaizDriveId || config.CarpetaRaizDriveID || '',
  };
}

function dmsRoleId_(role) {
  const value = String(role || '').toLowerCase();
  if (value.indexOf('admin') >= 0) return 'ROL_ADMIN';
  if (value.indexOf('super') >= 0) return 'ROL_SUPERVISOR';
  return 'ROL_TECNICO';
}

function dmsHashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return Utilities.base64Encode(bytes);
}

function dmsNextId_(prefix) {
  return prefix + '_' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function dmsBool_(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'si', 'sí', 'yes', 'x', 'activo'].indexOf(String(value).toLowerCase()) >= 0;
}

function dmsNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Costa_Rica', 'yyyy-MM-dd HH:mm:ss');
}

function dmsOk_(payload) {
  return Object.assign({ ok: true }, payload || {});
}

function dmsFail_(message) {
  return { ok: false, error: message };
}
