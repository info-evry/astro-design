/**
 * Toast Script Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { showToast, toastSuccess, toastError } from '../src/scripts/toast';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('showToast', () => {
  test('appends a .toast element with the message and type class', () => {
    showToast('Hello', 'success', 10000);
    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Hello');
    expect(toast?.classList.contains('success')).toBe(true);
  });

  test('replaces an existing toast instead of stacking', () => {
    showToast('First', 'info', 10000);
    showToast('Second', 'error', 10000);
    const toasts = document.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toBe('Second');
    expect(toasts[0].classList.contains('error')).toBe(true);
  });

  test('removes the toast after the given duration', async () => {
    // showToast fades out after `duration`, then removes the element
    // after a further 300ms transition - wait past both.
    showToast('Bye', 'info', 10);
    expect(document.querySelector('.toast')).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(document.querySelector('.toast')).toBeNull();
  });
});

describe('toastSuccess / toastError', () => {
  test('toastSuccess renders the success variant', () => {
    toastSuccess('Saved', 10000);
    expect(document.querySelector('.toast.success')?.textContent).toBe('Saved');
  });

  test('toastError renders the error variant', () => {
    toastError('Failed', 10000);
    expect(document.querySelector('.toast.error')?.textContent).toBe('Failed');
  });
});
