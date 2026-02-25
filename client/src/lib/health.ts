const DEFAULT_BASE_URL = 'http://localhost:3001';

export async function fetchHealth(baseUrl = DEFAULT_BASE_URL) {
  const traceId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'health-check';

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, {
    headers: { 'x-trace-id': traceId },
  });

  if (!res.ok) throw new Error('Backend not healthy');
  return res.json();
}
