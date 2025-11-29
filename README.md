# @info-evry/astro-design

Shared design system for Info Evry Astro projects.

## Usage

Add as a git submodule:

```bash
git submodule add https://github.com/info-evry/astro-design.git design
```

Import in your Astro layout:

```astro
---
// src/layouts/Layout.astro
---
<style is:global>
  @import '../design/src/index.css';
</style>
```

Or import specific parts:

```css
@import '../design/src/tokens/colors.css';
@import '../design/src/components/buttons.css';
```

## Structure

```
src/
├── tokens/           # CSS custom properties
│   ├── colors.css    # Color palette & gradients
│   ├── spacing.css   # Spacing scale
│   ├── typography.css # Fonts & sizes
│   └── effects.css   # Radius, shadows, transitions
├── base/
│   └── reset.css     # CSS reset & base styles
├── components/
│   ├── buttons.css   # Button variants
│   ├── cards.css     # Card components
│   ├── forms.css     # Form elements
│   ├── modals.css    # Modal dialogs
│   └── sections.css  # Section layouts
├── utilities/
│   ├── animations.css # Keyframes & animation classes
│   └── helpers.css    # Utility classes
└── index.css         # Main entry point
```

## Design Tokens

### Colors

- `--color-primary`: Electric blue (#0ea5e9)
- `--color-bg`: Black (#000000)
- `--color-surface`: Dark surface (#0a0a0a)
- `--color-text`: White (#ffffff)

### Spacing

4px base unit scale: `--space-1` (4px) to `--space-32` (128px)

### Typography

- Font: Inter
- Sizes: `--text-xs` (12px) to `--text-6xl` (72px)

## Components

### Buttons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards

```html
<div class="glass-card card-content">
  Glassmorphism card
</div>

<div class="surface-card card-content">
  Solid surface card
</div>
```

### Forms

```html
<form class="form">
  <div class="form-group">
    <label>Email</label>
    <input type="email" placeholder="you@example.com">
  </div>
</form>
```
