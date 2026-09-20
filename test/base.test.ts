/**
 * Base-path Utility Tests
 */

import { describe, test, expect } from 'vitest';
import { withBase } from '../src/utils/base';

describe('withBase', () => {
  test('joins a base path and a leading-slash path without doubling slashes', () => {
    expect(withBase('/favicon.svg', '/nuit-de-linfo')).toBe('/nuit-de-linfo/favicon.svg');
  });

  test('handles a base with a trailing slash', () => {
    expect(withBase('/favicon.svg', '/nuit-de-linfo/')).toBe('/nuit-de-linfo/favicon.svg');
  });

  test('handles a path without a leading slash', () => {
    expect(withBase('favicon.svg', '/nuit-de-linfo')).toBe('/nuit-de-linfo/favicon.svg');
  });

  test('returns the path unchanged when base is root', () => {
    expect(withBase('/favicon.svg', '/')).toBe('/favicon.svg');
  });

  test('returns the path unchanged when base is empty', () => {
    expect(withBase('/favicon.svg', '')).toBe('/favicon.svg');
  });
});
