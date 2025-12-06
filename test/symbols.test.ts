/**
 * Symbols Utility Tests
 * Tests for SF Symbol lookup functions
 */

import { describe, test, expect } from 'vitest';
import { getSymbol, hasSymbol, getSymbolsMap } from '../src/utils/symbols';

describe('getSymbol', () => {
  test('should return unicode character for known symbol', () => {
    const house = getSymbol('house');
    expect(house).not.toBe('house');
    expect(house.length).toBeGreaterThan(0);
  });

  test('should return input name for unknown symbol', () => {
    const unknown = getSymbol('unknown.symbol.name');
    expect(unknown).toBe('unknown.symbol.name');
  });

  test('should handle empty string', () => {
    const empty = getSymbol('');
    expect(empty).toBe('');
  });

  test('should return correct symbols for common names', () => {
    const commonSymbols = ['house', 'gear', 'star', 'person', 'plus', 'minus'];
    for (const name of commonSymbols) {
      const char = getSymbol(name);
      expect(char).not.toBe(name);
      // SF Symbols are in the Private Use Area
      const codePoint = char.codePointAt(0);
      expect(codePoint).toBeDefined();
      expect(codePoint).toBeGreaterThan(0);
    }
  });

  test('should handle dot notation symbols', () => {
    const filled = getSymbol('house.fill');
    expect(filled).not.toBe('house.fill');
    expect(filled.length).toBeGreaterThan(0);
  });
});

describe('hasSymbol', () => {
  test('should return true for existing symbols', () => {
    expect(hasSymbol('house')).toBe(true);
    expect(hasSymbol('gear')).toBe(true);
    expect(hasSymbol('star')).toBe(true);
    expect(hasSymbol('person')).toBe(true);
  });

  test('should return false for non-existing symbols', () => {
    expect(hasSymbol('unknown.symbol')).toBe(false);
    expect(hasSymbol('fake.icon.name')).toBe(false);
    expect(hasSymbol('')).toBe(false);
  });

  test('should handle filled variants', () => {
    expect(hasSymbol('house.fill')).toBe(true);
    expect(hasSymbol('star.fill')).toBe(true);
    expect(hasSymbol('person.fill')).toBe(true);
  });

  test('should handle complex symbol names', () => {
    expect(hasSymbol('checkmark.circle.fill')).toBe(true);
    expect(hasSymbol('person.2.fill')).toBe(true);
    expect(hasSymbol('chevron.right')).toBe(true);
  });
});

describe('getSymbolsMap', () => {
  test('should return a Map instance', () => {
    const map = getSymbolsMap();
    expect(map).toBeInstanceOf(Map);
  });

  test('should contain many symbols', () => {
    const map = getSymbolsMap();
    expect(map.size).toBeGreaterThan(1000);
  });

  test('should contain common symbols', () => {
    const map = getSymbolsMap();
    expect(map.has('house')).toBe(true);
    expect(map.has('gear')).toBe(true);
    expect(map.has('star')).toBe(true);
  });

  test('symbols should be valid unicode strings', () => {
    const map = getSymbolsMap();
    let checked = 0;
    for (const [name, char] of map) {
      if (checked++ > 100) break;
      expect(typeof name).toBe('string');
      expect(typeof char).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(char.length).toBeGreaterThan(0);
    }
  });

  test('should be the same instance on multiple calls', () => {
    const map1 = getSymbolsMap();
    const map2 = getSymbolsMap();
    expect(map1).toBe(map2);
  });
});
