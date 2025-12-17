/**
 * API Client Configuration
 * 
 * This module provides a centralized API client with:
 * - Base URL configuration from environment
 * - Request/response interceptors for auth
 * - Token management (access, refresh)
 * - Automatic token refresh on 401
 * - Error handling
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Token storage keys
const ACCESS_TOKEN_KEY = 'argus_access_token';
const REFRESH_TOKEN_KEY = 'argus_refresh_token';

// Types
export interface ApiError {
  detail: string;
  errors?: Array<{ loc: string[]; msg: string; type: string }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  user_type: 'buyer' | 'supplier';
  is_active: boolean;
}

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (tokens: TokenPair): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens: (): boolean => {
    return !!tokenManager.getAccessToken();
  },
};

// Request options type
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeout?: number;
  skipAuth?: boolean;
}

// Refresh token promise to prevent multiple refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    tokenManager.clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.access) {
      tokenManager.setAccessToken(data.access);
      return data.access;
    }

    tokenManager.clearTokens();
    return null;
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(): Promise<string | null> {
  const token = tokenManager.getAccessToken();
  if (token) {
    return token;
  }

  // If no token, try to refresh
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Make an API request with automatic auth handling
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    body,
    timeout = API_TIMEOUT,
    skipAuth = false,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  // Build headers
  const headers: HeadersInit = {
    ...(customHeaders as Record<string, string>),
  };

  // Add Content-Type for JSON bodies
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if not skipping auth
  if (!skipAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request options
  const fetchOptions: RequestInit = {
    ...restOptions,
    headers,
  };

  // Add body
  if (body) {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  fetchOptions.signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    let response = await fetch(url, fetchOptions);

    // Handle 401 - try to refresh token and retry
    if (response.status === 401 && !skipAuth) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    }

    // Parse response
    let data: T | undefined;
    let error: ApiError | undefined;

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      if (response.ok) {
        data = json as T;
      } else {
        error = json as ApiError;
      }
    } else if (!response.ok) {
      error = { detail: response.statusText || 'Request failed' };
    }

    return { data, error, status: response.status };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        error: { detail: 'Request timeout' },
        status: 408,
      };
    }
    return {
      error: { detail: err instanceof Error ? err.message : 'Network error' },
      status: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// HTTP method helpers
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Upload FormData (for file uploads)
   * Content-Type will be set automatically by the browser
   */
  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
};

export default apiClient;
