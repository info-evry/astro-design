/**
 * HTML Template Helper Tests
 */

import { describe, test, expect } from 'vitest';
import { statCardHtml, badgeHtml, emptyStateHtml } from '../src/scripts/templates';

describe('statCardHtml', () => {
  test('renders the default StatCard.astro structure', () => {
    const html = statCardHtml({ value: 42, label: 'Members' });
    expect(html).toContain('class="stat-card"');
    expect(html).toContain('<div class="stat-value">42</div>');
    expect(html).toContain('<div class="stat-label">Members</div>');
    expect(html).not.toContain('stat-sublabel');
  });

  test('includes the sublabel when provided', () => {
    const html = statCardHtml({ value: '10€', label: 'Revenue', sublabel: 'this month' });
    expect(html).toContain('<div class="stat-sublabel">this month</div>');
  });

  test('applies the highlight/small variant classes', () => {
    expect(statCardHtml({ value: 1, label: 'A', variant: 'highlight' })).toContain('stat-card-highlight');
    expect(statCardHtml({ value: 1, label: 'A', variant: 'small' })).toContain('stat-card-sm');
  });

  test('applies color modifier classes and ids', () => {
    const html = statCardHtml({ value: 1, label: 'A', variant: 'primary', id: 'total', valueId: 'total-value' });
    expect(html).toContain('class="stat-card primary" id="total"');
    expect(html).toContain('id="total-value"');
  });

  test('escapes untrusted values', () => {
    const html = statCardHtml({ value: '<b>x</b>', label: 'A' });
    expect(html).not.toContain('<b>');
  });
});

describe('badgeHtml', () => {
  test('renders a badge span with the given variant', () => {
    expect(badgeHtml('Actif', 'success')).toBe('<span class="badge badge-success">Actif</span>');
  });

  test('defaults to the default variant', () => {
    expect(badgeHtml('Info')).toBe('<span class="badge badge-default">Info</span>');
  });
});

describe('emptyStateHtml', () => {
  test('renders the icon, title, and optional hint', () => {
    const html = emptyStateHtml('tray', 'Aucun résultat', 'Essayez un autre filtre');
    expect(html).toContain('class="empty-state"');
    expect(html).toContain('Aucun résultat');
    expect(html).toContain('Essayez un autre filtre');
  });

  test('omits the hint paragraph when not provided', () => {
    const html = emptyStateHtml('tray', 'Aucun résultat');
    expect(html).toContain('Aucun résultat');
    expect(html.match(/<p>/g)?.length).toBe(1);
  });
});
