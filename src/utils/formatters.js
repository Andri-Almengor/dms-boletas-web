export function formatDate(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleDateString('es-CR'); } catch (_) { return value; }
}

export function normalizeText(value) {
  return String(value || '').trim();
}
