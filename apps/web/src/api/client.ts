const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function postSnapshot(body: { targetDatabaseUrl: string; schemas: string[] }) {
  return request<{ snapshot: any }>('/api/v1/introspect/postgres/snapshot', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getAnnotations(instanceId: string) {
  return request<any>(`/api/v1/checklist-instances/${instanceId}/annotations`);
}
