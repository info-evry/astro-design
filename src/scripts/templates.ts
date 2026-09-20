/**
 * HTML template helpers - Info Evry Design System
 * Generate markup that matches the corresponding .astro component's class
 * structure, for use in JS-rendered (innerHTML) admin dashboard content.
 */

import { escapeHtml } from './dom';

export interface StatCardHtmlOptions {
  value: string | number;
  label: string;
  sublabel?: string;
  /** Matches StatCard.astro's `variant` prop plus the color modifiers from kpi-stats.css. */
  variant?: 'default' | 'highlight' | 'small' | 'primary' | 'success' | 'warning' | 'error';
  id?: string;
  valueId?: string;
}

/** Matches the markup produced by StatCard.astro. */
export function statCardHtml(options: StatCardHtmlOptions): string {
  const { value, label, sublabel, variant = 'default', id, valueId } = options;

  const classes = ['stat-card'];
  if (variant === 'highlight') classes.push('stat-card-highlight');
  else if (variant === 'small') classes.push('stat-card-sm');
  else if (variant === 'primary' || variant === 'success' || variant === 'warning' || variant === 'error') {
    classes.push(variant);
  }

  const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
  const valueIdAttr = valueId ? ` id="${escapeHtml(valueId)}"` : '';
  const sublabelHtml = sublabel
    ? `<div class="stat-sublabel">${escapeHtml(sublabel)}</div>`
    : '';

  return (
    `<div class="${classes.join(' ')}"${idAttr}>` +
    `<div class="stat-value"${valueIdAttr}>${escapeHtml(value)}</div>` +
    `<div class="stat-label">${escapeHtml(label)}</div>` +
    sublabelHtml +
    `</div>`
  );
}

/** Matches the markup produced by Badge.astro (without the optional dot). */
export function badgeHtml(text: string, variant = 'default'): string {
  return `<span class="badge badge-${escapeHtml(variant)}">${escapeHtml(text)}</span>`;
}

/** Matches the `.empty-state` markup convention (see admin/tables.css). */
export function emptyStateHtml(icon: string, title: string, hint?: string): string {
  const hintHtml = hint ? `<p class="text-muted">${escapeHtml(hint)}</p>` : '';
  return (
    `<div class="empty-state">` +
    `<span class="sf-symbol">${escapeHtml(icon)}</span>` +
    `<p>${escapeHtml(title)}</p>` +
    hintHtml +
    `</div>`
  );
}
