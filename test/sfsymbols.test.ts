/**
 * Tests for SF Symbols integration
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const designRoot = join(__dirname, '..');

describe('SF Symbols JSON mapping', () => {
  const symbolsPath = join(designRoot, 'src/symbols/sfsymbols.json');
  let symbolsMap: [string, string][];

  test('symbols JSON file exists and is valid', () => {
    const content = readFileSync(symbolsPath, 'utf-8');
    symbolsMap = JSON.parse(content);

    expect(Array.isArray(symbolsMap)).toBe(true);
    expect(symbolsMap.length).toBeGreaterThan(0);
  });

  test('each symbol entry is a [name, char] tuple', () => {
    const content = readFileSync(symbolsPath, 'utf-8');
    symbolsMap = JSON.parse(content);

    for (const entry of symbolsMap.slice(0, 100)) {
      expect(Array.isArray(entry)).toBe(true);
      expect(entry).toHaveLength(2);
      expect(typeof entry[0]).toBe('string');
      expect(typeof entry[1]).toBe('string');
      expect(entry[0].length).toBeGreaterThan(0);
      expect(entry[1].length).toBeGreaterThan(0);
    }
  });

  test('common symbols are present', () => {
    const content = readFileSync(symbolsPath, 'utf-8');
    symbolsMap = JSON.parse(content);

    const lookup = new Map(symbolsMap);

    // Check for commonly used symbols
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

  test('symbols used in MobileNav are present', () => {
    const content = readFileSync(symbolsPath, 'utf-8');
    symbolsMap = JSON.parse(content);

    const lookup = new Map(symbolsMap);

    // Symbols used in the MobileNav across sites
    const usedSymbols = [
      'house',
      'moon.stars',
      'person.3',
      'person.badge.plus',
      'info.circle',
      'book',
      'person.text.rectangle',
      'plus.circle.fill',
    ];

    for (const name of usedSymbols) {
      expect(lookup.has(name), `Symbol "${name}" should exist (used in MobileNav)`).toBe(true);
    }
  });

  test('symbol characters are valid unicode', () => {
    const content = readFileSync(symbolsPath, 'utf-8');
    symbolsMap = JSON.parse(content);

    // Check a sample of symbols have valid unicode characters
    for (const [name, char] of symbolsMap.slice(0, 50)) {
      // Characters should be unicode symbols (codepoint > 0x1000 typically for SF Symbols)
      const codePoint = char.codePointAt(0);
      expect(codePoint, `Symbol "${name}" should have valid codepoint`).toBeDefined();
      expect(codePoint).toBeGreaterThan(0);
    }
  });
});

describe('Font file', () => {
  test('Cupertino-Pro font file exists', () => {
    const fontPath = join(designRoot, 'src/fonts/Cupertino-Pro.woff2');
    const content = readFileSync(fontPath);

    expect(content.length).toBeGreaterThan(0);
    // woff2 files start with 'wOF2' magic bytes
    expect(content[0]).toBe(0x77); // 'w'
    expect(content[1]).toBe(0x4F); // 'O'
    expect(content[2]).toBe(0x46); // 'F'
    expect(content[3]).toBe(0x32); // '2'
  });
});

describe('Subset font tool', () => {
  test('subset-font.ts script exists', () => {
    const scriptPath = join(designRoot, 'tools/subset-font.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    expect(content).toContain('pyftsubset');
    expect(content).toContain('SFSymbol');
    expect(content).toContain('sfsymbols.json');
  });
});
