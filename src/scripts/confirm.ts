/**
 * Confirm dialog helper - Info Evry Design System
 *
 * Drives the shared confirm-modal markup used by the dashboards:
 * `#confirm-modal` (`.modal` with an optional `<h3>` title), `#confirm-message`
 * and `#confirm-delete-btn` (falling back to `#confirm-btn`, the id astro-join
 * uses for the same button).
 */

import { $ } from './dom';
import { closeModal, openModal } from './modal';
import { toastError } from './toast';

export interface ConfirmActionOptions {
  /** Modal title; when omitted the markup's own title is kept. */
  title?: string;
  /** Message shown in the modal (set as text, never parsed as HTML). */
  message: string;
  /** Label of the confirm button. */
  confirmLabel: string;
  /** Runs on confirm. The modal closes once it resolves; if it throws, the error is toasted and the modal stays open. */
  onConfirm: () => unknown;
  /** Confirm button style (`btn-danger` by default). */
  variant?: 'danger' | 'primary';
}

export const CONFIRM_MODAL_ID = 'confirm-modal';
const CONFIRM_MESSAGE_ID = 'confirm-message';
const CONFIRM_BUTTON_IDS = ['confirm-delete-btn', 'confirm-btn'];
const MSG_ERROR = 'Une erreur est survenue';

/** The click listener currently installed on each confirm button. */
const installed = new WeakMap<HTMLElement, EventListener>();

function findButton(): HTMLButtonElement | null {
  for (const id of CONFIRM_BUTTON_IDS) {
    const button = $<HTMLButtonElement>(id);
    if (button) return button;
  }
  return null;
}

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : MSG_ERROR;
}

/**
 * Show the confirm modal for one action. Each call replaces the previous
 * call's handler on the button (a single listener is ever attached, however
 * many times this is called), and a second click while `onConfirm` is still
 * running is ignored.
 * @throws Error when the confirm markup is missing from the page
 */
export function confirmAction(options: ConfirmActionOptions): void {
  const { title, message, confirmLabel, onConfirm, variant = 'danger' } = options;
  const modal = $(CONFIRM_MODAL_ID);
  const messageEl = $(CONFIRM_MESSAGE_ID);
  const button = findButton();
  if (!modal || !messageEl || !button) {
    throw new Error('confirmAction: #confirm-modal, #confirm-message and a confirm button are required');
  }

  messageEl.textContent = message;

  const heading = modal.querySelector<HTMLElement>('h3');
  if (heading) {
    heading.dataset.defaultTitle ??= heading.textContent ?? '';
    heading.textContent = title ?? heading.dataset.defaultTitle;
  }

  button.textContent = confirmLabel;
  button.classList.remove('btn-danger', 'btn-primary');
  button.classList.add(`btn-${variant}`);
  button.disabled = false;

  const previous = installed.get(button);
  if (previous) button.removeEventListener('click', previous);

  let running = false;
  const listener: EventListener = async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    try {
      await onConfirm();
      closeModal(CONFIRM_MODAL_ID);
    } catch (error) {
      toastError(errorText(error));
    } finally {
      running = false;
      button.disabled = false;
    }
  };
  installed.set(button, listener);
  button.addEventListener('click', listener);

  openModal(CONFIRM_MODAL_ID);
}
