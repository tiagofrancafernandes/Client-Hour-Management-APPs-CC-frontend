const API_URL = import.meta.env.VITE_API_URL || 'http://api.local.tiagoapps.com.br';

interface RequestOptions {
    method?: string;
    body?: unknown;
    params?: unknown;
    headers?: Record<string, string>;
}

async function request<T>(
    endpoint: string,
    options: RequestOptions | any = {},
    returnResponse: boolean | null = null
): Promise<T> {
    options = {
        body: options?.params?.body || options?.params || {},
        params: options?.params || options?.params?.body || {},
        ...(options || {}),
    };

    let { method = 'GET', body, params, headers = {} } = options;

    let bodyIsFormData = (body || {})?.constructor?.name === 'FormData';

    console.log('options', options, 'bodyIsFormData', bodyIsFormData);

    let responseType: any =
        (options || {})['responseType'] || (body || {})['responseType'] || (params || {})['responseType'] || null;

    if (returnResponse === null) {
        returnResponse =
            (options || {})['returnResponse'] ||
            (body || {})['returnResponse'] ||
            (params || {})['returnResponse'] ||
            false;
    }

    if (typeof options?.returnResponse !== 'undefined') {
        delete options.returnResponse;
    }

    if (typeof params?.returnResponse !== 'undefined') {
        delete params.returnResponse;
    }

    if (typeof body?.returnResponse !== 'undefined') {
        delete body.returnResponse;
    }

    if (typeof options?.responseType !== 'undefined') {
        delete options.responseType;
    }

    const token = localStorage.getItem('auth_token');
    let isGet = Boolean(!method || ['GET', 'get'].includes(method));

    headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
    };

    if (bodyIsFormData) {
        // headers['Content-Type'] = 'multipart/form-data'; // (Isso quebra o request porque o boundary não é enviado.)

        let _headersToDelete = ['Content-Type', 'content-type'];

        for (const _header of _headersToDelete) {
            if (typeof headers[_header] !== 'undefined') {
                delete headers[_header];
            }
        }
        isGet = isGet ? false : isGet;
    }

    const config: RequestInit | any = {
        method: bodyIsFormData ? (method === 'GET' ? 'POST' : method) : method,
        headers,
        credentials: 'include',
    };

    if (token) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (!isGet) {
        config.body = body || params;
        config.body = bodyIsFormData ? body : JSON.stringify(config.body);
    }

    let response: Response | any;

    if (isGet) {
        config.method = 'GET';

        let _data: any = { ...params, ...(body || {}) };
        let _url = new URL(`${API_URL}/api${endpoint}`);
        Object.keys(_data || {})
            .filter((key: any) => typeof _data[key] !== 'object')
            .forEach((key) => _url.searchParams.append(key, _data[key]));

        if (typeof config?.params !== 'undefined') {
            delete config.params;
        }

        if (typeof config?.body !== 'undefined') {
            delete config.body;
        }

        response = await fetch(_url, config);
    }

    if (!isGet) {
        console.log('config', config);
        response = await fetch(`${API_URL}/api${endpoint}`, config);
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));

        throw new Error(error.message || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    if (returnResponse) {
        return response;
    }

    if (responseType === 'blob') {
        return response.blob();
    }

    if ((response.headers.get('Content-Type') || '').includes('application/json')) {
        return response.json();
    }

    return response.text();
}

async function downloadFile(endpoint: string, filename: string | null = null): Promise<void> {
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

    // const response = await fetch(`${API_URL}/api${endpoint}`, config);
    const response: any = await request(endpoint, config, /* returnResponse */ true);

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
    get: <T>(endpoint: string, options: object = {}, returnResponse: boolean | null = null) =>
        request<T>(endpoint, { method: 'GET', ...(options || {}), params: options }, returnResponse),

    post: <T>(endpoint: string, data: unknown = {}, options: object = {}, returnResponse: boolean | null = null) =>
        request<T>(endpoint, { method: 'POST', ...(options || {}), body: data }, returnResponse),

    put: <T>(endpoint: string, data: unknown = {}, options: object = {}, returnResponse: boolean | null = null) =>
        request<T>(endpoint, { method: 'PUT', ...(options || {}), body: data }, returnResponse),

    delete: <T>(endpoint: string, options: object = {}, returnResponse: boolean | null = null) =>
        request<T>(endpoint, { method: 'DELETE', ...(options || {}) }, returnResponse),

    download: (endpoint: string, filename: string | null = null) => downloadFile(endpoint, filename),
};

export default api;
