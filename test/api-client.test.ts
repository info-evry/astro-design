/**
 * API Client Script Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApiClient, readBaseUrl, ApiError } from '../src/scripts/api-client';

const TOKEN_KEY = 'test_admin_token';
const originalFetch = globalThis.fetch;

function mockFetch(response: Response): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue(response);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  document.head.innerHTML = '';
  localStorage.clear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('readBaseUrl', () => {
  test('reads and strips a trailing slash from the meta tag', () => {
    const meta = document.createElement('meta');
    meta.name = 'base-url';
    meta.content = '/nuit-de-linfo/';
    document.head.appendChild(meta);
    expect(readBaseUrl()).toBe('/nuit-de-linfo');
  });

  test('returns an empty string when no meta tag is present', () => {
    expect(readBaseUrl()).toBe('');
  });
});

describe('createApiClient', () => {
  test('sends an Authorization header with the bearer token', async () => {
    const client = createApiClient({ baseUrl: '', tokenKey: TOKEN_KEY });
    client.setToken('abc123');

    const fetchMock = mockFetch(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await client.api('/members');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/members',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      })
    );
  });

  test('persists the token under the given localStorage key', () => {
    const client = createApiClient({ baseUrl: '', tokenKey: TOKEN_KEY });
    client.setToken('xyz');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('xyz');
    expect(client.getToken()).toBe('xyz');
    client.clearToken();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(client.getToken()).toBe('');
  });

  test('throws ApiError with status 401 on unauthorized', async () => {
    const client = createApiClient({ baseUrl: '', tokenKey: TOKEN_KEY });
    mockFetch(new Response(null, { status: 401 }));

    await expect(client.api('/secret')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Unauthorized',
    });
  });

  test('throws ApiError with the server message on other failures', async () => {
    const client = createApiClient({ baseUrl: '', tokenKey: TOKEN_KEY });
    const errorResponse = () =>
      new Response(JSON.stringify({ error: 'Nope' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

    mockFetch(errorResponse());
    await expect(client.api('/members')).rejects.toBeInstanceOf(ApiError);

    mockFetch(errorResponse());
    await expect(client.api('/members')).rejects.toMatchObject({ status: 400, message: 'Nope' });
  });

  test('returns the raw Response for text/csv payloads', async () => {
    const client = createApiClient({ baseUrl: '', tokenKey: TOKEN_KEY });
    const csvResponse = new Response('a,b,c', {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
    });
    mockFetch(csvResponse);

    const result = await client.api('/export');
    expect(result).toBe(csvResponse);
  });
});
