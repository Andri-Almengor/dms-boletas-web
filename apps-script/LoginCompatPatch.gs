/*******************************************************
 * DMS BOLETAS WEB - LOGIN COMPAT PATCH
 *
 * Pega este archivo en Apps Script junto al Code.gs actual.
 * Este archivo reemplaza funciones de login para soportar hojas antiguas
 * con columnas como:
 * UsuarioID | Nombre | Rol | Correo | PasswordHash | Salt | DebeCambiarPassword | RolID | Activo
 *******************************************************/

function login_(data) {
  const username = String(data.username || data.usuario || data.email || data.Correo || '').toLowerCase().trim();
  const password = String(data.password || data.clave || data.Password || '');

  if (!username || !password) return fail_('Usuario y contraseña son requeridos.');

  const users = rows_(DMS.SHEETS.USERS);
  const user = users.find(u => {
    const candidates = [
      u.Username,
      u.Usuario,
      u.NombreUsuario,
      u.Nombre,
      u.Correo,
      u.Email
    ].filter(Boolean).map(x => String(x).toLowerCase().trim());
    return candidates.indexOf(username) >= 0;
  });

  if (!user) return fail_('Usuario no encontrado.');
  if (!bool_(uVal_(user, ['Activo'], true), true)) return fail_('Usuario inactivo.');

  const salt = uVal_(user, ['PasswordSalt', 'Salt', 'salt'], '');
  const storedHash = uVal_(user, ['PasswordHash', 'Hash', 'passwordHash'], '');

  if (!storedHash) return fail_('El usuario no tiene contraseña configurada.');

  const valid =
    hash_(password, salt) === storedHash ||
    hashCompat_(password, salt) === storedHash ||
    password === storedHash;

  if (!valid) return fail_('Credenciales inválidas.');

  const token = uuid_() + uuid_();
  append_(DMS.SHEETS.SESSIONS, {
    SessionID: uuid_(),
    UsuarioID: uVal_(user, ['UsuarioID', 'UserID', 'ID'], ''),
    Token: token,
    FechaCreacion: now_(),
    FechaExpiracion: addDays_(7),
    Activo: true
  });

  return ok_({
    sessionToken: token,
    token: token,
    user: safeUser_(user)
  });
}

function safeUser_(u) {
  const rolRaw = uVal_(u, ['Rol', 'rol', 'Role', 'role'], '') || roleName_(uVal_(u, ['RolID'], ''));
  const rolId = uVal_(u, ['RolID'], '') || roleId_(rolRaw);

  return {
    UsuarioID: uVal_(u, ['UsuarioID', 'UserID', 'ID'], ''),
    Nombre: uVal_(u, ['Nombre', 'name'], 'Usuario'),
    Username: uVal_(u, ['Username', 'Usuario', 'NombreUsuario'], uVal_(u, ['Nombre'], '')),
    Correo: uVal_(u, ['Correo', 'Email', 'email'], ''),
    Rol: normalizeBackendRole_(rolRaw || rolId),
    RolID: rolId,
    Activo: bool_(uVal_(u, ['Activo'], true), true),
    DebeCambiarPassword: bool_(uVal_(u, ['DebeCambiarPassword', 'CambiarPassword', 'MustChangePassword'], false), false),
    Permisos: uVal_(u, ['Permisos', 'permissions'], '') || defaultPerms_(rolId)
  };
}

function changePassword_(user, data) {
  const oldPass = String(data.oldPassword || data.currentPassword || data.actual || data.passwordActual || '');
  const newPass = String(data.newPassword || data.nueva || data.passwordNuevo || '');

  if (!newPass) return fail_('La nueva contraseña es requerida.');

  const salt = uVal_(user, ['PasswordSalt', 'Salt', 'salt'], '');
  const storedHash = uVal_(user, ['PasswordHash', 'Hash', 'passwordHash'], '');

  if (storedHash && oldPass) {
    const valid = hash_(oldPass, salt) === storedHash || hashCompat_(oldPass, salt) === storedHash || oldPass === storedHash;
    if (!valid) return fail_('Contraseña actual incorrecta.');
  }

  const newSalt = uuid_();
  const row = findRow_(DMS.SHEETS.USERS, 'UsuarioID', uVal_(user, ['UsuarioID'], ''));
  if (!row) return fail_('Usuario no encontrado.');

  const sh = sheet_(DMS.SHEETS.USERS);
  const h = headers_(sh);

  writeAnyCell_(sh, h, row, ['PasswordSalt', 'Salt'], newSalt);
  writeAnyCell_(sh, h, row, ['PasswordHash'], hash_(newPass, newSalt));
  writeAnyCell_(sh, h, row, ['DebeCambiarPassword'], false);
  writeAnyCell_(sh, h, row, ['FechaActualizacion'], now_());

  return ok_({ message: 'Contraseña actualizada.' });
}

function resetPassword_(actor, id) {
  const u = getById_(DMS.SHEETS.USERS, 'UsuarioID', id);
  if (!u) return fail_('Usuario no encontrado.');

  const newSalt = uuid_();
  const row = findRow_(DMS.SHEETS.USERS, 'UsuarioID', id);
  const sh = sheet_(DMS.SHEETS.USERS);
  const h = headers_(sh);

  writeAnyCell_(sh, h, row, ['PasswordSalt', 'Salt'], newSalt);
  writeAnyCell_(sh, h, row, ['PasswordHash'], hash_('DMS12345', newSalt));
  writeAnyCell_(sh, h, row, ['DebeCambiarPassword'], true);
  writeAnyCell_(sh, h, row, ['FechaActualizacion'], now_());

  audit_(actor, 'resetPassword', 'usuarios', id, {});
  return ok_({ temporal: 'DMS12345' });
}

function uVal_(obj, keys, fallback) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') return obj[key];
  }
  return fallback;
}

function writeAnyCell_(sheet, headers, row, keys, value) {
  for (var i = 0; i < keys.length; i++) {
    var idx = headers.indexOf(keys[i]);
    if (idx >= 0) {
      sheet.getRange(row, idx + 1).setValue(value);
      return;
    }
  }

  sheet.getRange(1, headers.length + 1).setValue(keys[0]);
  sheet.getRange(row, headers.length + 1).setValue(value);
}

function normalizeBackendRole_(role) {
  var value = String(role || '').toLowerCase().trim();
  if (value === 'admin' || value === 'administrador' || value === 'rol_admin') return 'Administrador';
  if (value === 'tecnico' || value === 'técnico' || value === 'rol_tecnico') return 'Técnico';
  if (value === 'supervisor' || value === 'rol_supervisor') return 'Supervisor';
  return role || 'Sin rol';
}

function hashCompat_(password, salt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + String(salt), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(raw);
}
