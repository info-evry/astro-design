/**
 * Public API client - Info Evry Design System
 * A fetch wrapper for unauthenticated forms (registration, membership apply).
 *
 * Unlike a bare `response.json()`, it never leaks a `SyntaxError` when the
 * server (or a proxy) answers with HTML such as a 502 page: every failure is
 * an `ApiError` carrying `status`, an optional server `code`, and a French
 * `message` suitable for display.
 */

import { ApiError, readBaseUrl } from './api-client';

export interface CreatePublicClientOptions {
  /** Base URL prefixed to every endpoint (defaults to `readBaseUrl()`). */
  baseUrl?: string;
}

export interface PublicClient {
  /** `GET ${baseUrl}/api${endpoint}` -> parsed JSON. */
  get<T = unknown>(endpoint: string): Promise<T>;
  /** `POST ${baseUrl}/api${endpoint}` with a JSON body -> parsed JSON. */
  post<T = unknown>(endpoint: string, body?: unknown): Promise<T>;
}

export const MSG_SERVICE_UNAVAILABLE = 'Service momentanément indisponible';
export const MSG_NETWORK_ERROR = 'Impossible de contacter le serveur';
const MSG_GENERIC_ERROR = 'Une erreur est survenue';

type JsonObject = Record<string, unknown>;

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null ? (value as JsonObject) : undefined;
}

function stringField(object: JsonObject | undefined, key: string): string | undefined {
  const value = object?.[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Create a public client.
 * - Network failure: `ApiError(MSG_NETWORK_ERROR, 0, 'network_error')`.
 * - Non-ok JSON: `ApiError(data.error, status, data.code)`.
 * - Non-ok non-JSON (e.g. 502 HTML): `ApiError(MSG_SERVICE_UNAVAILABLE, status)`.
 * - Ok but non-JSON, non-empty body: `ApiError(MSG_SERVICE_UNAVAILABLE, status, 'invalid_response')`.
 * - Ok with an empty body (e.g. 204): resolves `null`.
 */
export function createPublicClient(options: CreatePublicClientOptions = {}): PublicClient {
  let base = options.baseUrl ?? readBaseUrl();
  while (base.endsWith('/')) base = base.slice(0, -1);

  async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${base}/api${endpoint}`, init);
    } catch {
      throw new ApiError(MSG_NETWORK_ERROR, 0, 'network_error');
    }

    let text = '';
    try {
      text = await response.text();
    } catch {
      throw new ApiError(MSG_NETWORK_ERROR, response.status, 'network_error');
    }
    const parsed = parseJson(text);
    const data = parsed.ok ? asObject(parsed.value) : undefined;

    if (!response.ok) {
      const message =
        stringField(data, 'error') ?? (parsed.ok ? MSG_GENERIC_ERROR : MSG_SERVICE_UNAVAILABLE);
      throw new ApiError(message, response.status, stringField(data, 'code'));
    }

    if (parsed.ok) return parsed.value as T;
    if (text.trim() === '') return null as T;
    throw new ApiError(MSG_SERVICE_UNAVAILABLE, response.status, 'invalid_response');
  }

  return {
    get: <T = unknown>(endpoint: string) =>
      request<T>(endpoint, { method: 'GET', headers: { Accept: 'application/json' } }),
    post: <T = unknown>(endpoint: string, body?: unknown) =>
      request<T>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
}
