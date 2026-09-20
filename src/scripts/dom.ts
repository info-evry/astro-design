/**
 * DOM helpers - Info Evry Design System
 * Small, dependency-free helpers shared by admin dashboards.
 */

/**
 * Shorthand for document.getElementById
 * @param id - Element ID
 */
export function $<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Escape HTML special characters to prevent XSS when interpolating
 * untrusted strings into markup (text nodes and attributes alike).
 * @param str - String to escape
 */
export function escapeHtml(str: unknown): string {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Truncate text with an ellipsis.
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncating (default 40)
 */
export function truncateText(str: string | null | undefined, maxLength = 40): string {
  if (!str || str.length <= maxLength) return str ?? '';
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Debounce a function: only the last call within `wait` ms is executed.
 * @param fn - Function to debounce
 * @param wait - Delay in ms (default 300)
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 300
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Format an amount in cents as EUR currency (fr-FR locale).
 * @param cents - Amount in cents
 */
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}

/**
 * Format a date (or ISO date string) using the fr-FR locale.
 * @param value - Date, ISO string, or timestamp
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', options);
}
