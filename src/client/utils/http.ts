export async function http<T>(
    method: string,
    location: string,
    data?: Record<string, unknown>,
): Promise<T> {
    if (method === 'POST' || method === 'PUT') {
        return await fetchJson<T>(method, location, buildBody(data));
    } else {
        return await fetchJson(method, buildUrl(location, data));
    }
}

function buildBody(data?: Record<string, unknown>) {
    return data ? JSON.stringify(data) : undefined;
}

function buildUrl(location: string, data?: Record<string, unknown>) {
    if (!data) return location;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        params.set(key, value instanceof Date ? value.toISOString() : String(value));
    }
    return location + (params.size > 0 ? `?${params}` : '');
}

async function fetchJson<T>(method: string, location: string, body?: string): Promise<T> {
    const options =
        method === 'GET'
            ? undefined
            : {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body,
              };
    const response = await fetch(location, options);
    if (!response.ok)
        throw new Error(`Failed to ${method} data at ${location}: ${response.statusText}`);
    return (await response.json()) as T;
}
