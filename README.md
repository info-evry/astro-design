# @info-evry/astro-design

Shared design system for Asso Info Evry Astro projects. Provides a cohesive dark theme with glassmorphism effects, SF Symbols icons, and reusable Astro components.

## Features

- Dark theme with glassmorphism (blur + transparency)
- CSS custom properties (design tokens) for colors, spacing, typography
- Reusable Astro components (Header, Footer, Forms, etc.)
- SF Symbols icon integration
- Mobile-first responsive design
- Accessibility-focused

## Installation

Add as a git submodule:

```bash
git submodule add https://github.com/info-evry/astro-design.git design
```

Import the full design system in your Astro layout:

```astro
---
import '../design/src/index.css';
---
```

Or import specific parts:

```css
@import '../design/src/tokens/colors.css';
@import '../design/src/components/buttons.css';
```

## Structure

```
src/
├── tokens/               # CSS custom properties
│   ├── colors.css        # Color palette & gradients
│   ├── spacing.css       # Spacing scale (4px base)
│   ├── typography.css    # Fonts & text sizes
│   └── effects.css       # Radius, shadows, transitions
├── base/
│   └── reset.css         # CSS reset, SF Symbols font-face declaration
├── components/
│   ├── buttons.css       # Button variants
│   ├── cards.css         # Card components (glass, surface)
│   ├── forms.css         # Form elements & validation
│   ├── modals.css        # Modal dialogs
│   ├── sections.css      # Section layouts & containers
│   ├── header.css        # Header & navigation
│   ├── hero.css          # Hero sections
│   ├── admin.css         # Admin dashboard styles
│   ├── disclosure.css    # Accordion/disclosure groups
│   ├── kpi-stats.css     # Statistics cards
│   └── team-cards.css    # Team grid layouts
├── utilities/
│   ├── animations.css    # Keyframes & animation classes
│   └── helpers.css       # Utility classes
├── components/           # Astro components
│   ├── Header.astro      # Site header with mobile menu
│   ├── Footer.astro      # Site footer
│   ├── MobileNav.astro   # Mobile tab bar navigation
│   ├── HeroBackground.astro # Animated hero background
│   ├── SectionHeader.astro # Section title component
│   ├── FormInput.astro   # Form input with label
│   ├── FormSelect.astro  # Form select with label
│   ├── FormTextarea.astro # Form textarea with label
│   ├── FilterSelect.astro # Filter dropdown
│   ├── DataTable.astro   # Data table component
│   └── Badge.astro       # Status badge
├── integrations/
│   └── sf-symbols.ts     # Vite plugin for SF Symbols shortcodes
├── symbols/
│   └── sfsymbols.json    # SF Symbols character mappings
└── index.css             # Main entry point
```

## Design Tokens

### Colors

| Token | Value | Description |
|-------|-------|-------------|
| `--color-primary` | `#001BA5` | Electric blue |
| `--color-primary-light` | `#0ea5e9` | Light blue accent |
| `--color-bg` | `#000000` | Background black |
| `--color-surface` | `#0a0a0a` | Surface color |
| `--color-text` | `#ffffff` | Primary text |
| `--color-text-secondary` | `#a1a1aa` | Secondary text |
| `--color-text-muted` | `#71717a` | Muted text |

### Spacing

4px base unit scale from `--space-1` (4px) to `--space-32` (128px).

### Typography

- **Font**: SF Pro (self-hosted, subset for Latin characters)
- **Sizes**: `--text-xs` (12px) to `--text-6xl` (72px)
- **Tracking**: `--tracking-tight`, `--tracking-normal`, `--tracking-wide`

## Components

### Astro Components

```astro
---
import Header from '../design/src/components/Header.astro';
import Footer from '../design/src/components/Footer.astro';
import MobileNav from '../design/src/components/MobileNav.astro';
---

<Header
  homeUrl="/"
  navLinks={[{ href: '#about', label: 'About' }]}
  ctaHref="/join"
  ctaLabel="Join"
/>

<MobileNav
  items={[{ href: '#about', label: 'About', icon: 'info.circle' }]}
  ctaHref="/join"
  ctaLabel="Join"
  ctaIcon="person.badge.plus"
/>

<!-- SF Symbols using shortcodes -->
<span class="sfs sfs-lg" data-sfs="@sfs:checkmark.circle.fill@"></span>

<Footer />
```

### CSS Classes

#### Buttons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-sm">Small</button>
```

#### Cards

```html
<div class="glass-card card-content">
  Glassmorphism card with blur
</div>

<div class="surface-card card-content">
  Solid surface card
</div>
```

#### Forms

```html
<form class="form">
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" placeholder="you@example.com">
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message"></textarea>
  </div>
</form>
```

#### Sections

```html
<section class="section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">About</span>
      <h2 class="section-title">Who We Are</h2>
      <p class="section-description">Description text</p>
    </div>
  </div>
</section>
```

## SF Symbols

The design system includes SF Symbols support via shortcodes that are replaced at build time.

### Setup

Add the integration to your `astro.config.mjs`:

```js
import sfSymbols from './design/src/integrations/sf-symbols';

export default defineConfig({
  integrations: [sfSymbols()],
});
```

### Usage

Use the `@sfs:symbol.name@` shortcode format in data attributes:

```html
<!-- Inline icon -->
<span class="sfs sfs-md" data-sfs="@sfs:checkmark@"></span>

<!-- Different sizes -->
<span class="sfs sfs-sm" data-sfs="@sfs:xmark@"></span>
<span class="sfs sfs-lg" data-sfs="@sfs:person.2.fill@"></span>
<span class="sfs sfs-xl" data-sfs="@sfs:calendar@"></span>
<span class="sfs sfs-2xl" data-sfs="@sfs:star.fill@"></span>
```

### How It Works

1. Shortcodes like `@sfs:checkmark@` are written in the HTML
2. At build time, the Vite plugin replaces them with actual Unicode characters
3. CSS uses `::before { content: attr(data-sfs); }` to display the symbol
4. Font subsetting scans for shortcodes and creates an optimized font file

### Available Sizes

| Class | Font Size |
|-------|-----------|
| `sfs-xs` | 0.75rem |
| `sfs-sm` | 0.875rem |
| `sfs-md` | 1rem |
| `sfs-lg` | 1.25rem |
| `sfs-xl` | 1.5rem |
| `sfs-2xl` | 2rem |

### Dynamic Symbols (in components)

For dynamic icon names (e.g., in MobileNav), use template expressions:

```astro
<span class="sfs sfs-lg" data-sfs={`@sfs:${item.icon}@`}></span>
```

The shortcode will be resolved after SSR when the actual symbol name is known.

## Admin Dashboard

The admin dashboard classes are the single source of truth for the NDI and
Join admin panels. They live in `src/components/admin/*.css` (all imported
from `admin/index.css`, which is imported from the main `index.css`), and
are also produced by hand-written admin page markup and by JS-rendered
(`innerHTML`) rows. **Components whose class names appear in JS templates
must not use scoped `<style>` blocks** — see `CLAUDE.md`.

### Layout

- `.admin-layout` — sidebar + main content grid (`AdminSidebar` + `.admin-main`).
- `.admin-page-header` / `.admin-page-header-content` / `.admin-page-title` /
  `.admin-page-subtitle` / `.admin-breadcrumb` — `AdminPageHeader.astro`
  (`admin/page-header.css`). The header is full-width (no `.container`
  class); wrap page content in `.admin-main` for the padded layout.
- `.tab-panel` / `.tab-panel.hidden` — panel shown/hidden by tab id.

### AdminSidebar / tabs / badge contract

`AdminSidebar.astro` renders one `role="tab"` button per entry in `tabs`:

```astro
<AdminSidebar
  id="admin-sidebar"
  activeTab="members"
  tabs={[
    { id: 'members', label: 'Membres', icon: 'person.2', badge: 0 },
    { id: 'pending', label: 'En attente', icon: 'person.badge.clock' },
  ]}
/>
```

Renders (per tab):

```html
<button type="button" role="tab" class="admin-sidebar-item [active]"
        data-tab="members" aria-controls="panel-members" aria-selected="true">
  <span class="admin-sidebar-icon sf-symbol">…</span>
  <span class="admin-sidebar-label">Membres</span>
  <span id="members-badge" class="admin-sidebar-badge [hidden]">0</span>
</button>
```

`TabNav.astro` renders the same `[data-tab]`/`role="tab"` contract for a
horizontal tab bar (`.tab-nav`/`.tab-item`/`.tab-icon`/`.tab-badge`,
variants: `default`, `pills`, `underline`).

Both are driven by `scripts/tabs.ts`:

```js
import { initTabs, switchTab, setTabBadge } from '@info-evry/astro-design/scripts/tabs';

initTabs({ onChange: (id) => loadTabData(id) });
setTabBadge('pending', 3); // shows "3"; hides the badge automatically at 0
```

### Tables

- `.data-table` / `.members-table` — full-width tables with fixed column
  helpers (`.checkbox-col`, `.actions-col`, `.status-col`, `.time-col`,
  `.badge-col`, `.team-col`) and a `.table-container` scroll wrapper.
- Sort contract: sortable `<th>` gets `class="sortable"`; once sorted, a
  `data-sort="asc"|"desc"` attribute on the same `<th>` drives the arrow
  shown by the nested `<span class="sort-indicator">` (`::after` content).
  `.sortable-header` + `[data-sort-dir="asc"|"desc"]` are kept as aliases
  for markup written before this contract existed.
- `.table-wrapper`, `.table-search`, `.table-empty` / `.empty-state`
  (alias `.no-archives`) — `DataTable.astro`'s search/empty-state areas.
- `tr.selected` / `.member-row.selected` — selected row highlight.
- `.contact-cell` — stacked contact info inside a table cell.
- `.loading-placeholder` — centered loading text while data is fetched.

### Badges

One `.badge` / `.badge-<variant>` system, shared by `Badge.astro` and the
admin tables:

- Color variants (compact, for table cells): `primary`, `leader`,
  `secondary`, `bac`, `success`, `warning`, `error`, `info`, `muted`.
- Layout variants (pill look, for `Badge.astro`): `default`, `hero`
  (larger, for hero sections), `count` (compact, for numbers), `status`.
- `showDot` renders a `.badge-dot` pulsing dot; `animated` adds an
  entrance animation.

### Filters, forms & toolbars

- `.filter-bar` / `.filter-label` (alias `.attendance-filters`) — a row of
  filter checkboxes/pills above a table.
- `.members-toolbar` / `.filters-row` / `.filter-search` — search input +
  filter selects toolbar above a member list.
- `.bulk-actions` — the bar shown when rows are selected.
- `.form-hint`, `.settings-description` — small helper/description text
  under form fields and settings sections.
- `.toggle-label` / `.toggle-switch` — a checkbox-driven toggle switch.
- `SearchInput.astro` → `.search-input-wrapper` / `.search-icon` /
  `.search-input` (sizes: `sm`, `default`, `lg`).

### Danger zone & archives

- `admin/danger.css`: `.danger-zone`, `.reset-safety-check[.safe|.warning]`,
  `.result-text[.success|.warning]`, `.warning-text`.
- `admin/archives.css`: `.archives-container`, `.archive-card[.expired]`
  (+ `.archive-card-*` sub-parts), `.archive-stats-grid` /
  `.archive-stat-card` / `.archive-stat-value` / `.archive-stat-label`,
  `.archive-section`, `.archive-gdpr-notice`, `.archive-info`.

### Shared client scripts

DOM-only TypeScript, framework-free, importable as
`@info-evry/astro-design/scripts/<name>`:

| Module | Exports |
|---|---|
| `dom.ts` | `$`, `escapeHtml` (canonical: `& < > " '` -> `&#39;`), `numberOrNull`, `truncateText`, `debounce`, `formatCurrency`, `formatDate` (`''` for invalid/empty) |
| `toast.ts` | `showToast(message, type?, duration?)`, `toastSuccess/Error/Info/Warning` |
| `modal.ts` | `openModal(id)`, `closeModal(id)`, `initModals({ backdrop?, escape? })` (delegates `[data-modal-open]`/`[data-modal-close]`) |
| `tabs.ts` | `switchTab(id)`, `initTabs({ onChange? })`, `setTabBadge(id, count, { hideWhenZero? })` |
| `api-client.ts` | `readBaseUrl()`, `createApiClient({ baseUrl?, tokenKey })` → `{ api, setToken, getToken, clearToken }`, `ApiError` (`status`, `code?`) |
| `templates.ts` | `statCardHtml(options)`, `badgeHtml(text, variant)`, `emptyStateHtml(icon, title, hint?)` |
| `disclosure.ts` | `initDisclosures()`, `toggleDisclosure(id)` (no auto-init on import) |
| `delegation.ts` | `bindDelegation(actions, changes, { root?, attrs?, onError? })` → `unbind()` |
| `admin-shell.ts` | `createAdminShell({ api?, tokenKey?, selectors, load, afterLogin? })` → `{ init, login, reload, logout, getToken }` |
| `download.ts` | `downloadBlob(blob \| string, filename, mime?)`, `downloadFromApi(api, endpoint, filename)`, `safeFilename(name)` |
| `public-client.ts` | `createPublicClient({ baseUrl? })` → `{ get, post }` (always `ApiError`, never `SyntaxError`) |
| `confirm.ts` | `confirmAction({ title?, message, confirmLabel, onConfirm, variant? })` |

Example:

```js
import { createApiClient } from '@info-evry/astro-design/scripts/api-client';
import { toastError } from '@info-evry/astro-design/scripts/toast';

const client = createApiClient({ tokenKey: 'ndi_admin_token' });

try {
  const members = await client.api('/members');
} catch (err) {
  toastError(err.message);
}
```

### Delegation, admin shell and friends

**`bindDelegation(actions, changes, { root = document, attrs, onError })`**
replaces inline handlers with `data-action` (click) / `data-change` (change)
attributes. Handlers receive `(el, event)`.

- Handlers are looked up with `Object.hasOwn`: `data-action="constructor"` or
  `"__proto__"` is inert. The innermost `[data-action]` wins.
- `[data-stop]` marks a zone: a click inside it on an element with no action
  of its own does not trigger an ancestor's action (e.g. buttons inside a
  clickable disclosure header). An action element carrying `data-stop` also
  stops propagation to `window`.
- `preventDefault()` is called only for `<button>` and `<a>` actions, never for
  inputs/selects/checkboxes.
- Sync throws and async rejections go to `onError(err, el)` (default
  `console.error`), so they never become unhandled rejections.
- Idempotent per root: binding a root twice adds no second listener; the
  latest maps/options replace the earlier ones. `unbind()` removes the
  listeners.

```js
const unbind = bindDelegation(
  { 'edit-member': (el) => editMember(Number(el.dataset.memberId)) },
  { 'toggle-select': (el) => select(el.checked) },
  { onError: (err) => toastError(err.message) }
);
```

**`createAdminShell({ api, tokenKey, selectors, load, afterLogin })`**
implements the login flow shared by the dashboards. `selectors` are CSS
selectors (`'#auth-section'`) for `authSection`, `adminContent`, `tokenInput`,
`authBtn` and `authError`. Pass an existing `createApiClient()` as `api` (or
only `tokenKey` to have one created). `load()` must throw on failure and must
not handle auth itself.

- `await shell.init()` binds the button and Enter key and tries the stored
  token. The token is cleared **only on a 401**; on a network error or 5xx it
  is kept, a retry message is shown and clicking the login button with an empty
  input retries with the stored token.
- `afterLogin()` runs exactly once (first successful login, by either path),
  after the dashboard is visible.
- `shell.reload()` never throws and resolves to a boolean: 401 clears the
  token and returns to the login screen, anything else shows a toast.
- `shell.logout()`, `shell.getToken()` (always the live token).

**`downloadBlob(blob | string, filename, mime?)`** creates and revokes the
object URL and clicks a temporary anchor; filenames go through `safeFilename`.
**`downloadFromApi(api, endpoint, filename)`** takes the client's `api`
function and saves the `text/csv` `Response` it returns (JSON results are saved
pretty-printed).

**`createPublicClient({ baseUrl? })`** gives `get(endpoint)` /
`post(endpoint, body)` for unauthenticated forms. Failures are always an
`ApiError`: `message` is the server's `error` field, `code` its `code` field,
and non-JSON answers (a 502 HTML page) get `Service momentanément
indisponible`. Network failures have `status` 0 and `code: 'network_error'`.

**`confirmAction({ title?, message, confirmLabel, onConfirm, variant })`**
drives the `#confirm-modal` / `#confirm-message` / `#confirm-delete-btn`
markup (`#confirm-btn` is accepted too). It sets the message as text, installs
exactly one click listener on the button (earlier calls' handlers are
replaced), closes the modal once `onConfirm` resolves and toasts errors,
leaving the modal open.

## Base-Aware Assets

Sites can be deployed under a sub-path (e.g. `astro-ndi` under
`/nuit-de-linfo`, `astro-join` under `/adhesion`) or at the root
(`astro-asso`). `src/utils/base.ts` exports `withBase(path, base?)`, which
joins a path with the site's `import.meta.env.BASE_URL` without producing
doubled slashes:

```ts
import { withBase } from '@info-evry/astro-design/utils/base';

withBase('/favicon.svg'); // '/nuit-de-linfo/favicon.svg' under astro-ndi
```

`Head.astro` uses it for the favicon/apple-touch-icon links and also emits
`<meta name="base-url" content="...">`, which `scripts/api-client.ts`
reads via `readBaseUrl()`. `Header.astro`/`Footer.astro` use it for the
logo image.

The SF Pro font (`@font-face`, both the `Cupertino` and `SF Symbols`
families) lives in `src/base/fonts.css` and is imported with a relative
`url()`, so Vite copies and hashes it under each site's own base path.
Sites may delete any leftover copy under their own `public/fonts/` — it is
no longer referenced.

## Testing

```bash
bun test
```

Tests cover SF Symbols mapping, CSS token existence, and the shared client
scripts (DOM helpers, toast, modal, tabs, API client, templates, base
utility). DOM-touching tests run against `happy-dom`, registered globally
via `bunfig.toml`'s `[test].preload` (`test/setup-dom.ts`).

## Development

```bash
# Run tests
bun test

# Watch mode
bun test --watch
```

## Related Repositories

- [astro-core](https://github.com/info-evry/astro-core) - Shared code library (Router, helpers)
- [astro-asso](https://github.com/info-evry/astro-asso) - Main association website
- [astro-ndi](https://github.com/info-evry/astro-ndi) - NDI registration platform
- [astro-join](https://github.com/info-evry/astro-join) - Membership portal
- [astro-knowledge](https://github.com/info-evry/astro-knowledge) - Shared content

## License

AGPL-3.0 - Asso Info Evry
