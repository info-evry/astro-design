/**
 * Disclosure component - toggle functionality
 * Handles click events on disclosure headers to toggle open/closed state
 */

/**
 * Initialize all disclosure toggle handlers
 * Call this function after DOM is ready
 */
export function initDisclosures(): void {
  document.querySelectorAll('[data-disclosure-toggle]').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking on header-actions
      if ((e.target as Element).closest('.header-actions')) return;

      const id = header.getAttribute('data-disclosure-toggle');
      const group = document.querySelector(`[data-disclosure="${id}"]`);
      if (group) {
        group.classList.toggle('open');
      }
    });
  });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDisclosures);
  } else {
    initDisclosures();
  }
}
