/**
 * SF Symbols Integration Utilities Tests
 * Tests for the exported utility functions from sf-symbols integration
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { SFS_PATTERN, loadSymbolsMap, replaceShortcodes } from '../src/integrations/sf-symbols';

describe('SFS_PATTERN', () => {
  test('should match simple shortcode', () => {
    expect('@sfs:house@'.match(SFS_PATTERN)).toBeTruthy();
  });

  test('should match shortcode with dot notation', () => {
    expect('@sfs:house.fill@'.match(SFS_PATTERN)).toBeTruthy();
    expect('@sfs:checkmark.circle.fill@'.match(SFS_PATTERN)).toBeTruthy();
  });

  test('should match shortcode with numbers', () => {
    expect('@sfs:person.2.fill@'.match(SFS_PATTERN)).toBeTruthy();
    expect('@sfs:person.3@'.match(SFS_PATTERN)).toBeTruthy();
  });

  test('should match shortcode with dashes', () => {
    expect('@sfs:some-symbol@'.match(SFS_PATTERN)).toBeTruthy();
  });

  test('should not match incomplete shortcodes', () => {
    expect('@sfs:house'.match(SFS_PATTERN)).toBeFalsy();
    expect('sfs:house@'.match(SFS_PATTERN)).toBeFalsy();
    expect('@sfs:@'.match(SFS_PATTERN)).toBeFalsy();
  });

  test('should extract symbol name from shortcode', () => {
    // Use matchAll with global regex to get capture groups
    const matches = [...'@sfs:house.fill@'.matchAll(SFS_PATTERN)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('house.fill');
  });

  test('should find multiple shortcodes in text', () => {
    const text = 'Hello @sfs:house@ and @sfs:gear@ world';
    const matches = [...text.matchAll(SFS_PATTERN)];
    expect(matches).toHaveLength(2);
    expect(matches[0][1]).toBe('house');
    expect(matches[1][1]).toBe('gear');
  });
});

describe('loadSymbolsMap', () => {
  test('should return a Map', () => {
    const map = loadSymbolsMap();
    expect(map).toBeInstanceOf(Map);
  });

  test('should contain symbol entries', () => {
    const map = loadSymbolsMap();
    expect(map.size).toBeGreaterThan(0);
  });

  test('should have common symbols', () => {
    const map = loadSymbolsMap();
    expect(map.has('house')).toBe(true);
    expect(map.has('gear')).toBe(true);
    expect(map.has('star')).toBe(true);
  });

  test('symbol values should be unicode characters', () => {
    const map = loadSymbolsMap();
    const house = map.get('house');
    expect(house).toBeDefined();
    expect(typeof house).toBe('string');
    expect(house!.length).toBeGreaterThan(0);
  });
});

describe('replaceShortcodes', () => {
  let symbolsMap: Map<string, string>;

  // Load symbols once for all tests
  beforeAll(() => {
    symbolsMap = loadSymbolsMap();
  });

  test('should replace shortcode with unicode character', () => {
    const input = 'Icon: @sfs:house@';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).not.toContain('@sfs:house@');
    expect(result.startsWith('Icon: ')).toBe(true);
  });

  test('should replace multiple shortcodes', () => {
    const input = '@sfs:house@ and @sfs:gear@';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).not.toContain('@sfs:');
    expect(result).toContain(' and ');
  });

  test('should preserve text around shortcodes', () => {
    const input = 'Before @sfs:star@ After';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result.startsWith('Before ')).toBe(true);
    expect(result.endsWith(' After')).toBe(true);
  });

  test('should handle complex shortcodes', () => {
    const input = '@sfs:checkmark.circle.fill@';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).not.toContain('@sfs:');
  });

  test('should keep unknown symbols as-is', () => {
    const input = '@sfs:unknown.fake.symbol@';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).toBe('@sfs:unknown.fake.symbol@');
  });

  test('should handle empty input', () => {
    const result = replaceShortcodes('', symbolsMap);
    expect(result).toBe('');
  });

  test('should handle input without shortcodes', () => {
    const input = 'Just plain text without any icons';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).toBe(input);
  });

  test('should handle HTML with shortcodes', () => {
    const input = '<span class="icon">@sfs:house@</span>';
    const result = replaceShortcodes(input, symbolsMap);
    expect(result).toContain('<span class="icon">');
    expect(result).toContain('</span>');
    expect(result).not.toContain('@sfs:');
  });
});
