#!/usr/bin/env bun
/**
 * Color Scheme Generator for Info Evry Design System
 *
 * Generates a complete color scheme from a single primary color.
 * Usage: bun run tools/generate-colors.ts [hex-color] [--output path]
 *
 * Example: bun run tools/generate-colors.ts "#0ea5e9"
 */

// Color manipulation utilities

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface ColorScheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  cyan: string;
  indigo: string;
  gradientPrimary: string;
  gradientBlue: string;
  gradientBlueIntense: string;
  gradientAccent: string;
  glowPrimary: string;
  glowBlue: string;
  glowCyan: string;
  themeColor: string;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNorm = h / 360;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/**
 * Lighten a color by a percentage
 */
function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(1, hsl.l + percent);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Darken a color by a percentage
 */
function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l - percent);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Saturate a color by a percentage
 */
function saturate(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  hsl.s = Math.min(1, hsl.s + percent);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Shift hue by degrees
 */
function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + degrees + 360) % 360;
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Get complementary color (opposite on color wheel)
 */
function getComplementary(hex: string): string {
  return shiftHue(hex, 180);
}

/**
 * Get analogous color (adjacent on color wheel)
 */
function getAnalogous(hex: string, degrees: number = 30): string {
  return shiftHue(hex, degrees);
}

/**
 * Get triadic colors
 */
function getTriadic(hex: string): [string, string] {
  return [shiftHue(hex, 120), shiftHue(hex, 240)];
}

/**
 * Create RGBA string from hex and alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Calculate relative luminance for contrast calculations
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if text should be white or dark on this background
 */
function shouldUseWhiteText(bgHex: string): boolean {
  const luminance = getLuminance(bgHex);
  return luminance < 0.5;
}

/**
 * Generate a complete color scheme from a primary color
 */
export function generateColorScheme(primaryHex: string): ColorScheme {
  const primary = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;

  // Validate the color
  hexToRgb(primary);

  // Generate light and dark variants
  const primaryLight = lighten(primary, 0.15);
  const primaryDark = darken(primary, 0.12);

  // Generate cyan (shifted toward cyan/teal)
  const rgb = hexToRgb(primary);
  const hsl = rgbToHsl(rgb);

  // Cyan is typically around 180-190 degrees
  const cyanHsl = { ...hsl };
  cyanHsl.h = 180 + (hsl.h % 30); // Shift toward cyan
  cyanHsl.s = Math.min(1, hsl.s * 1.1);
  cyanHsl.l = Math.min(0.85, hsl.l + 0.1);
  const cyan = rgbToHex(hslToRgb(cyanHsl));

  // Indigo is around 240-250 degrees
  const indigoHsl = { ...hsl };
  indigoHsl.h = 240 + (hsl.h % 20);
  indigoHsl.s = Math.min(1, hsl.s * 0.9);
  indigoHsl.l = hsl.l * 0.95;
  const indigo = rgbToHex(hslToRgb(indigoHsl));

  return {
    primary,
    primaryLight,
    primaryDark,
    primaryGlow: hexToRgba(primary, 0.4),
    cyan,
    indigo,
    gradientPrimary: `linear-gradient(135deg, ${primaryDark} 0%, ${primary} 50%, ${cyan} 100%)`,
    gradientBlue: `linear-gradient(135deg, ${primary} 0%, ${cyan} 100%)`,
    gradientBlueIntense: `linear-gradient(135deg, ${darken(primary, 0.15)} 0%, ${primary} 50%, ${primaryLight} 100%)`,
    gradientAccent: `linear-gradient(135deg, ${primary} 0%, ${indigo} 100%)`,
    glowPrimary: `0 0 80px ${hexToRgba(primary, 0.4)}`,
    glowBlue: `0 0 80px ${hexToRgba(primary, 0.35)}`,
    glowCyan: `0 0 80px ${hexToRgba(cyan, 0.3)}`,
    themeColor: primary,
  };
}

/**
 * Generate CSS custom properties from color scheme
 */
export function generateCSS(scheme: ColorScheme): string {
  return `/* ===========================================
   Color Tokens - Info Evry Design System
   Generated from primary color: ${scheme.primary}
   =========================================== */

:root {
  /* Background Colors */
  --color-bg: #000000;
  --color-bg-subtle: #050505;
  --color-surface: #111111;
  --color-surface-elevated: #1a1a1a;
  --color-surface-hover: #242424;
  --color-surface-form: #0d0d0d;

  /* Text Colors */
  --color-text: #ffffff;
  --color-text-secondary: #a1a1a1;
  --color-text-muted: #666666;

  /* Primary Color */
  --color-primary: ${scheme.primary};
  --color-primary-light: ${scheme.primaryLight};
  --color-primary-dark: ${scheme.primaryDark};
  --color-primary-glow: ${scheme.primaryGlow};

  /* Accent Colors */
  --color-cyan: ${scheme.cyan};
  --color-indigo: ${scheme.indigo};
  --color-green: #10b981;
  --color-orange: #f59e0b;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-success-light: rgba(16, 185, 129, 0.15);
  --color-warning: #f59e0b;
  --color-warning-light: rgba(245, 158, 11, 0.15);
  --color-error: #ef4444;
  --color-error-light: rgba(239, 68, 68, 0.15);

  /* Gradients */
  --gradient-primary: ${scheme.gradientPrimary};
  --gradient-blue: ${scheme.gradientBlue};
  --gradient-blue-intense: ${scheme.gradientBlueIntense};
  --gradient-accent: ${scheme.gradientAccent};
  --gradient-radial: radial-gradient(ellipse at center, var(--color-surface) 0%, var(--color-bg) 100%);

  /* Glow Effects */
  --glow-primary: ${scheme.glowPrimary};
  --glow-blue: ${scheme.glowBlue};
  --glow-cyan: ${scheme.glowCyan};

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.15);
  --border-hover: rgba(255, 255, 255, 0.25);
}
`;
}

/**
 * Generate JSON configuration
 */
export function generateJSON(scheme: ColorScheme): string {
  return JSON.stringify({
    primary: scheme.primary,
    primaryLight: scheme.primaryLight,
    primaryDark: scheme.primaryDark,
    cyan: scheme.cyan,
    indigo: scheme.indigo,
    themeColor: scheme.themeColor,
  }, null, 2);
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Default color if none provided
  let primaryColor = '#0ea5e9';
  let outputPath: string | null = null;
  let format: 'css' | 'json' | 'both' = 'css';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      outputPath = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      format = args[++i] as 'css' | 'json' | 'both';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Color Scheme Generator for Info Evry Design System

Usage: bun run tools/generate-colors.ts [color] [options]

Arguments:
  color           Primary color in hex format (e.g., #0ea5e9 or 0ea5e9)

Options:
  --output, -o    Output file path (default: stdout)
  --format, -f    Output format: css, json, or both (default: css)
  --help, -h      Show this help message

Examples:
  bun run tools/generate-colors.ts "#0ea5e9"
  bun run tools/generate-colors.ts "#e91e63" --output src/tokens/colors.css
  bun run tools/generate-colors.ts "#4caf50" --format json
`);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      primaryColor = arg;
    }
  }

  try {
    const scheme = generateColorScheme(primaryColor);

    console.log(`\nGenerated color scheme from: ${scheme.primary}`);
    console.log(`  Primary Light: ${scheme.primaryLight}`);
    console.log(`  Primary Dark:  ${scheme.primaryDark}`);
    console.log(`  Cyan:          ${scheme.cyan}`);
    console.log(`  Indigo:        ${scheme.indigo}`);
    console.log('');

    const css = generateCSS(scheme);
    const json = generateJSON(scheme);

    if (outputPath) {
      if (format === 'css' || format === 'both') {
        const cssPath = format === 'both' ? outputPath.replace(/\.\w+$/, '.css') : outputPath;
        await Bun.write(cssPath, css);
        console.log(`CSS written to: ${cssPath}`);
      }
      if (format === 'json' || format === 'both') {
        const jsonPath = format === 'both' ? outputPath.replace(/\.\w+$/, '.json') : outputPath;
        await Bun.write(jsonPath, json);
        console.log(`JSON written to: ${jsonPath}`);
      }
    } else {
      console.log(format === 'json' ? json : css);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
