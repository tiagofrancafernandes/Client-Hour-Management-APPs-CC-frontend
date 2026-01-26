const API_URL = import.meta.env.VITE_API_URL || 'http://api.local.tiagoapps.com.br';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...headers,
        },
        credentials: 'include',
    };

    if (token) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));

        throw new Error(error.message || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint),

    post: <T>(endpoint: string, data: unknown) =>
        request<T>(endpoint, { method: 'POST', body: data }),

    put: <T>(endpoint: string, data: unknown) =>
        request<T>(endpoint, { method: 'PUT', body: data }),

    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export default api;
