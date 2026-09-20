/**
 * Toast notification system - Info Evry Design System
 * Renders `.toast.<type>` (see admin/overlays.css) into document.body.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Show a toast notification. Replaces any currently visible toast.
 * @param message - Message to display
 * @param type - Toast type (default: 'info')
 * @param duration - Duration in ms before the toast is removed (default 3000)
 */
export function showToast(message: string, type: ToastType = 'info', duration = 3000): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/** Show a success toast. */
export function toastSuccess(message: string, duration?: number): void {
  showToast(message, 'success', duration);
}

/** Show an error toast. */
export function toastError(message: string, duration?: number): void {
  showToast(message, 'error', duration);
}

/** Show an info toast. */
export function toastInfo(message: string, duration?: number): void {
  showToast(message, 'info', duration);
}

/** Show a warning toast. */
export function toastWarning(message: string, duration?: number): void {
  showToast(message, 'warning', duration);
}
