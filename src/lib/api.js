const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function compileLatex({ latex, engine = 'pdflatex' }) {
  const res = await fetch(`${BASE}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latex, engine }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Server error ${res.status}`);
    err.details = data.details;
    err.log = data.log;
    err.engines = data.engines;
    throw err;
  }

  return data; // { pdf (base64), compileTime, warnings, pages }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ok: false };
    return { ok: true, ...(await res.json()) };
  } catch {
    return { ok: false };
  }
}
