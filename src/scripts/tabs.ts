/**
 * Tab switching - Info Evry Design System
 * Works with both AdminSidebar.astro (`.admin-sidebar`) and TabNav.astro
 * (`.tab-nav`); both render `[data-tab]` buttons and expect a matching
 * `#panel-<id>` element to toggle.
 */

import { $ } from './dom';

const TAB_BUTTON_SELECTOR = '.admin-sidebar [data-tab], .tab-nav [data-tab]';

/**
 * Switch to the tab identified by `id`: toggles `.active`/`aria-selected`
 * on every matching `[data-tab]` button and shows only the matching
 * `#panel-<id>` element (toggling `.hidden` on the rest).
 */
export function switchTab(id: string): void {
  for (const btn of document.querySelectorAll<HTMLElement>(TAB_BUTTON_SELECTOR)) {
    const isActive = btn.dataset.tab === id;
    btn.classList.toggle('active', isActive);
    if (btn.hasAttribute('aria-selected')) {
      btn.setAttribute('aria-selected', String(isActive));
    }
  }

  for (const panel of document.querySelectorAll<HTMLElement>('.tab-panel')) {
    panel.classList.toggle('hidden', panel.id !== `panel-${id}`);
  }
}

export interface InitTabsOptions {
  /** Called after switching to a tab with the newly active tab id. */
  onChange?: (id: string) => void;
}

/**
 * Wire up click handlers for every `[data-tab]` button inside
 * `.admin-sidebar` or `.tab-nav`.
 */
export function initTabs(options: InitTabsOptions = {}): void {
  for (const btn of document.querySelectorAll<HTMLElement>(TAB_BUTTON_SELECTOR)) {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      if (!id) return;
      switchTab(id);
      options.onChange?.(id);
    });
  }
}

export interface SetTabBadgeOptions {
  /** Hide the badge element when count is 0 (default: true). */
  hideWhenZero?: boolean;
}

/**
 * Update the badge for a tab (`#<id>-badge`, see AdminSidebar.astro /
 * TabNav.astro) with a new count, hiding it when the count is 0 unless
 * `hideWhenZero` is set to false.
 */
export function setTabBadge(id: string, count: number, options: SetTabBadgeOptions = {}): void {
  const { hideWhenZero = true } = options;
  const badge = $(`${id}-badge`);
  if (!badge) return;

  badge.textContent = String(count);
  badge.classList.toggle('hidden', hideWhenZero && count === 0);
}
