const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';
async function request(path, init) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
        ...init,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json());
}
export async function postSnapshot(body) {
    return request('/api/v1/introspect/postgres/snapshot', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function getAnnotations(instanceId) {
    return request(`/api/v1/checklist-instances/${instanceId}/annotations`);
}
