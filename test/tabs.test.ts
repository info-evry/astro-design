/**
 * Tabs Script Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { switchTab, initTabs, setTabBadge } from '../src/scripts/tabs';

function renderSidebar(): void {
  document.body.innerHTML = `
    <nav class="admin-sidebar">
      <button data-tab="members" class="admin-sidebar-item active" aria-selected="true">
        Members
        <span id="members-badge" class="admin-sidebar-badge">0</span>
      </button>
      <button data-tab="pending" class="admin-sidebar-item" aria-selected="false">
        Pending
        <span id="pending-badge" class="admin-sidebar-badge">0</span>
      </button>
    </nav>
    <div id="panel-members" class="tab-panel"></div>
    <div id="panel-pending" class="tab-panel hidden"></div>
  `;
}

describe('switchTab', () => {
  beforeEach(renderSidebar);

  test('toggles active class and aria-selected on the matching button', () => {
    switchTab('pending');
    const membersBtn = document.querySelector('[data-tab="members"]') as HTMLElement;
    const pendingBtn = document.querySelector('[data-tab="pending"]') as HTMLElement;
    expect(membersBtn.classList.contains('active')).toBe(false);
    expect(membersBtn.getAttribute('aria-selected')).toBe('false');
    expect(pendingBtn.classList.contains('active')).toBe(true);
    expect(pendingBtn.getAttribute('aria-selected')).toBe('true');
  });

  test('shows only the matching panel, hiding the rest', () => {
    switchTab('pending');
    expect(document.getElementById('panel-members')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('panel-pending')?.classList.contains('hidden')).toBe(false);
  });
});

describe('initTabs', () => {
  beforeEach(renderSidebar);

  test('wires up click handlers that call switchTab and onChange', () => {
    const seen: string[] = [];
    initTabs({ onChange: (id) => seen.push(id) });

    const pendingBtn = document.querySelector('[data-tab="pending"]') as HTMLElement;
    pendingBtn.click();

    expect(pendingBtn.classList.contains('active')).toBe(true);
    expect(seen).toEqual(['pending']);
  });
});

describe('setTabBadge', () => {
  beforeEach(renderSidebar);

  test('updates the badge text', () => {
    setTabBadge('members', 5);
    expect(document.getElementById('members-badge')?.textContent).toBe('5');
  });

  test('hides the badge when count is 0 by default', () => {
    setTabBadge('members', 5);
    setTabBadge('members', 0);
    expect(document.getElementById('members-badge')?.classList.contains('hidden')).toBe(true);
  });

  test('keeps the badge visible at 0 when hideWhenZero is false', () => {
    setTabBadge('members', 0, { hideWhenZero: false });
    expect(document.getElementById('members-badge')?.classList.contains('hidden')).toBe(false);
  });
});
