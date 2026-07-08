import { Link } from 'react-router-dom';
export default function NoPermissionPage() {
  return <div className="center-page"><h1>Sin permiso</h1><p>No tienes acceso a este módulo.</p><Link to="/dashboard">Volver al dashboard</Link></div>;
}
