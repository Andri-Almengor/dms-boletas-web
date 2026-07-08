export default function ClientsAdminPage() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Administrar clientes</h1>
      </div>

      <div className="grid-2">
        <form className="card form-card">
          <h2>Cliente</h2>

          <label className="field">
            <span>Nombre del cliente</span>
            <input placeholder="Ej. Asamblea Legislativa" />
          </label>

          <label className="field">
            <span>Link Chat Google</span>
            <input placeholder="Webhook o link del chat del cliente" />
          </label>

          <label className="field">
            <span>Notas</span>
            <textarea placeholder="Ej. Requiere curso de contratista..." rows="5" />
          </label>

          <button type="button" className="btn btn-primary">
            Guardar cliente
          </button>
        </form>

        <div className="card">
          <h2>Contactos, ubicaciones y supervisores</h2>
          <p>
            Esta pantalla se conectará a las tablas actuales sin cambiar tu base de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
