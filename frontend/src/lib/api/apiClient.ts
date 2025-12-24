/**
 * Authenticated API Client
 * Provides a fetch wrapper that automatically includes JWT tokens
 */

import API_CONFIG from '../config/api.config';
import { tokenStorage } from '../auth/tokenStorage';
import { authService } from '../auth/authService';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  // Add Content-Type if not set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add Authorization header if authentication is required
  if (requiresAuth) {
    let accessToken = tokenStorage.getAccessToken();

    // Check if token is expired and refresh if needed
    if (accessToken && tokenStorage.isAccessTokenExpired()) {
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        accessToken = tokenStorage.getAccessToken();
      } else {
        // Refresh failed, redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/';
        throw new Error('Authentication failed');
      }
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    } else if (requiresAuth) {
      // No token and auth required, redirect to login
      window.location.href = '/';
      throw new Error('Authentication required');
    }
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && requiresAuth) {
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options);
      } else {
        // Refresh failed, redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/';
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // If no content or empty body, return empty object
    if (contentLength === '0' || (!contentType?.includes('application/json'))) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
