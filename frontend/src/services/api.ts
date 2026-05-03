/**
 * Base API layer — wraps fetch calls to the backend REST API.
 * Automatically injects the Supabase JWT token from localStorage.
 */

// Use relative URL to leverage Vite Proxy during development and bypass CORS
const BASE_URL = '/api';

function getToken(): string | null {
    try {
        // Uniformise sur la clé 'auth-token' (format standard)
        const token = localStorage.getItem('auth-token');
        if (token) return token;

        // Fallback progressif si l'ancienne clé existe encore
        return localStorage.getItem('auth_token');
    } catch {
        return null;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const isPublicRoute = path === '/auth/login' || path === '/auth/register';
    if (token && !isPublicRoute) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${BASE_URL}${path}`;
    const reqMethod = options.method || 'GET';
    console.log(`🌐 [API] Request: ${reqMethod} ${fullUrl}`);
    
    try {
        const res = await fetch(fullUrl, { ...options, headers });
        console.log(`✅ [API] Response Received: ${res.status}`);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const message = errorData.error || errorData.message || res.statusText || `Request failed: ${res.status}`;
            
            if (res.status === 401) {
                console.warn('🔐 [API] Unauthorized access detected. Clearing session.');
                localStorage.removeItem('auth-token');
                localStorage.removeItem('auth_token'); // Clear legacy key too
                localStorage.removeItem('auth_user');
                // Optional: window.location.href = '/login'; 
            }

            throw new Error(message);
        }

        const data = await res.json();
        return data as T;
    } catch (err: any) {
        console.error(`❌ [API] Error:`, err.message);
        throw err;
    }
}

export const api = {
    get: <T>(path: string, params?: Record<string, any>) => {
        let fullPath = path;
        if (params) {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query.append(key, String(value));
                }
            });
            const queryString = query.toString();
            if (queryString) {
                fullPath += (fullPath.includes('?') ? '&' : '?') + queryString;
            }
        }
        return request<T>(fullPath, { method: 'GET' });
    },
    post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
