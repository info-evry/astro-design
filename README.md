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
│   └── reset.css         # CSS reset, SF Symbols font-face
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
│   ├── SFSymbol.astro    # SF Symbols icon component
│   ├── FormInput.astro   # Form input with label
│   ├── FormSelect.astro  # Form select with label
│   ├── FormTextarea.astro # Form textarea with label
│   ├── FilterSelect.astro # Filter dropdown
│   ├── DataTable.astro   # Data table component
│   └── Badge.astro       # Status badge
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

- **Font**: Inter (loaded from rsms.me)
- **Sizes**: `--text-xs` (12px) to `--text-6xl` (72px)
- **Tracking**: `--tracking-tight`, `--tracking-normal`, `--tracking-wide`

## Components

### Astro Components

```astro
---
import Header from '../design/src/components/Header.astro';
import Footer from '../design/src/components/Footer.astro';
import MobileNav from '../design/src/components/MobileNav.astro';
import SFSymbol from '../design/src/components/SFSymbol.astro';
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

<SFSymbol name="checkmark.circle.fill" size="lg" />

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

The design system includes SF Symbols support via the `SFSymbol.astro` component:

```astro
<SFSymbol name="person.3" />
<SFSymbol name="checkmark.circle.fill" size="lg" />
<SFSymbol name="xmark" size="sm" />
```

Available sizes: `sm`, `base` (default), `lg`, `xl`

## Testing

```bash
bun test
```

Tests cover SF Symbols mapping and CSS token existence.

## Development

```bash
# Run tests
bun test

# Watch mode
bun test --watch
```

## Related Repositories

- [astro-asso](https://github.com/info-evry/astro-asso) - Main association website
- [astro-ndi](https://github.com/info-evry/astro-ndi) - NDI registration platform
- [astro-join](https://github.com/info-evry/astro-join) - Membership portal
- [astro-knowledge](https://github.com/info-evry/astro-knowledge) - Shared content

## License

MIT - Asso Info Evry
