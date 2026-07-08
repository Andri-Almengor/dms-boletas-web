export default function StatCard({ title, value, hint }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
