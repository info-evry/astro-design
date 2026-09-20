/**
 * Disclosure component - toggle functionality
 * Handles click events on disclosure headers to toggle open/closed state.
 *
 * This module has no side effects on import: call `initDisclosures()`
 * explicitly once the DOM is ready.
 */

/**
 * Toggle a disclosure group's open state by its `data-disclosure` id.
 */
export function toggleDisclosure(id: string): void {
  document.querySelector(`[data-disclosure="${id}"]`)?.classList.toggle('open');
}

/**
 * Initialize all disclosure toggle handlers.
 * Call this function after DOM is ready.
 */
export function initDisclosures(): void {
  for (const header of document.querySelectorAll('[data-disclosure-toggle]')) {
    // Idempotent: <Disclosure> self-initialises and a page bootstrap may call
    // this again; binding twice would open-then-close on every click.
    if ((header as HTMLElement).dataset.disclosureBound === 'true') continue;
    (header as HTMLElement).dataset.disclosureBound = 'true';
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking on header-actions
      if ((e.target as Element).closest('.header-actions')) return;

      const id = header.getAttribute('data-disclosure-toggle');
      if (id) toggleDisclosure(id);
    });
  }
}
