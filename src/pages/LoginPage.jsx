import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

export default function LoginPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await login(username.trim(), password);
      if (res.mustChangePassword || res.user?.DebeCambiarPassword) {
        navigate('/cambiar-clave');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon"><LockKeyhole size={30} /></div>
        <h1>DMS Boletas</h1>
        <p>Ingresa con tu usuario y contraseña.</p>
        <ErrorBox message={error} />
        <label>Usuario</label>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Ej: andrick" autoComplete="username" required />
        <label>Contraseña</label>
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" autoComplete="current-password" required />
        <button disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
    </div>
  );
}
