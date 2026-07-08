import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <h1>Página no encontrada</h1>
        <p>La ruta solicitada no existe.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Volver al dashboard
        </Link>
      </div>
    </main>
  );
}
