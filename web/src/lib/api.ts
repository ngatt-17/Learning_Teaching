// Thin fetch client for the two backend services. Every request carries the Platform JWT;
// the AI service verifies the same token and asks the Platform for course access.

const PLATFORM_BASE = (import.meta.env.VITE_PLATFORM_API_URL as string | undefined) ?? '/api/platform';
const AI_BASE = (import.meta.env.VITE_AI_API_URL as string | undefined) ?? '/api/ai';

const TOKEN_KEY = 'cecs.token';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }

  get isDenied() {
    return this.status === 403;
  }
}

// Session storage: the token disappears with the browser tab, which suits shared lab machines.
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode): the session lasts until reload
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function describe(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors
    return detail
      .map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join('; ');
  }
  return `Request failed (${status})`;
}

async function request<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra mạng hoặc dịch vụ backend.');
  }

  if (response.status === 401 && token) onUnauthorized?.();
  if (!response.ok) {
    let detail: unknown = response.statusText;
    try {
      detail = (await response.json()).detail;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, describe(detail, response.status));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (body: unknown) => JSON.stringify(body);

function client(base: string) {
  return {
    get: <T>(path: string) => request<T>(base, path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(base, path, { method: 'POST', body: body instanceof FormData ? body : json(body ?? {}) }),
    put: <T>(path: string, body: unknown) => request<T>(base, path, { method: 'PUT', body: json(body) }),
    patch: <T>(path: string, body: unknown) => request<T>(base, path, { method: 'PATCH', body: json(body) }),
    del: <T = void>(path: string) => request<T>(base, path, { method: 'DELETE' }),
  };
}

export const platform = client(PLATFORM_BASE);
export const ai = client(AI_BASE);

// Authenticated file download (a plain <a href> cannot send the bearer token).
export async function openMaterialFile(courseId: string, materialId: string) {
  const token = getToken();
  const response = await fetch(`${PLATFORM_BASE}/courses/${courseId}/materials/${materialId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new ApiError(response.status, 'Không tải được file tài liệu');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
