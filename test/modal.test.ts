/**
 * Modal Script Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { openModal, closeModal, initModals } from '../src/scripts/modal';

function renderModal(): void {
  document.body.innerHTML = `
    <button data-modal-open="my-modal">Open</button>
    <div id="my-modal" class="modal hidden">
      <div class="modal-content">
        <button data-modal-close="my-modal">Close</button>
      </div>
    </div>
  `;
}

describe('openModal / closeModal', () => {
  beforeEach(renderModal);

  test('openModal removes the hidden class', () => {
    openModal('my-modal');
    expect(document.getElementById('my-modal')?.classList.contains('hidden')).toBe(false);
  });

  test('closeModal adds the hidden class', () => {
    openModal('my-modal');
    closeModal('my-modal');
    expect(document.getElementById('my-modal')?.classList.contains('hidden')).toBe(true);
  });
});

describe('initModals', () => {
  beforeEach(renderModal);

  test('data-modal-open opens the target modal', () => {
    initModals();
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(document.getElementById('my-modal')?.classList.contains('hidden')).toBe(false);
  });

  test('data-modal-close closes the named modal', () => {
    initModals();
    openModal('my-modal');
    (document.querySelector('[data-modal-close]') as HTMLElement).click();
    expect(document.getElementById('my-modal')?.classList.contains('hidden')).toBe(true);
  });

  test('clicking the backdrop closes the modal', () => {
    initModals();
    const modal = document.getElementById('my-modal') as HTMLElement;
    modal.classList.remove('hidden');
    modal.click();
    expect(modal.classList.contains('hidden')).toBe(true);
  });

  test('backdrop close can be disabled', () => {
    initModals({ backdrop: false });
    const modal = document.getElementById('my-modal') as HTMLElement;
    modal.classList.remove('hidden');
    modal.click();
    expect(modal.classList.contains('hidden')).toBe(false);
  });

  test('Escape closes every open modal', () => {
    initModals();
    openModal('my-modal');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('my-modal')?.classList.contains('hidden')).toBe(true);
  });
});
