/**
 * Admin Shell Script Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAdminShell } from '../src/scripts/admin-shell';
import { ApiError, type ApiClient } from '../src/scripts/api-client';

const selectors = {
  authSection: '#auth-section',
  adminContent: '#admin-content',
  tokenInput: '#admin-token',
  authBtn: '#auth-btn',
  authError: '#auth-error',
};

function fakeApi(initial = ''): ApiClient & { store: { token: string } } {
  const store = { token: initial };
  return {
    store,
    api: vi.fn() as unknown as ApiClient['api'],
    getToken: () => store.token,
    setToken: (t: string) => { store.token = t; },
    clearToken: () => { store.token = ''; },
  };
}

const el = (id: string) => document.getElementById(id) as HTMLElement;
const hidden = (id: string) => el(id).classList.contains('hidden');
const input = () => el('admin-token') as HTMLInputElement;
const toastText = () => document.querySelector('.toast')?.textContent;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  document.body.innerHTML = `
    <section id="auth-section" class="hidden">
      <input id="admin-token"><button id="auth-btn">Go</button><p id="auth-error" class="hidden"></p>
    </section>
    <main id="admin-content" class="hidden"></main>`;
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe('createAdminShell', () => {
  test('requires api or tokenKey', () => {
    expect(() => createAdminShell({ selectors, load: vi.fn() })).toThrow(TypeError);
  });

  test('creates its own client from tokenKey', async () => {
    localStorage.setItem('shell_test_token', 'stored');
    const load = vi.fn().mockResolvedValue();
    const shell = createAdminShell({ tokenKey: 'shell_test_token', selectors, load });
    expect(shell.getToken()).toBe('stored');
    await shell.init();
    expect(load).toHaveBeenCalledTimes(1);
    shell.logout();
    expect(localStorage.getItem('shell_test_token')).toBeNull();
  });
});

describe('auto-login with a stored token', () => {
  test('shows the dashboard and runs afterLogin once', async () => {
    const api = fakeApi('tok');
    const load = vi.fn().mockResolvedValue();
    const afterLogin = vi.fn();
    const shell = createAdminShell({ api, selectors, load, afterLogin });

    await shell.init();

    expect(load).toHaveBeenCalledTimes(1);
    expect(afterLogin).toHaveBeenCalledTimes(1);
    expect(hidden('auth-section')).toBe(true);
    expect(hidden('admin-content')).toBe(false);
    expect(api.store.token).toBe('tok');
  });

  test('401 clears the token and shows the login screen', async () => {
    const api = fakeApi('stale');
    const afterLogin = vi.fn();
    const shell = createAdminShell({
      api, selectors, afterLogin,
      load: () => Promise.reject(new ApiError('Unauthorized', 401)),
    });

    await shell.init();

    expect(api.store.token).toBe('');
    expect(hidden('auth-section')).toBe(false);
    expect(hidden('admin-content')).toBe(true);
    expect(hidden('auth-error')).toBe(true);
    expect(afterLogin).not.toHaveBeenCalled();
  });

  test('network error keeps the token and shows a retry message', async () => {
    const api = fakeApi('keep');
    const shell = createAdminShell({
      api, selectors,
      load: () => Promise.reject(new TypeError('Failed to fetch')),
    });

    await shell.init();

    expect(api.store.token).toBe('keep');
    expect(hidden('auth-section')).toBe(false);
    expect(hidden('auth-error')).toBe(false);
    expect(el('auth-error').textContent).toContain('Réessayez');
  });

  test('5xx keeps the token', async () => {
    const api = fakeApi('keep');
    const shell = createAdminShell({
      api, selectors,
      load: () => Promise.reject(new ApiError('Request failed', 503)),
    });
    await shell.init();
    expect(api.store.token).toBe('keep');
    expect(hidden('auth-error')).toBe(false);
  });

  test('retry after a network error works with the kept token and an empty input', async () => {
    const api = fakeApi('keep');
    const load = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce();
    const afterLogin = vi.fn();
    const shell = createAdminShell({ api, selectors, load, afterLogin });

    await shell.init();
    el('auth-btn').click();
    await flush();

    expect(load).toHaveBeenCalledTimes(2);
    expect(hidden('admin-content')).toBe(false);
    expect(hidden('auth-error')).toBe(true);
    expect(afterLogin).toHaveBeenCalledTimes(1);
  });

  test('shows the login screen when there is no token', async () => {
    const load = vi.fn();
    const shell = createAdminShell({ api: fakeApi(), selectors, load });
    await shell.init();
    expect(load).not.toHaveBeenCalled();
    expect(hidden('auth-section')).toBe(false);
  });

  test('init is idempotent: listeners and auto-login happen once', async () => {
    const api = fakeApi('tok');
    const load = vi.fn().mockResolvedValue();
    const shell = createAdminShell({ api, selectors, load });
    const first = shell.init();
    expect(shell.init()).toBe(first);
    await first;
    load.mockClear();

    input().value = 'x';
    el('auth-btn').click();
    await flush();
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('interactive login', () => {
  test('button click logs in with the trimmed token', async () => {
    const api = fakeApi();
    const load = vi.fn().mockResolvedValue();
    const afterLogin = vi.fn();
    const shell = createAdminShell({ api, selectors, load, afterLogin });
    await shell.init();

    input().value = '  secret  ';
    el('auth-btn').click();
    await flush();

    expect(api.store.token).toBe('secret');
    expect(shell.getToken()).toBe('secret');
    expect(hidden('admin-content')).toBe(false);
    expect(afterLogin).toHaveBeenCalledTimes(1);
  });

  test('Enter in the input logs in; other keys do not', async () => {
    const api = fakeApi();
    const load = vi.fn().mockResolvedValue();
    const shell = createAdminShell({ api, selectors, load });
    await shell.init();

    input().value = 'abc';
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    await flush();
    expect(load).not.toHaveBeenCalled();

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await flush();
    expect(load).toHaveBeenCalledTimes(1);
    expect(hidden('admin-content')).toBe(false);
  });

  test('empty token shows an error without loading', async () => {
    const load = vi.fn();
    const shell = createAdminShell({ api: fakeApi(), selectors, load });
    await shell.init();
    expect(await shell.login()).toBe(false);
    expect(load).not.toHaveBeenCalled();
    expect(el('auth-error').textContent).toBe('Veuillez entrer un token');
    expect(hidden('auth-error')).toBe(false);
  });

  test('401 shows "Token invalide" and clears the token', async () => {
    const api = fakeApi();
    const shell = createAdminShell({
      api, selectors,
      load: () => Promise.reject(new ApiError('Unauthorized', 401)),
    });
    await shell.init();
    input().value = 'bad';

    expect(await shell.login()).toBe(false);

    expect(el('auth-error').textContent).toBe('Token invalide');
    expect(api.store.token).toBe('');
    expect(hidden('admin-content')).toBe(true);
  });

  test('a 4xx error shows the server message; 5xx a generic one, token kept', async () => {
    const api = fakeApi();
    const load = vi.fn()
      .mockRejectedValueOnce(new ApiError('Trop de tentatives', 429))
      .mockRejectedValueOnce(new ApiError('Request failed', 500));
    const shell = createAdminShell({ api, selectors, load });
    input().value = 'tok';

    await shell.login();
    expect(el('auth-error').textContent).toBe('Trop de tentatives');

    await shell.login();
    expect(el('auth-error').textContent).toContain('indisponible');
    expect(api.store.token).toBe('tok');
  });

  test('a successful login hides a previous error', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new ApiError('Unauthorized', 401))
      .mockResolvedValueOnce();
    const shell = createAdminShell({ api: fakeApi(), selectors, load });
    input().value = 'x';
    await shell.login();
    expect(hidden('auth-error')).toBe(false);
    input().value = 'y';
    expect(await shell.login()).toBe(true);
    expect(hidden('auth-error')).toBe(true);
  });

  test('concurrent logins share one in-flight request', async () => {
    let release!: () => void;
    const load = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    const shell = createAdminShell({ api: fakeApi(), selectors, load });
    input().value = 'x';

    const a = shell.login();
    const b = shell.login();
    expect(b).toBe(a);
    release();
    expect(await a).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test('afterLogin runs exactly once across auto-login, login and re-login', async () => {
    const api = fakeApi('tok');
    const afterLogin = vi.fn();
    const shell = createAdminShell({ api, selectors, load: vi.fn().mockResolvedValue(), afterLogin });
    await shell.init();
    shell.logout();
    input().value = 'again';
    await shell.login();
    await shell.login();
    expect(afterLogin).toHaveBeenCalledTimes(1);
  });

  test('a failing afterLogin is contained: dashboard stays, toast shown', async () => {
    const afterLogin = vi.fn().mockRejectedValue(new Error('init boom'));
    const shell = createAdminShell({ api: fakeApi(), selectors, load: vi.fn().mockResolvedValue(), afterLogin });
    input().value = 'x';
    expect(await shell.login()).toBe(true);
    expect(hidden('admin-content')).toBe(false);
    expect(toastText()).toContain('initialisation');
  });
});

describe('reload', () => {
  test('resolves true on success', async () => {
    const load = vi.fn().mockResolvedValue();
    const shell = createAdminShell({ api: fakeApi('t'), selectors, load });
    expect(await shell.reload()).toBe(true);
  });

  test('401 returns to the auth screen and clears the token, without throwing', async () => {
    const api = fakeApi('t');
    document.getElementById('auth-section')!.classList.add('hidden');
    document.getElementById('admin-content')!.classList.remove('hidden');
    const shell = createAdminShell({
      api, selectors,
      load: () => Promise.reject(new ApiError('Unauthorized', 401)),
    });

    expect(await shell.reload()).toBe(false);

    expect(api.store.token).toBe('');
    expect(hidden('auth-section')).toBe(false);
    expect(hidden('admin-content')).toBe(true);
    expect(toastText()).toBe('Session expirée');
  });

  test('500 toasts and stays on the dashboard, token kept', async () => {
    const api = fakeApi('t');
    document.getElementById('admin-content')!.classList.remove('hidden');
    const shell = createAdminShell({
      api, selectors,
      load: () => Promise.reject(new ApiError('Request failed', 500)),
    });

    expect(await shell.reload()).toBe(false);

    expect(api.store.token).toBe('t');
    expect(hidden('admin-content')).toBe(false);
    expect(toastText()).toBe('Erreur lors du chargement des données');
  });

  test('a 4xx error toasts the server message; non-ApiError uses the generic one', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new ApiError('Interdit', 403))
      .mockRejectedValueOnce(new Error('boom'));
    const shell = createAdminShell({ api: fakeApi('t'), selectors, load });
    await shell.reload();
    expect(toastText()).toBe('Interdit');
    await shell.reload();
    expect(toastText()).toBe('Erreur lors du chargement des données');
  });
});

describe('logout and getToken', () => {
  test('logout clears token, input and error, and shows the login screen', async () => {
    const api = fakeApi('tok');
    const shell = createAdminShell({ api, selectors, load: vi.fn().mockResolvedValue() });
    await shell.init();
    input().value = 'typed';
    el('auth-error').classList.remove('hidden');

    shell.logout();

    expect(shell.getToken()).toBe('');
    expect(input().value).toBe('');
    expect(hidden('auth-error')).toBe(true);
    expect(hidden('auth-section')).toBe(false);
    expect(hidden('admin-content')).toBe(true);
  });

  test('getToken always reads the live client token', () => {
    const api = fakeApi('a');
    const shell = createAdminShell({ api, selectors, load: vi.fn() });
    api.setToken('b');
    expect(shell.getToken()).toBe('b');
  });

  test('tolerates missing elements', async () => {
    document.body.innerHTML = '';
    const shell = createAdminShell({ api: fakeApi('t'), selectors, load: vi.fn().mockRejectedValue(new ApiError('x', 401)) });
    await shell.init();
    shell.logout();
    expect(await shell.login()).toBe(false);
  });
});
