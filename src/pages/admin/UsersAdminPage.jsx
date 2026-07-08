import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';

const modules = ['boletas', 'mantenimientos', 'clientes', 'catalogos', 'admin'];

export default function UsersAdminPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    usuario: '',
    correo: '',
    rol: 'Técnico',
    permisos: ['boletas'],
  });

  function togglePermission(module) {
    setForm((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(module)
        ? prev.permisos.filter((x) => x !== module)
        : [...prev.permisos, module],
    }));
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Usuarios</h1>
        <p>Tu rol actual es: <strong>{user?.role}</strong></p>
      </div>

      <div className="grid-2">
        <form className="card form-card">
          <h2>Crear usuario</h2>

          <label className="field">
            <span>Nombre</span>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </label>

          <label className="field">
            <span>Usuario</span>
            <input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} />
          </label>

          <label className="field">
            <span>Correo</span>
            <input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </label>

          <label className="field">
            <span>Rol</span>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option>Administrador</option>
              <option>Técnico</option>
              <option>Supervisor</option>
            </select>
          </label>

          <div className="field">
            <span>Permisos por módulo</span>
            <div className="check-grid">
              {modules.map((module) => (
                <label key={module} className="check-item">
                  <input
                    type="checkbox"
                    checked={form.permisos.includes(module)}
                    onChange={() => togglePermission(module)}
                  />
                  {module}
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="btn btn-primary">
            Guardar usuario
          </button>
        </form>

        <div className="card">
          <h2>Usuarios registrados</h2>
          <p>
            En la siguiente iteración conectamos esta tabla con el backend para listar,
            crear, editar, bloquear y reiniciar contraseñas.
          </p>
        </div>
      </div>
    </div>
  );
}
