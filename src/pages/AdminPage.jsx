export default function AdminPage() {
  return (
    <div className="page">
      <div className="page-title">
        <h2>Administración</h2>
        <p>Base preparada para usuarios, roles, permisos, catálogos y configuración.</p>
      </div>
      <div className="admin-grid">
        <div className="panel"><h3>Usuarios</h3><p>Crear usuarios, asignar roles y forzar cambio de contraseña.</p></div>
        <div className="panel"><h3>Permisos</h3><p>Definir qué módulos puede ver cada técnico.</p></div>
        <div className="panel"><h3>Catálogos</h3><p>Categorías, dispositivos, fabricantes, modelos y preguntas.</p></div>
        <div className="panel"><h3>Configuración</h3><p>Correos por defecto, chat de boletas, chat de prueba y Drive.</p></div>
      </div>
    </div>
  );
}
