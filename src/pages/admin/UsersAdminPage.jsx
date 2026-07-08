import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Save, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ALL_PERMISSIONS, emptyUser, fetchUsers, resetUserPassword, saveUser, toggleUserActive } from '../../services/adminService.js';

export default function UsersAdminPage() {
  const { user, sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyUser());
  const [message, setMessage] = useState(null);

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers(sessionToken),
    enabled: Boolean(sessionToken),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveUser(sessionToken, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setForm(emptyUser());
      setMessage({ type: 'success', text: 'Usuario guardado correctamente.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const resetMutation = useMutation({
    mutationFn: (userId) => resetUserPassword(sessionToken, userId),
    onSuccess: () => setMessage({ type: 'success', text: 'Contraseña reiniciada. El usuario deberá cambiarla al ingresar.' }),
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  const activeMutation = useMutation({
    mutationFn: ({ userId, active }) => toggleUserActive(sessionToken, userId, active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMessage({ type: 'success', text: 'Estado del usuario actualizado.' });
    },
    onError: (error) => setMessage({ type: 'error', text: error.message }),
  });

  function togglePermission(permission) {
    setForm((prev) => ({
      ...prev,
      Permisos: prev.Permisos.includes(permission)
        ? prev.Permisos.filter((x) => x !== permission)
        : [...prev.Permisos, permission],
    }));
  }

  function editUser(item) {
    setForm({
      ...emptyUser(),
      ...item,
      PasswordTemporal: '',
      Permisos: item.Permisos?.length ? item.Permisos : defaultPermissionsForRole(item.Rol),
    });
  }

  function setRole(role) {
    setForm({ ...form, Rol: role, Permisos: defaultPermissionsForRole(role) });
  }

  const users = usersQuery.data || [];

  return (
    <div className="page admin-workspace">
      <div className="page-title hero-title">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Usuarios</h1>
          <p>Tu rol actual es: <strong>{user?.role}</strong>. Crea usuarios, define roles y permisos granulares.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setForm(emptyUser())}><Plus size={18} /> Nuevo</button>
      </div>

      {message ? <div className={`alert ${message.type}`}>{message.text}</div> : null}

      <div className="grid-2 catalog-layout">
        <form className="card enterprise-card form-card wide" onSubmit={(e) => e.preventDefault()}>
          <h2>{form.UsuarioID ? 'Editar usuario' : 'Crear usuario'}</h2>

          <div className="form-grid">
            <Field label="Usuario ID" value={form.UsuarioID || 'Automático'} disabled />
            <Field label="Nombre" value={form.Nombre} onChange={(value) => setForm({ ...form, Nombre: value })} />
            <Field label="Usuario" value={form.Usuario} onChange={(value) => setForm({ ...form, Usuario: value })} />
            <Field label="Correo" type="email" value={form.Correo} onChange={(value) => setForm({ ...form, Correo: value })} />
            <label className="field">
              <span>Rol</span>
              <select value={form.Rol} onChange={(e) => setRole(e.target.value)}>
                <option>Administrador</option>
                <option>Técnico</option>
                <option>Supervisor</option>
              </select>
            </label>
            <Field label="Contraseña temporal" value={form.PasswordTemporal} onChange={(value) => setForm({ ...form, PasswordTemporal: value })} placeholder="Solo para nuevos o reinicio" />
          </div>

          <div className="check-grid permission-grid">
            {ALL_PERMISSIONS.map(([permission, label]) => (
              <label key={permission} className="check-item permission-item">
                <input type="checkbox" checked={form.Permisos.includes(permission)} onChange={() => togglePermission(permission)} />
                {label}
              </label>
            ))}
          </div>

          <div className="form-actions">
            <label className="check-item">
              <input type="checkbox" checked={form.DebeCambiarPassword} onChange={(e) => setForm({ ...form, DebeCambiarPassword: e.target.checked })} />
              Debe cambiar contraseña
            </label>
            <label className="check-item">
              <input type="checkbox" checked={form.Activo} onChange={(e) => setForm({ ...form, Activo: e.target.checked })} />
              Activo
            </label>
          </div>

          <button type="button" className="btn btn-primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={18} /> Guardar usuario
          </button>
        </form>

        <div className="card enterprise-card table-card">
          <h2>Usuarios registrados</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Activo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.UsuarioID || item.Correo}>
                    <td><strong>{item.Nombre}</strong><span className="muted block">{item.UsuarioID}</span></td>
                    <td>{item.Correo}</td>
                    <td><span className="role-badge">{item.Rol}</span></td>
                    <td>{item.Activo ? 'Sí' : 'No'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary compact-btn" type="button" onClick={() => editUser(item)}>Editar</button>
                        <button className="icon-button" type="button" onClick={() => resetMutation.mutate(item.UsuarioID)}><KeyRound size={16} /></button>
                        <button className="icon-button" type="button" onClick={() => activeMutation.mutate({ userId: item.UsuarioID, active: !item.Activo })}>
                          {item.Activo ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled = false, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} disabled={disabled} value={value || ''} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />
    </label>
  );
}

function defaultPermissionsForRole(role) {
  if (role === 'Administrador') return ALL_PERMISSIONS.map(([permission]) => permission);
  if (role === 'Supervisor') return ['boletas.view', 'boletas.edit', 'boletas.finalize', 'clientes.view', 'maintenance.view'];
  return ['boletas.view', 'boletas.create', 'boletas.edit', 'boletas.finalize', 'maintenance.view', 'maintenance.edit'];
}
