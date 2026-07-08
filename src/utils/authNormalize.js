const ROLE_FIELD_CANDIDATES = [
  'Rol',
  'rol',
  'Role',
  'role',
  'Perfil',
  'perfil',
  'TipoUsuario',
  'tipoUsuario',
  'Tipo_Usuario',
  'tipo_usuario',
  'Cargo',
  'cargo',
  'NivelAcceso',
  'nivelAcceso',
];

const PERMISSION_FIELD_CANDIDATES = [
  'Permisos',
  'permisos',
  'permissions',
  'Permissions',
  'Modulos',
  'modulos',
  'Accesos',
  'accesos',
  'PermisosJSON',
  'permisosJson',
];

export const PERMISSIONS = {
  BOLETAS_VIEW: 'boletas.view',
  BOLETAS_CREATE: 'boletas.create',
  BOLETAS_EDIT: 'boletas.edit',
  BOLETAS_DELETE: 'boletas.delete',
  BOLETAS_FINALIZE: 'boletas.finalize',
  CLIENTES_VIEW: 'clientes.view',
  CLIENTES_CREATE: 'clientes.create',
  CLIENTES_EDIT: 'clientes.edit',
  ADMIN_VIEW: 'admin.view',
  USERS_MANAGE: 'users.manage',
  CATALOGS_MANAGE: 'catalogs.manage',
  CONFIG_MANAGE: 'config.manage',
  MAINTENANCE_VIEW: 'maintenance.view',
  MAINTENANCE_EDIT: 'maintenance.edit',
};

const ROLE_DEFAULT_PERMISSIONS = {
  Administrador: Object.values(PERMISSIONS),
  Técnico: [
    PERMISSIONS.BOLETAS_VIEW,
    PERMISSIONS.BOLETAS_CREATE,
    PERMISSIONS.BOLETAS_EDIT,
    PERMISSIONS.BOLETAS_FINALIZE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_EDIT,
  ],
  Supervisor: [
    PERMISSIONS.BOLETAS_VIEW,
    PERMISSIONS.BOLETAS_EDIT,
    PERMISSIONS.BOLETAS_FINALIZE,
    PERMISSIONS.CLIENTES_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
  ],
};

export function normalizeUser(rawUser = {}) {
  const user = unwrapUser(rawUser);
  const roleRaw = pickFirst(user, ROLE_FIELD_CANDIDATES) || findRoleDeep(rawUser) || '';
  const normalizedRole = normalizeRole(roleRaw);
  const explicitPermissions = normalizePermissions(pickFirst(user, PERMISSION_FIELD_CANDIDATES));
  const fallbackPermissions = ROLE_DEFAULT_PERMISSIONS[normalizedRole] || [];

  return {
    id: user.UsuarioID || user.UserID || user.ID || user.id || user.RowID || user.rowId || user.RowId || '',
    username: user.Usuario || user.Username || user.username || user.NombreUsuario || user.nombreUsuario || user.User || user.user || '',
    name: user.Nombre || user.name || user.NombreCompleto || user.nombreCompleto || user.username || user.Usuario || user.Correo || 'Usuario',
    email: user.Correo || user.Email || user.email || user.Mail || user.mail || '',
    role: normalizedRole,
    rawRole: roleRaw,
    mustChangePassword: normalizeBoolean(
      user.DebeCambiarPassword ??
        user.debeCambiarPassword ??
        user.MustChangePassword ??
        user.mustChangePassword ??
        user.CambiarPassword ??
        user.cambiarPassword
    ),
    permissions: unique([...fallbackPermissions, ...explicitPermissions.map(normalizePermissionName)]),
    raw: user,
  };
}

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();

  if (['admin', 'administrador', 'administrator', 'administración', 'administracion'].includes(value)) return 'Administrador';
  if (['tecnico', 'técnico', 'technical', 'technician', 'soporte', 'mesa de ayuda'].includes(value)) return 'Técnico';
  if (['supervisor', 'coordinador', 'coordinator'].includes(value)) return 'Supervisor';

  return role ? String(role).trim() : 'Sin rol';
}

export function isAdmin(user) {
  return normalizeRole(user?.role || user?.rawRole) === 'Administrador';
}

export function hasPermission(user, permission) {
  if (isAdmin(user)) return true;
  const normalizedPermission = normalizePermissionName(permission);
  return (user?.permissions || []).map(normalizePermissionName).includes(normalizedPermission);
}

export function hasAnyPermission(user, permissions = []) {
  if (isAdmin(user)) return true;
  return permissions.some((permission) => hasPermission(user, permission));
}

function unwrapUser(rawUser = {}) {
  const candidates = [
    rawUser.user,
    rawUser.usuario,
    rawUser.Usuario,
    rawUser.data?.user,
    rawUser.data?.usuario,
    rawUser.data?.Usuario,
    rawUser.result?.user,
    rawUser.result?.usuario,
    rawUser.payload?.user,
    rawUser.payload?.usuario,
    rawUser,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate)) || {};
}

function pickFirst(source = {}, keys = []) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== '') return source[key];
  }

  const normalizedEntries = Object.entries(source).map(([key, value]) => [normalizeKey(key), value]);
  for (const expected of keys.map(normalizeKey)) {
    const found = normalizedEntries.find(([key, value]) => key === expected && value !== undefined && value !== null && String(value).trim() !== '');
    if (found) return found[1];
  }

  return '';
}

function findRoleDeep(value, depth = 0) {
  if (!value || depth > 5 || typeof value !== 'object') return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRoleDeep(item, depth + 1);
      if (found) return found;
    }
    return '';
  }

  const direct = pickFirst(value, ROLE_FIELD_CANDIDATES);
  if (direct) return direct;

  for (const item of Object.values(value)) {
    const found = findRoleDeep(item, depth + 1);
    if (found) return found;
  }

  return '';
}

function normalizePermissions(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => normalizeBoolean(enabled))
      .map(([key]) => key);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizePermissions(parsed);
    } catch {
      return trimmed
        .split(/[,|;]/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizePermissionName(permission) {
  const value = String(permission || '').trim();
  const lower = value.toLowerCase();

  const aliases = {
    'ver boletas': PERMISSIONS.BOLETAS_VIEW,
    boletas: PERMISSIONS.BOLETAS_VIEW,
    'crear boletas': PERMISSIONS.BOLETAS_CREATE,
    'editar boletas': PERMISSIONS.BOLETAS_EDIT,
    'eliminar boletas': PERMISSIONS.BOLETAS_DELETE,
    'finalizar boletas': PERMISSIONS.BOLETAS_FINALIZE,
    clientes: PERMISSIONS.CLIENTES_VIEW,
    'ver clientes': PERMISSIONS.CLIENTES_VIEW,
    'crear clientes': PERMISSIONS.CLIENTES_CREATE,
    'editar clientes': PERMISSIONS.CLIENTES_EDIT,
    administracion: PERMISSIONS.ADMIN_VIEW,
    administración: PERMISSIONS.ADMIN_VIEW,
    usuarios: PERMISSIONS.USERS_MANAGE,
    catalogos: PERMISSIONS.CATALOGS_MANAGE,
    catálogos: PERMISSIONS.CATALOGS_MANAGE,
    configuracion: PERMISSIONS.CONFIG_MANAGE,
    configuración: PERMISSIONS.CONFIG_MANAGE,
    mantenimientos: PERMISSIONS.MAINTENANCE_VIEW,
    'editar mantenimientos': PERMISSIONS.MAINTENANCE_EDIT,
  };

  return aliases[lower] || lower;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  const text = String(value || '').trim().toLowerCase();
  return ['true', '1', 'si', 'sí', 'yes', 'y', 'x'].includes(text);
}

function normalizeKey(key) {
  return String(key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
