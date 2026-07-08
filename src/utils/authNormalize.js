export function normalizeUser(rawUser = {}) {
  const user = rawUser.user || rawUser.usuario || rawUser.data?.user || rawUser;

  const roleRaw =
    user.Rol ||
    user.rol ||
    user.role ||
    user.TipoUsuario ||
    user.tipoUsuario ||
    user.perfil ||
    '';

  const normalizedRole = normalizeRole(roleRaw);

  return {
    id: user.UsuarioID || user.UserID || user.ID || user.id || user.RowID || '',
    username: user.Usuario || user.Username || user.username || user.NombreUsuario || user.nombreUsuario || '',
    name: user.Nombre || user.name || user.NombreCompleto || user.username || user.Usuario || 'Usuario',
    email: user.Correo || user.Email || user.email || '',
    role: normalizedRole,
    rawRole: roleRaw,
    mustChangePassword: Boolean(
      user.DebeCambiarPassword === true ||
      user.DebeCambiarPassword === 'TRUE' ||
      user.MustChangePassword === true ||
      user.mustChangePassword === true
    ),
    permissions: normalizePermissions(user.Permisos || user.permissions || user.Modulos || user.modulos),
    raw: user,
  };
}

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();

  if (['admin', 'administrador', 'administrator'].includes(value)) return 'Administrador';
  if (['tecnico', 'técnico', 'technical', 'technician'].includes(value)) return 'Técnico';
  if (['supervisor'].includes(value)) return 'Supervisor';

  return role ? String(role).trim() : 'Sin rol';
}

export function isAdmin(user) {
  return normalizeRole(user?.role || user?.rawRole) === 'Administrador';
}

function normalizePermissions(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value.map(String);

  if (typeof value === 'string') {
    return value
      .split(/[,|;]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}
