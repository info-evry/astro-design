/**
 * Admin API client - Info Evry Design System
 * A small fetch wrapper shared by the admin dashboards: bearer-token auth,
 * JSON/CSV response handling, and a typed 401 error.
 */

/** Thrown when a request fails; carries the HTTP status when available. */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Read the site's base URL from `<meta name="base-url">` (emitted by
 * Head.astro), stripping any trailing slash so it can be prefixed
 * directly onto `/api/...` endpoints.
 */
export function readBaseUrl(): string {
  const content = document
    .querySelector('meta[name="base-url"]')
    ?.getAttribute('content');
  let base = content ?? '';
  while (base.endsWith('/')) base = base.slice(0, -1);
  return base;
}

export interface CreateApiClientOptions {
  /** Base URL prefixed to every endpoint (defaults to `readBaseUrl()`). */
  baseUrl?: string;
  /** localStorage key used to persist the bearer token. */
  tokenKey: string;
}

export interface ApiClient {
  /**
   * Perform an authenticated request against `${baseUrl}/api${endpoint}`.
   * Returns parsed JSON, or the raw `Response` for `text/csv` payloads.
   * Throws `ApiError('Unauthorized', 401)` on a 401 response, or
   * `ApiError(data.error || 'Request failed', status)` on any other
   * non-ok response.
   */
  api<T = unknown>(endpoint: string, options?: RequestInit): Promise<T | Response>;
  /** Persist a new bearer token. */
  setToken(token: string): void;
  /** Read the current bearer token. */
  getToken(): string;
  /** Remove the persisted bearer token. */
  clearToken(): void;
}

/**
 * Create an API client bound to a base URL and a localStorage token key.
 */
export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const { tokenKey } = options;
  const baseUrl = options.baseUrl ?? readBaseUrl();

  let token = (typeof localStorage !== 'undefined' && localStorage.getItem(tokenKey)) || '';

  function setToken(newToken: string): void {
    token = newToken;
    localStorage.setItem(tokenKey, newToken);
  }

  function getToken(): string {
    return token;
  }

  function clearToken(): void {
    token = '';
    localStorage.removeItem(tokenKey);
  }

  async function api<T = unknown>(endpoint: string, requestOptions: RequestInit = {}): Promise<T | Response> {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      ...requestOptions,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      },
    });

    if (response.status === 401) {
      throw new ApiError('Unauthorized', 401);
    }

    if (response.headers.get('Content-Type')?.includes('text/csv')) {
      return response;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(data.error || 'Request failed', response.status);
    }

    return (await response.json()) as T;
  }

  return { api, setToken, getToken, clearToken };
}
