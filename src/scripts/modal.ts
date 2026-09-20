/**
 * Modal helpers - Info Evry Design System
 * Works with Modal.astro (`.modal.hidden` / `.modal-content`) and any
 * hand-written `.modal` markup using the same convention.
 */

import { $ } from './dom';

/** Open a modal by ID (removes `.hidden`). */
export function openModal(id: string): void {
  $(id)?.classList.remove('hidden');
}

/** Close a modal by ID (adds `.hidden`). */
export function closeModal(id: string): void {
  $(id)?.classList.add('hidden');
}

export interface InitModalsOptions {
  /** Close the modal when clicking its backdrop (default: true). */
  backdrop?: boolean;
  /** Close all open modals on Escape (default: true). */
  escape?: boolean;
}

// Module-level, mutable so repeated initModals() calls (e.g. across
// client-side navigations, or in tests) update behavior instead of
// stacking duplicate document-level listeners.
let config: Required<InitModalsOptions> = { backdrop: true, escape: true };
let listenersAttached = false;

function handleClick(event: Event): void {
  const target = event.target as Element | null;
  if (!target) return;

  const opener = target.closest<HTMLElement>('[data-modal-open]');
  if (opener) {
    const id = opener.dataset.modalOpen;
    if (id) openModal(id);
    return;
  }

  const closer = target.closest<HTMLElement>('[data-modal-close]');
  if (closer) {
    const id = closer.dataset.modalClose;
    if (id) {
      closeModal(id);
    } else {
      closer.closest('.modal')?.classList.add('hidden');
    }
    return;
  }

  if (config.backdrop && target.classList.contains('modal')) {
    target.classList.add('hidden');
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!config.escape || event.key !== 'Escape') return;
  for (const modal of document.querySelectorAll('.modal:not(.hidden)')) {
    modal.classList.add('hidden');
  }
}

/**
 * Wire up delegated modal behavior for the whole document:
 * - `[data-modal-open]` elements open the modal named by that attribute.
 * - `[data-modal-close]` elements close their closest `.modal` ancestor
 *   (or the modal named by the attribute's value, if non-empty).
 * - Clicking directly on the `.modal` backdrop closes it (opt-out via
 *   `{ backdrop: false }`).
 * - Escape closes every open modal (opt-out via `{ escape: false }`).
 *
 * Safe to call more than once (e.g. to change options); listeners are
 * delegated and attached only once, so modals added to the DOM later are
 * handled automatically.
 */
export function initModals(options: InitModalsOptions = {}): void {
  config = { backdrop: options.backdrop ?? true, escape: options.escape ?? true };

  if (listenersAttached) return;
  listenersAttached = true;

  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);
}
