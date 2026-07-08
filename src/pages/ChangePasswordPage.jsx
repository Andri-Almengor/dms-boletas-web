import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import ErrorBox from '../components/ErrorBox.jsx';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña nueva debe tener mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide con la contraseña nueva.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Cambiar contraseña</h1>
        <p>Por seguridad debes crear una contraseña personalizada.</p>
        <ErrorBox message={error} />

        <label>Contraseña temporal actual</label>
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} autoComplete="current-password" />

        <label>Nueva contraseña</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />

        <label>Confirmar nueva contraseña</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />

        <button disabled={loading}>{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
      </form>
    </div>
  );
}
