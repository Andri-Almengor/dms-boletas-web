export default function CategoriesAdminPage() {
  return (
    <div className="page">
      <div className="page-title">
        <h1>Categorías</h1>
      </div>

      <div className="card form-card">
        <h2>Nueva categoría</h2>

        <label className="field">
          <span>Nombre</span>
          <input placeholder="M.correctivo, M.preventivo, Instalación..." />
        </label>

        <button type="button" className="btn btn-primary">
          Guardar categoría
        </button>
      </div>
    </div>
  );
}
