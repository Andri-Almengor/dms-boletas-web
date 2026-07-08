import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePasswordRequest } from '../../services/authService.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function ChangePasswordPage() {
  const { sessionToken, user, updateLocalUser, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setOk('');

    if (!currentPassword || !newPassword || !confirm) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirm) {
      setError('La confirmación no coincide.');
      return;
    }

    try {
      setLoading(true);
      const response = await changePasswordRequest(sessionToken, currentPassword, newPassword);
      if (!response.ok) throw new Error(response.error || response.message || 'No se pudo cambiar la contraseña.');

      updateLocalUser({ ...user, mustChangePassword: false, DebeCambiarPassword: false });
      setOk('Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/dashboard', { replace: true }), 700);
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Cambiar contraseña</h1>
        <p>Debes crear una contraseña personalizada para continuar.</p>

        {error ? <div className="alert error">{error}</div> : null}
        {ok ? <div className="alert success">{ok}</div> : null}

        <label className="field">
          <span>Contraseña actual</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>

        <label className="field">
          <span>Nueva contraseña</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>

        <label className="field">
          <span>Confirmar contraseña</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </form>
    </main>
  );
}
