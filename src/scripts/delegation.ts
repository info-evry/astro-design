/**
 * Event delegation - Info Evry Design System
 *
 * Replaces inline `onclick`/`onchange` handlers and `window.*` globals with
 * `data-action` / `data-change` attributes dispatched from one delegated
 * listener per event type.
 *
 * Hardening over the per-site copies:
 * - handlers are looked up with `Object.hasOwn`, so `data-action="constructor"`
 *   or `"__proto__"` never reach `Object.prototype`;
 * - the innermost `[data-action]` wins;
 * - `[data-stop]` zones swallow clicks that have no action of their own
 *   inside the zone, so an ancestor's action does not fire;
 * - handler failures (sync throws and async rejections) go to `onError`
 *   instead of becoming unhandled rejections.
 */

/** A delegated handler. May be async. */
export type DelegatedHandler = (el: HTMLElement, event: Event) => unknown;

/** Map of attribute value -> handler. Only own keys are ever dispatched. */
export type DelegatedHandlers = Record<string, DelegatedHandler>;

export interface BindDelegationOptions {
  /** Element (or document) the listeners are attached to (default `document`). */
  root?: Document | Element;
  /** Attribute names read for each event type. */
  attrs?: { click?: string; change?: string };
  /** Receives handler errors. Default: `console.error`. */
  onError?: (error: unknown, el: HTMLElement) => void;
}

interface Binding {
  actions: DelegatedHandlers;
  changes: DelegatedHandlers;
  clickAttr: string;
  changeAttr: string;
  onError: (error: unknown, el: HTMLElement) => void;
  unbind: () => void;
}

const DEFAULT_CLICK_ATTR = 'data-action';
const DEFAULT_CHANGE_ATTR = 'data-change';
const STOP_ATTR = 'data-stop';
const STOP_ATTR_SELECTOR = `[${STOP_ATTR}]`;
/** Tags whose default behavior (navigation / submit) a click action replaces. */
const PREVENT_DEFAULT_TAGS = new Set(['BUTTON', 'A']);

const bindings = new WeakMap<object, Binding>();

function defaultOnError(error: unknown): void {
  console.error('[delegation] handler failed:', error);
}

/** Resolve the element an event originated from (text nodes -> parent). */
function originOf(event: Event): Element | null {
  const target = event.target as Node | null;
  if (!target) return null;
  if (typeof (target as Element).closest === 'function') return target as Element;
  return target.parentElement;
}

/** Own-property handler lookup; inherited names are inert. */
function lookup(map: DelegatedHandlers, name: string | null): DelegatedHandler | undefined {
  if (name === null || !Object.hasOwn(map, name)) return undefined;
  const handler = map[name];
  return typeof handler === 'function' ? handler : undefined;
}

function report(binding: Binding, error: unknown, el: HTMLElement): void {
  try {
    binding.onError(error, el);
  } catch (callbackError) {
    console.error('[delegation] onError threw:', callbackError);
  }
}

/** Run a handler, routing sync throws and async rejections to onError. */
function invoke(binding: Binding, handler: DelegatedHandler, el: HTMLElement, event: Event): void {
  try {
    const result = handler(el, event);
    // Promise.resolve(...).catch is always attached: no unhandled rejection.
    Promise.resolve(result).catch((error: unknown) => report(binding, error, el));
  } catch (error) {
    report(binding, error, el);
  }
}

/**
 * True when the click lies in a `[data-stop]` zone whose nearest action
 * belongs to an element outside (an ancestor of) that zone.
 */
function isSwallowed(origin: Element, actionEl: HTMLElement | null): boolean {
  const zone = origin.closest(STOP_ATTR_SELECTOR);
  if (!zone) return false;
  if (!actionEl) return true;
  return actionEl !== zone && actionEl.contains(zone);
}

function handleClick(root: Document | Element, binding: Binding, event: Event): void {
  const origin = originOf(event);
  if (!origin) return;

  const el = origin.closest<HTMLElement>(`[${binding.clickAttr}]`);
  if (isSwallowed(origin, el)) {
    event.stopPropagation();
    return;
  }
  if (!el || !root.contains(el)) return;

  if (el.hasAttribute(STOP_ATTR)) event.stopPropagation();

  const handler = lookup(binding.actions, el.getAttribute(binding.clickAttr));
  if (!handler) return;

  if (PREVENT_DEFAULT_TAGS.has(el.tagName)) event.preventDefault();
  invoke(binding, handler, el, event);
}

function handleChange(root: Document | Element, binding: Binding, event: Event): void {
  const origin = originOf(event);
  if (!origin) return;

  const el = origin.closest<HTMLElement>(`[${binding.changeAttr}]`);
  if (!el || !root.contains(el)) return;

  const handler = lookup(binding.changes, el.getAttribute(binding.changeAttr));
  if (handler) invoke(binding, handler, el, event);
}

/**
 * Bind delegated `click` and `change` listeners on `root`.
 *
 * Idempotent per root: binding a root that is already bound does not add a
 * second pair of listeners; it replaces the handler maps/options of the
 * existing binding (last call wins) and returns the same `unbind`.
 *
 * @param actions - Click handlers, keyed by `data-action` value
 * @param changes - Change handlers, keyed by `data-change` value
 * @returns `unbind()` - removes the listeners (safe to call repeatedly)
 */
export function bindDelegation(
  actions: DelegatedHandlers = {},
  changes: DelegatedHandlers = {},
  options: BindDelegationOptions = {}
): () => void {
  const root = options.root ?? document;
  const config = {
    actions,
    changes,
    clickAttr: options.attrs?.click ?? DEFAULT_CLICK_ATTR,
    changeAttr: options.attrs?.change ?? DEFAULT_CHANGE_ATTR,
    onError: options.onError ?? defaultOnError,
  };

  const existing = bindings.get(root);
  if (existing) {
    Object.assign(existing, config);
    return existing.unbind;
  }

  const onClick = (event: Event): void => handleClick(root, binding, event);
  const onChange = (event: Event): void => handleChange(root, binding, event);

  const binding: Binding = {
    ...config,
    unbind: () => {
      // A stale unbind (from before a re-bind) must not tear down a newer binding.
      if (bindings.get(root) !== binding) return;
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      bindings.delete(root);
    },
  };

  bindings.set(root, binding);
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  return binding.unbind;
}
