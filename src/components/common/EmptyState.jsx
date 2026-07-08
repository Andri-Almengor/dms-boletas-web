export function EmptyState({ title = 'Sin datos', text = 'No hay información para mostrar.' }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
