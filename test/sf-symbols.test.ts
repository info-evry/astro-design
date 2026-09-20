import { describe, expect, it } from 'bun:test';
import { replaceShortcodes, shouldTransformId } from '../src/integrations/sf-symbols';

const map = new Map([['gear', '\u{100000}'], ['archivebox', '\u{100001}']]);

describe('shouldTransformId', () => {
  it('accepts astro, html, jsx/tsx and client js/ts modules', () => {
    for (const id of ['/p/src/pages/admin.astro', '/p/src/client/admin/archives.js', '/p/src/scripts/tabs.ts', '/p/dist/index.html', '/p/x.tsx']) {
      expect(shouldTransformId(id)).toBe(true);
    }
  });
  it('strips query strings before testing the extension', () => {
    expect(shouldTransformId('/p/src/pages/admin.astro?astro&type=script&index=0&lang.ts')).toBe(true);
  });
  it('rejects css, json and node_modules', () => {
    expect(shouldTransformId('/p/src/index.css')).toBe(false);
    expect(shouldTransformId('/p/src/symbols/sfsymbols.json')).toBe(false);
    expect(shouldTransformId('/p/node_modules/vite/dist/x.js')).toBe(false);
  });
});

describe('replaceShortcodes', () => {
  it('replaces known symbols in template literals and keeps unknown ones', () => {
    const out = replaceShortcodes("`<span class=\"sf-symbol\">@sfs:gear@</span> @sfs:nope@`", map);
    expect(out).toContain('\u{100000}');
    expect(out).toContain('@sfs:nope@');
  });
});
