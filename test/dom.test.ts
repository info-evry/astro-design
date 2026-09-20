/**
 * DOM Helpers Tests
 */

import { describe, test, expect } from 'vitest';
import { escapeHtml, truncateText, debounce, formatCurrency, formatDate, $ } from '../src/scripts/dom';

describe('escapeHtml', () => {
  test('escapes &, <, >, ", and \'', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  test('escapes text embedded in a larger string', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  test('returns empty string for falsy input', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('truncateText', () => {
  test('leaves short strings untouched', () => {
    expect(truncateText('short', 40)).toBe('short');
  });

  test('truncates long strings with an ellipsis', () => {
    const result = truncateText('a'.repeat(50), 10);
    expect(result.length).toBe(10);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('debounce', () => {
  test('only invokes the wrapped function once after the delay', async () => {
    let calls = 0;
    const fn = debounce(() => { calls++; }, 10);
    fn();
    fn();
    fn();
    expect(calls).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);
  });
});

describe('formatCurrency', () => {
  test('formats cents as EUR', () => {
    const result = formatCurrency(1234);
    expect(result).toContain('12');
    expect(result).toContain('34');
    expect(result).toMatch(/€/);
  });
});

describe('$', () => {
  test('returns the element with the given id', () => {
    const el = document.createElement('div');
    el.id = 'test-el';
    document.body.appendChild(el);
    expect($('test-el')).toBe(el);
    el.remove();
  });

  test('returns null when no element matches', () => {
    expect($('does-not-exist')).toBeNull();
  });
});

describe('formatDate with time', () => {
  test('accepts dateStyle + timeStyle without throwing', () => {
    const out = formatDate(new Date('2026-12-03T15:34:00Z'), { dateStyle: 'short', timeStyle: 'short' });
    expect(out).toContain('2026');
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});
