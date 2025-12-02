/**
 * Tests for the color scheme generator
 */

import { describe, test, expect } from 'vitest';
import { generateColorScheme, generateCSS, generateJSON } from '../tools/generate-colors.js';

describe('generateColorScheme', () => {
  test('generates scheme from valid hex color with #', () => {
    const scheme = generateColorScheme('#0ea5e9');

    expect(scheme.primary).toBe('#0ea5e9');
    expect(scheme.primaryLight).toBeTruthy();
    expect(scheme.primaryDark).toBeTruthy();
    expect(scheme.cyan).toBeTruthy();
    expect(scheme.indigo).toBeTruthy();
  });

  test('generates scheme from valid hex color without #', () => {
    const scheme = generateColorScheme('0ea5e9');

    expect(scheme.primary).toBe('#0ea5e9');
  });

  test('throws error for invalid hex color', () => {
    expect(() => generateColorScheme('invalid')).toThrow('Invalid hex color');
    expect(() => generateColorScheme('#gg0000')).toThrow('Invalid hex color');
  });

  test('primaryLight is lighter than primary', () => {
    const scheme = generateColorScheme('#0ea5e9');

    // Convert to RGB and check luminance (simplified check)
    const primaryMatch = scheme.primary.match(/[a-f\d]{2}/gi)!;
    const lightMatch = scheme.primaryLight.match(/[a-f\d]{2}/gi)!;

    const primarySum = primaryMatch.reduce((sum, hex) => sum + parseInt(hex, 16), 0);
    const lightSum = lightMatch.reduce((sum, hex) => sum + parseInt(hex, 16), 0);

    expect(lightSum).toBeGreaterThan(primarySum);
  });

  test('primaryDark is darker than primary', () => {
    const scheme = generateColorScheme('#0ea5e9');

    const primaryMatch = scheme.primary.match(/[a-f\d]{2}/gi)!;
    const darkMatch = scheme.primaryDark.match(/[a-f\d]{2}/gi)!;

    const primarySum = primaryMatch.reduce((sum, hex) => sum + parseInt(hex, 16), 0);
    const darkSum = darkMatch.reduce((sum, hex) => sum + parseInt(hex, 16), 0);

    expect(darkSum).toBeLessThan(primarySum);
  });

  test('generates valid RGBA for glow', () => {
    const scheme = generateColorScheme('#0ea5e9');

    expect(scheme.primaryGlow).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
  });

  test('generates valid gradient strings', () => {
    const scheme = generateColorScheme('#0ea5e9');

    expect(scheme.gradientPrimary).toContain('linear-gradient');
    expect(scheme.gradientBlue).toContain('linear-gradient');
    expect(scheme.gradientAccent).toContain('linear-gradient');
  });

  test('generates valid glow strings', () => {
    const scheme = generateColorScheme('#0ea5e9');

    expect(scheme.glowPrimary).toContain('0 0 80px');
    expect(scheme.glowBlue).toContain('rgba');
    expect(scheme.glowCyan).toContain('rgba');
  });

  test('themeColor matches primary', () => {
    const scheme = generateColorScheme('#ff5722');

    expect(scheme.themeColor).toBe(scheme.primary);
  });

  test('works with different colors', () => {
    const colors = ['#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

    for (const color of colors) {
      const scheme = generateColorScheme(color);
      expect(scheme.primary.toLowerCase()).toBe(color.toLowerCase());
      expect(scheme.primaryLight).toBeTruthy();
      expect(scheme.primaryDark).toBeTruthy();
    }
  });

  test('handles edge case colors', () => {
    // Pure white
    const white = generateColorScheme('#ffffff');
    expect(white.primary).toBe('#ffffff');

    // Pure black
    const black = generateColorScheme('#000000');
    expect(black.primary).toBe('#000000');

    // Pure red
    const red = generateColorScheme('#ff0000');
    expect(red.primary).toBe('#ff0000');
  });
});

describe('generateCSS', () => {
  test('generates valid CSS with custom properties', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const css = generateCSS(scheme);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('--color-primary-light:');
    expect(css).toContain('--color-primary-dark:');
    expect(css).toContain('--gradient-primary:');
    expect(css).toContain('--glow-primary:');
  });

  test('includes the primary color in output', () => {
    const scheme = generateColorScheme('#e91e63');
    const css = generateCSS(scheme);

    expect(css).toContain('#e91e63');
  });

  test('includes background colors', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const css = generateCSS(scheme);

    expect(css).toContain('--color-bg:');
    expect(css).toContain('--color-surface:');
  });

  test('includes semantic colors', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const css = generateCSS(scheme);

    expect(css).toContain('--color-success:');
    expect(css).toContain('--color-warning:');
    expect(css).toContain('--color-error:');
  });

  test('includes border tokens', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const css = generateCSS(scheme);

    expect(css).toContain('--border-subtle:');
    expect(css).toContain('--border-default:');
    expect(css).toContain('--border-hover:');
  });
});

describe('generateJSON', () => {
  test('generates valid JSON', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const json = generateJSON(scheme);

    const parsed = JSON.parse(json);
    expect(parsed.primary).toBe('#0ea5e9');
  });

  test('includes essential color values', () => {
    const scheme = generateColorScheme('#0ea5e9');
    const json = generateJSON(scheme);

    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('primary');
    expect(parsed).toHaveProperty('primaryLight');
    expect(parsed).toHaveProperty('primaryDark');
    expect(parsed).toHaveProperty('cyan');
    expect(parsed).toHaveProperty('indigo');
    expect(parsed).toHaveProperty('themeColor');
  });
});

describe('color utility functions', () => {
  test('hex colors are valid format', () => {
    const scheme = generateColorScheme('#0ea5e9');

    const hexRegex = /^#[0-9a-f]{6}$/i;
    expect(scheme.primary).toMatch(hexRegex);
    expect(scheme.primaryLight).toMatch(hexRegex);
    expect(scheme.primaryDark).toMatch(hexRegex);
    expect(scheme.cyan).toMatch(hexRegex);
    expect(scheme.indigo).toMatch(hexRegex);
  });
});
