/**
 * Confirm Helper Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { confirmAction } from '../src/scripts/confirm';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const modal = () => document.getElementById('confirm-modal')!;
const button = () => document.getElementById('confirm-delete-btn') as HTMLButtonElement;

function render(buttonId = 'confirm-delete-btn'): void {
  document.body.innerHTML = `
    <div id="confirm-modal" class="modal hidden">
      <div class="modal-content">
        <h3>Confirmer la suppression</h3>
        <p id="confirm-message"></p>
        <div class="modal-actions">
          <button type="button" data-modal-close="confirm-modal">Annuler</button>
          <button type="button" id="${buttonId}" class="btn btn-danger">Supprimer</button>
        </div>
      </div>
    </div>`;
}

beforeEach(() => render());

describe('confirmAction', () => {
  test('sets message and label, and opens the modal', () => {
    confirmAction({ message: 'Supprimer <b>X</b> ?', confirmLabel: 'Oui', onConfirm: vi.fn() });

    expect(document.getElementById('confirm-message')!.textContent).toBe('Supprimer <b>X</b> ?');
    expect(document.getElementById('confirm-message')!.querySelector('b')).toBeNull();
    expect(button().textContent).toBe('Oui');
    expect(modal().classList.contains('hidden')).toBe(false);
  });

  test('closes the modal after onConfirm resolves', async () => {
    let release!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm });

    button().click();
    await flush();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(modal().classList.contains('hidden')).toBe(false);
    expect(button().disabled).toBe(true);

    release();
    await flush();
    expect(modal().classList.contains('hidden')).toBe(true);
    expect(button().disabled).toBe(false);
  });

  test('a second click while onConfirm runs is ignored', async () => {
    let release!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm });

    button().click();
    // happy-dom still dispatches on a disabled button via dispatchEvent
    button().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    release();
    await flush();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('errors are toasted and the modal stays open', async () => {
    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm: () => Promise.reject(new Error('Échec serveur')) });

    button().click();
    await flush();

    expect(document.querySelector('.toast.error')?.textContent).toBe('Échec serveur');
    expect(modal().classList.contains('hidden')).toBe(false);
    expect(button().disabled).toBe(false);
  });

  test('non-Error rejections get a generic toast', async () => {
    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm: () => Promise.reject('nope') });
    button().click();
    await flush();
    expect(document.querySelector('.toast.error')?.textContent).toBe('Une erreur est survenue');
  });

  test('does not accumulate listeners across 3 calls: only the last handler runs, once', async () => {
    const addSpy = vi.spyOn(button(), 'addEventListener');
    const removeSpy = vi.spyOn(button(), 'removeEventListener');
    const [a, b, c] = [vi.fn(), vi.fn(), vi.fn()];

    confirmAction({ message: '1', confirmLabel: 'ok', onConfirm: a });
    confirmAction({ message: '2', confirmLabel: 'ok', onConfirm: b });
    confirmAction({ message: '3', confirmLabel: 'ok', onConfirm: c });

    expect(addSpy).toHaveBeenCalledTimes(3);
    expect(removeSpy).toHaveBeenCalledTimes(2);

    button().click();
    await flush();

    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
    expect(c).toHaveBeenCalledTimes(1);
  });

  test('title is applied for one call and the original restored on the next', () => {
    const heading = () => modal().querySelector('h3')!;

    confirmAction({ title: 'Approuver ?', message: 'm', confirmLabel: 'ok', onConfirm: vi.fn() });
    expect(heading().textContent).toBe('Approuver ?');

    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm: vi.fn() });
    expect(heading().textContent).toBe('Confirmer la suppression');
  });

  test('variant switches the button style, defaulting to danger', () => {
    confirmAction({ message: 'm', confirmLabel: 'ok', variant: 'primary', onConfirm: vi.fn() });
    expect(button().classList.contains('btn-primary')).toBe(true);
    expect(button().classList.contains('btn-danger')).toBe(false);

    confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm: vi.fn() });
    expect(button().classList.contains('btn-danger')).toBe(true);
    expect(button().classList.contains('btn-primary')).toBe(false);
  });

  test('works without a title element and with the #confirm-btn id', async () => {
    render('confirm-btn');
    modal().querySelector('h3')!.remove();
    const onConfirm = vi.fn();

    confirmAction({ title: 'ignored', message: 'm', confirmLabel: 'Confirmer', onConfirm });
    document.getElementById('confirm-btn')!.click();
    await flush();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('throws when the markup is missing', () => {
    document.body.innerHTML = '';
    expect(() => confirmAction({ message: 'm', confirmLabel: 'ok', onConfirm: vi.fn() })).toThrow(
      /#confirm-modal/
    );
  });
});
