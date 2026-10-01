/**
 * Public Client Script Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPublicClient, MSG_NETWORK_ERROR, MSG_SERVICE_UNAVAILABLE } from '../src/scripts/public-client';
import { ApiError } from '../src/scripts/api-client';

const originalFetch = globalThis.fetch;

function mockFetch(response: Response | Error): ReturnType<typeof vi.fn> {
  const fn = response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected a rejection');
}

beforeEach(() => {
  document.head.innerHTML = '';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('createPublicClient', () => {
  test('post sends a JSON body to ${baseUrl}/api and parses the JSON response', async () => {
    const fetchMock = mockFetch(json({ ok: true, id: 7 }));
    const client = createPublicClient({ baseUrl: '/adhesion/' });

    const result = await client.post('/apply', { name: 'Ada' });

    expect(result).toEqual({ ok: true, id: 7 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/adhesion/api/apply');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"Ada"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  test('post without a body sends none; get issues a GET', async () => {
    const fetchMock = mockFetch(json({ teams: [] }));
    const client = createPublicClient({ baseUrl: '' });

    await client.post('/ping');
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();

    fetchMock.mockResolvedValue(json({ teams: [] }));
    expect(await client.get('/teams')).toEqual({ teams: [] });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/teams');
    expect(fetchMock.mock.calls[1][1].method).toBe('GET');
  });

  test('defaults the base URL to the base-url meta tag', async () => {
    const meta = document.createElement('meta');
    meta.name = 'base-url';
    meta.content = '/nuit-de-linfo/';
    document.head.appendChild(meta);
    const fetchMock = mockFetch(json({}));

    await createPublicClient().get('/config');

    expect(fetchMock.mock.calls[0][0]).toBe('/nuit-de-linfo/api/config');
  });

  test('JSON error: message from `error`, code from `code`, status kept', async () => {
    mockFetch(json({ error: 'Équipe complète', code: 'TEAM_FULL' }, 409));

    const error = await rejection(createPublicClient({ baseUrl: '' }).post('/register', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Équipe complète');
    expect(error.status).toBe(409);
    expect(error.code).toBe('TEAM_FULL');
  });

  test('JSON error without an error field gets a generic message', async () => {
    mockFetch(json({ foo: 1 }, 400));
    const error = await rejection(createPublicClient({ baseUrl: '' }).get('/x'));
    expect(error.message).toBe('Une erreur est survenue');
    expect(error.code).toBeUndefined();
  });

  test('non-object JSON error body is tolerated', async () => {
    mockFetch(json('boom', 500));
    const error = await rejection(createPublicClient({ baseUrl: '' }).get('/x'));
    expect(error.status).toBe(500);
    expect(error.message).toBe('Une erreur est survenue');
  });

  test('non-JSON 502 gives the French fallback, never a SyntaxError', async () => {
    mockFetch(new Response('<html><body>Bad Gateway</body></html>', { status: 502 }));

    const error = await rejection(createPublicClient({ baseUrl: '' }).post('/register', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(SyntaxError);
    expect(error.message).toBe('Service momentanément indisponible');
    expect(error.message).toBe(MSG_SERVICE_UNAVAILABLE);
    expect(error.status).toBe(502);
  });

  test('network failure becomes an ApiError with status 0', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    const error = await rejection(createPublicClient({ baseUrl: '' }).get('/x'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe('network_error');
    expect(error.message).toBe(MSG_NETWORK_ERROR);
  });

  test('a body that fails mid-read is a network error', async () => {
    const broken = { ok: true, status: 200, text: () => Promise.reject(new Error('reset')) };
    globalThis.fetch = vi.fn().mockResolvedValue(broken) as unknown as typeof fetch;
    const error = await rejection(createPublicClient({ baseUrl: '' }).get('/x'));
    expect(error.code).toBe('network_error');
    expect(error.status).toBe(200);
  });

  test('ok response with an empty body resolves null', async () => {
    mockFetch(new Response(null, { status: 204 }));
    expect(await createPublicClient({ baseUrl: '' }).post('/x', {})).toBeNull();
  });

  test('ok response with a non-JSON body is an invalid_response error', async () => {
    mockFetch(new Response('<html>captive portal</html>', { status: 200 }));
    const error = await rejection(createPublicClient({ baseUrl: '' }).get('/x'));
    expect(error.code).toBe('invalid_response');
    expect(error.message).toBe(MSG_SERVICE_UNAVAILABLE);
  });
});
