import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sfSymbols, loadSymbolsMap } from '../src/integrations/sf-symbols';

// Minimal view of the integration hooks we exercise
type Hooks = {
  'astro:config:setup': (ctx: { updateConfig: (c: any) => void }) => void;
  'astro:build:done': (ctx: { dir: URL }) => Promise<void>;
};

function setup() {
  const integration = sfSymbols();
  let config: any;
  (integration.hooks as unknown as Hooks)['astro:config:setup']({ updateConfig: (c) => (config = c) });
  const plugin = config.vite.plugins[0];
  plugin.configResolved();
  return { integration, plugin, hooks: integration.hooks as unknown as Hooks };
}

describe('loadSymbolsMap', () => {
  test('loads thousands of name -> glyph pairs', () => {
    const map = loadSymbolsMap();
    expect(map.size).toBeGreaterThan(5000);
    expect(map.get('gear')).toBeTruthy();
    expect(map.get('archivebox')).toBeTruthy();
  });
});

describe('vite plugin', () => {
  test('registers a pre-enforced plugin with the expected name', () => {
    const { plugin } = setup();
    expect(plugin.name).toBe('vite-plugin-sf-symbols');
    expect(plugin.enforce).toBe('pre');
  });

  test('replaces shortcodes in client js, astro and query-suffixed ids', () => {
    const { plugin } = setup();
    const gear = loadSymbolsMap().get('gear')!;
    for (const id of ['/p/src/client/a.js', '/p/src/pages/x.astro', '/p/src/pages/x.astro?astro&type=script&index=0&lang.ts']) {
      const out = plugin.transform("`<i>@sfs:gear@</i>`", id);
      expect(out.code).toContain(gear);
      expect(out.code).not.toContain('@sfs:');
    }
  });

  test('is a no-op for css, json, node_modules and code without shortcodes', () => {
    const { plugin } = setup();
    expect(plugin.transform('@sfs:gear@', '/p/src/a.css')).toBeNull();
    expect(plugin.transform('@sfs:gear@', '/p/node_modules/x/a.js')).toBeNull();
    expect(plugin.transform('const a = 1', '/p/src/a.js')).toBeNull();
  });

  test('keeps unknown symbols verbatim and warns', () => {
    const { plugin } = setup();
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    const out = plugin.transform('@sfs:definitely.not.a.symbol@', '/p/src/a.js');
    expect(out.code).toBe('@sfs:definitely.not.a.symbol@');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('handles several shortcodes on one line (global regex state is reset)', () => {
    const { plugin } = setup();
    const out1 = plugin.transform('@sfs:gear@ @sfs:gear@', '/p/src/a.js');
    const out2 = plugin.transform('@sfs:gear@', '/p/src/b.js');
    expect(out1.code).not.toContain('@sfs:');
    expect(out2.code).not.toContain('@sfs:');
  });
});

describe('astro:build:done post-processing', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'sfs-'));
    spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  test('rewrites shortcodes in nested html files and leaves others alone', async () => {
    const { hooks } = setup();
    mkdirSync(join(dir, 'a/b'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<i>@sfs:gear@</i>');
    writeFileSync(join(dir, 'a/b/page.html'), '<i>@sfs:archivebox@ @sfs:nope.nope@</i>');
    writeFileSync(join(dir, 'a/data.txt'), '@sfs:gear@');
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    await hooks['astro:build:done']({ dir: pathToFileURL(dir + '/') });
    const map = loadSymbolsMap();
    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toBe(`<i>${map.get('gear')}</i>`);
    expect(readFileSync(join(dir, 'a/b/page.html'), 'utf-8')).toBe(`<i>${map.get('archivebox')} @sfs:nope.nope@</i>`);
    expect(readFileSync(join(dir, 'a/data.txt'), 'utf-8')).toBe('@sfs:gear@');
    expect(warn).toHaveBeenCalled();
  });

  test('does nothing for a missing or empty output directory', async () => {
    const { hooks } = setup();
    await hooks['astro:build:done']({ dir: pathToFileURL(join(dir, 'missing') + '/') });
    await hooks['astro:build:done']({ dir: pathToFileURL(dir + '/') });
  });
});
