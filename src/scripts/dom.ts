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
 * This is the canonical implementation: `&`, `<`, `>`, `"` and `'`
 * (as `&#39;`) are escaped.
 *
 * `null`, `undefined` and `false` yield `''`; every other value is
 * stringified first, so `0` becomes `'0'` rather than disappearing.
 * @param value - Value to escape
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined || value === false) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Parse a form/input value into a finite number, or `null` when it is
 * empty, blank, missing or not numeric (never `NaN`, never `0` by accident).
 * Strings are trimmed; only numbers and strings are accepted.
 * @param value - Raw value (e.g. `input.value`)
 */
export function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
 * Returns `''` for invalid, empty, `null` or `undefined` input.
 * @param value - Date, ISO string, or timestamp
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value === null || value === undefined || value === '') return '';
  const formatOptions: Intl.DateTimeFormatOptions = options ?? { dateStyle: 'medium' };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  // toLocaleDateString rejects timeStyle; Intl.DateTimeFormat accepts both.
  return new Intl.DateTimeFormat('fr-FR', formatOptions).format(date);
}
