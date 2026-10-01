/**
 * Admin shell - Info Evry Design System
 *
 * The login flow every admin dashboard duplicates: stored-token auto-login,
 * interactive login (button + Enter), error display, one-shot post-login
 * initialisation, a never-throwing `reload()` and `logout()`.
 *
 * Token policy: the stored token is cleared ONLY when the server answers 401.
 * Network failures and 5xx keep it (so a flaky connection does not log the
 * admin out) and show a retry message instead.
 */

import { ApiError, createApiClient, type ApiClient } from './api-client';
import { toastError } from './toast';

export interface AdminShellSelectors {
  /** CSS selector of the login section (hidden once authenticated). */
  authSection: string;
  /** CSS selector of the dashboard content (hidden until authenticated). */
  adminContent: string;
  /** CSS selector of the token `<input>`. */
  tokenInput: string;
  /** CSS selector of the login button. */
  authBtn: string;
  /** CSS selector of the login error element. */
  authError: string;
}

export interface AdminShellOptions {
  /**
   * API client used for the token (`getToken/setToken/clearToken`).
   * Defaults to `createApiClient({ tokenKey })`. Inject one to share it with
   * the site's modules, or a fake in tests.
   */
  api?: ApiClient;
  /** localStorage key; required when `api` is not injected. */
  tokenKey?: string;
  selectors: AdminShellSelectors;
  /**
   * Fetch and render the dashboard data. Must THROW on failure (the shell
   * decides what to do with 401 vs other errors) and must not handle auth.
   */
  load: () => Promise<unknown> | unknown;
  /**
   * Runs exactly once, after the first successful login (stored token or
   * interactive) once the dashboard is visible: init modules needing auth.
   */
  afterLogin?: () => Promise<unknown> | unknown;
}

export interface AdminShell {
  /**
   * Bind the login button / Enter key (once) and try the stored token.
   * Safe to call more than once: later calls return the first promise.
   */
  init(): Promise<void>;
  /**
   * Log in with the token typed in the input; if the input is empty and a
   * token is still stored (kept after a network/5xx failure), retry with it.
   * Resolves to whether the login succeeded; never rejects.
   */
  login(): Promise<boolean>;
  /** Re-run `load()`. Never throws; resolves to whether it succeeded. */
  reload(): Promise<boolean>;
  /** Clear the token and return to the login screen. */
  logout(): void;
  /** Current bearer token (always read from the client: no stale copy). */
  getToken(): string;
}

const MSG_TOKEN_REQUIRED = 'Veuillez entrer un token';
const MSG_TOKEN_INVALID = 'Token invalide';
const MSG_SESSION_EXPIRED = 'Session expirée';
const MSG_UNAVAILABLE = 'Service momentanément indisponible. Réessayez.';
const MSG_LOAD_FAILED = 'Erreur lors du chargement des données';
const MSG_INIT_FAILED = "Erreur lors de l'initialisation";

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Server-provided message for 4xx errors; `fallback` for network/5xx/unknown. */
function messageFor(error: unknown, fallback: string): string {
  if (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500 &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
}

const el = (selector: string): HTMLElement | null => document.querySelector<HTMLElement>(selector);

function resolveClient(options: AdminShellOptions): ApiClient {
  if (options.api) return options.api;
  if (options.tokenKey) return createApiClient({ tokenKey: options.tokenKey });
  throw new TypeError('createAdminShell: provide `api` or `tokenKey`');
}

/**
 * Create the shell. Elements are resolved lazily on each use, so markup that
 * is rendered after `createAdminShell()` is still found.
 */
export function createAdminShell(options: AdminShellOptions): AdminShell {
  const { selectors, load, afterLogin } = options;
  const client = resolveClient(options);

  let afterLoginDone = false;
  let initPromise: Promise<void> | undefined;
  let loginInFlight: Promise<boolean> | undefined;

  function showAuth(): void {
    el(selectors.authSection)?.classList.remove('hidden');
    el(selectors.adminContent)?.classList.add('hidden');
  }

  function showAdmin(): void {
    el(selectors.authSection)?.classList.add('hidden');
    el(selectors.adminContent)?.classList.remove('hidden');
  }

  function showAuthError(message: string): void {
    const target = el(selectors.authError);
    if (!target) return;
    target.textContent = message;
    target.classList.remove('hidden');
  }

  function hideAuthError(): void {
    el(selectors.authError)?.classList.add('hidden');
  }

  async function runAfterLogin(): Promise<void> {
    if (afterLoginDone || !afterLogin) return;
    afterLoginDone = true;
    try {
      await afterLogin();
    } catch (error) {
      console.error('Admin afterLogin failed:', error);
      toastError(MSG_INIT_FAILED);
    }
  }

  /** load -> show dashboard -> afterLogin. Throws whatever load() throws. */
  async function enter(): Promise<void> {
    await load();
    hideAuthError();
    showAdmin();
    await runAfterLogin();
  }

  /** Stored-token path: silent on 401, retry hint on anything else. */
  async function autoLogin(): Promise<void> {
    try {
      await enter();
    } catch (error) {
      showAuth();
      if (isUnauthorized(error)) {
        client.clearToken();
      } else {
        console.error('Admin auto-login failed:', error);
        showAuthError(MSG_UNAVAILABLE);
      }
    }
  }

  async function doLogin(): Promise<boolean> {
    const typed = (el(selectors.tokenInput) as HTMLInputElement | null)?.value?.trim() ?? '';
    const token = typed || client.getToken();
    if (!token) {
      showAuthError(MSG_TOKEN_REQUIRED);
      return false;
    }

    hideAuthError();
    client.setToken(token);
    try {
      await enter();
      return true;
    } catch (error) {
      if (isUnauthorized(error)) {
        client.clearToken();
        showAuthError(MSG_TOKEN_INVALID);
      } else {
        console.error('Admin login failed:', error);
        showAuthError(messageFor(error, MSG_UNAVAILABLE));
      }
      return false;
    }
  }

  function login(): Promise<boolean> {
    // Ignore repeated clicks / Enter presses while a login is in flight.
    loginInFlight ??= doLogin().finally(() => {
      loginInFlight = undefined;
    });
    return loginInFlight;
  }

  async function reload(): Promise<boolean> {
    try {
      await load();
      return true;
    } catch (error) {
      if (isUnauthorized(error)) {
        client.clearToken();
        showAuth();
        toastError(MSG_SESSION_EXPIRED);
      } else {
        console.error('Admin reload failed:', error);
        toastError(messageFor(error, MSG_LOAD_FAILED));
      }
      return false;
    }
  }

  function logout(): void {
    client.clearToken();
    const input = el(selectors.tokenInput) as HTMLInputElement | null;
    if (input) input.value = '';
    hideAuthError();
    showAuth();
  }

  function init(): Promise<void> {
    initPromise ??= (async () => {
      el(selectors.authBtn)?.addEventListener('click', () => {
        void login();
      });
      el(selectors.tokenInput)?.addEventListener('keydown', (event) => {
        if ((event as KeyboardEvent).key !== 'Enter') return;
        event.preventDefault();
        void login();
      });

      if (client.getToken()) {
        await autoLogin();
      } else {
        showAuth();
      }
    })();
    return initPromise;
  }

  return { init, login, reload, logout, getToken: () => client.getToken() };
}
