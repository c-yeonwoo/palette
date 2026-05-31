/**
 * Admin 전용 API 클라이언트. 사용자 apiClient 와 분리 (토큰 storage 다름, 401 흐름 다름).
 */
import API_CONFIG from "../../lib/config/api.config";
import { adminAuth } from "./adminAuth";

interface AdminApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function adminRequest<T>(endpoint: string, options: AdminApiOptions = {}): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = adminAuth.getAccessToken();
    if (!token) {
      window.location.href = "/admin/login";
      throw new Error("Admin authentication required");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...fetchOptions, headers });

  if (response.status === 401 && requiresAuth) {
    adminAuth.clear();
    window.location.href = "/admin/login";
    throw new Error("Admin session expired");
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) return {} as T;
  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) return {} as T;
  return await response.json();
}

export const adminApi = {
  get: <T>(endpoint: string) => adminRequest<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data?: unknown, opts: AdminApiOptions = {}) =>
    adminRequest<T>(endpoint, {
      ...opts,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    adminRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => adminRequest<T>(endpoint, { method: "DELETE" }),
};
