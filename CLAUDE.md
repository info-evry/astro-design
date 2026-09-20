# Claude Code Guidelines for @info-evry/astro-design

## Scoped styles vs. global admin CSS

Components whose class names appear in JS templates must not use scoped
styles. Consumers (astro-ndi, astro-join) render markup for these
components via `innerHTML`/template strings in plain JS (see
`scripts/templates.ts` and each site's `src/client/**`), completely
bypassing Astro's scoped-style mechanism (the `data-astro-cid-*` attribute
selector never gets attached to JS-generated nodes). Any styling for a
class name that can be produced outside of the `.astro` component itself
must live in a global stylesheet under `src/components/admin/*.css` (or
another file imported from `src/index.css`), not in a component's
`<style>` block.

This currently applies to (non-exhaustive): `AdminSidebar.astro`,
`admin/DataTable.astro`, `admin/AdminPageHeader.astro`, `Badge.astro`,
`TabNav.astro`, `SearchInput.astro`.

## Admin class contracts

See the README "Admin Dashboard" section for the full list of admin
classes, the AdminSidebar/tabs/badge contract, the shared client scripts,
and the base-aware asset helpers.
