export function RoleBadge({ role }) {
  const label = role || 'Sin rol';
  return <span className={`role-badge role-${label.toLowerCase()}`}>{label}</span>;
}
