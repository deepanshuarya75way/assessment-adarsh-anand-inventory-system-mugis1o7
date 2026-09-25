/**
 * Normalizes FastAPI error responses to a plain string.
 *
 * FastAPI returns two shapes for `detail`:
 *   - string  → manual HTTPException (e.g. "SKU already exists")
 *   - array   → Pydantic 422 validation errors [{type, loc, msg, input, ctx}]
 *
 * Both are safely converted to a human-readable string here.
 */
export function parseApiError(err, fallback = 'An error occurred') {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc?.slice(1).join(' → ') || '';
        const msg = d.msg || 'Invalid value';
        return field ? `${field}: ${msg}` : msg;
      })
      .join(' · ');
  }
  return fallback;
}
