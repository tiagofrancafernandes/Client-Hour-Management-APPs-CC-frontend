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

async function downloadFile(endpoint: string, filename: string|null = null): Promise<void> {
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
        method: 'GET',
        headers: {
            Accept: 'application/octet-stream',
        },
        credentials: 'include',
    };

    if (token) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Download failed' }));

        throw new Error(error.message || `HTTP error ${response.status}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');

    console.log('api.ts downloadFile', {
        filename,
        response,
        contentDisposition,
        responseHeaders: response.headers,
    });

    if (!filename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);

        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
        }
    }

    filename = filename || response.headers.get('X-Filename');

    if (!filename) {
        filename = filename || `download_${Date.now()}`;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint),

    post: <T>(endpoint: string, data: unknown) => request<T>(endpoint, { method: 'POST', body: data }),

    put: <T>(endpoint: string, data: unknown) => request<T>(endpoint, { method: 'PUT', body: data }),

    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

    download: (endpoint: string, filename: string|null = null) => downloadFile(endpoint, filename),
};

export default api;
