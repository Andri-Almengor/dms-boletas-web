export default function ConfigAdminPage() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Configuración</h1>
      </div>

      <form className="card form-card wide">
        <h2>Correos y Chat</h2>

        <label className="field">
          <span>Correos CC por defecto</span>
          <textarea
            rows="3"
            defaultValue={'yehuda.karmona@solutionsdms.com, raul.mayorga@solutionsdms.com, alejandra.umana@solutionsdms.com'}
          />
        </label>

        <label className="field">
          <span>Correo de pruebas</span>
          <input defaultValue="andrick.almengor@solutionsdms.com" />
        </label>

        <label className="field">
          <span>Chat producción</span>
          <input placeholder="Webhook Google Chat producción" />
        </label>

        <label className="field">
          <span>Chat pruebas</span>
          <input placeholder="Webhook Google Chat pruebas" />
        </label>

        <label className="check-item">
          <input type="checkbox" />
          Activar modo pruebas
        </label>

        <button type="button" className="btn btn-primary">
          Guardar configuración
        </button>
      </form>
    </div>
  );
}
