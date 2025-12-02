/**
 * Tests for SF Symbols integration
 *
 * Uses direct imports instead of fs.readFileSync to work in both
 * Bun and Cloudflare Workers test environments.
 */

import { describe, test, expect } from 'vitest';
import symbolsMap from '../src/symbols/sfsymbols.json';

describe('SF Symbols JSON mapping', () => {
  test('symbols map is valid array of tuples', () => {
    expect(Array.isArray(symbolsMap)).toBe(true);
    expect(symbolsMap.length).toBeGreaterThan(0);
  });

  test('each symbol entry is a [name, char] tuple', () => {
    for (const entry of (symbolsMap as [string, string][]).slice(0, 100)) {
      expect(Array.isArray(entry)).toBe(true);
      expect(entry).toHaveLength(2);
      expect(typeof entry[0]).toBe('string');
      expect(typeof entry[1]).toBe('string');
      expect(entry[0].length).toBeGreaterThan(0);
      expect(entry[1].length).toBeGreaterThan(0);
    }
  });

  test('common symbols are present', () => {
    const lookup = new Map(symbolsMap as [string, string][]);

    const commonSymbols = [
      'house',
      'house.fill',
      'person',
      'person.fill',
      'gear',
      'plus',
      'minus',
      'star',
      'star.fill',
      'book',
      'folder',
      'paperplane',
    ];

    for (const name of commonSymbols) {
      expect(lookup.has(name), `Symbol "${name}" should exist`).toBe(true);
    }
  });

  test('symbols used across all sites are present', () => {
    const lookup = new Map(symbolsMap as [string, string][]);

    // Symbols used in MobileNav and components across all sites
    const usedSymbols = [
      // MobileNav
      'house',
      'moon.stars',
      'person.3',
      'person.badge.plus',
      'info.circle',
      'book',
      'person.text.rectangle',
      'plus.circle.fill',
      // astro-asso components
      'person.2.fill',
      'checkmark.circle.fill',
      'calendar.badge.clock',
      'book.fill',
      'folder.fill',
      'bubble.left.fill',
      'paperplane.fill',
      'chevron.right',
      'checkmark',
      'envelope.fill',
      'clock.fill',
      'star.fill',
      'calendar',
    ];

    for (const name of usedSymbols) {
      expect(lookup.has(name), `Symbol "${name}" should exist (used in components)`).toBe(true);
    }
  });

  test('symbol characters are valid unicode', () => {
    // Check a sample of symbols have valid unicode characters
    for (const [name, char] of (symbolsMap as [string, string][]).slice(0, 50)) {
      const codePoint = char.codePointAt(0);
      expect(codePoint, `Symbol "${name}" should have valid codepoint`).toBeDefined();
      expect(codePoint).toBeGreaterThan(0);
    }
  });
});
