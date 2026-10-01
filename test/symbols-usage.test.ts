import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import symbols from '../src/symbols/sfsymbols.json';

const names = new Set((symbols as [string, string][]).map(([n]) => n));
const projectsDir = resolve(import.meta.dir, '../..');
const roots = ['astro-ndi', 'astro-join', 'astro-asso', 'astro-design', 'astro-orga']
  .map((p) => join(projectsDir, p, 'src'))
  .filter(existsSync);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(astro|js|mjs|ts|tsx|jsx|html)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = roots.flatMap((r) => walk(r));
// Documentation comments legitimately mention the placeholder name.
const DOC_PLACEHOLDERS = new Set(['symbol.name']);

function collect(re: RegExp): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of files) {
    const text = readFileSync(file, 'utf-8');
    for (const m of text.matchAll(re)) {
      const list = found.get(m[1]) ?? [];
      list.push(file.replace(projectsDir + '/', ''));
      found.set(m[1], list);
    }
  }
  return found;
}

describe('SF Symbols usage across the platform', () => {
  test('sources were discovered', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  test('every @sfs:name@ shortcode exists in the symbol table', () => {
    const missing = [...collect(/@sfs:([a-zA-Z0-9._-]+)@/g)]
      .filter(([n]) => !names.has(n) && !DOC_PLACEHOLDERS.has(n))
      .map(([n, f]) => `${n} (${[...new Set(f)].join(', ')})`);
    expect(missing).toEqual([]);
  });

  test('every getSymbol() literal and icon: prop exists in the symbol table', () => {
    const used = new Map([
      ...collect(/getSymbol\(\s*['"]([a-zA-Z0-9._-]+)['"]\s*\)/g),
      ...collect(/\bicon:\s*['"]([a-zA-Z0-9._-]+)['"]/g),
      ...collect(/ctaIcon=["{']+([a-zA-Z0-9._-]+)/g),
    ]);
    const missing = [...used].filter(([n]) => !names.has(n)).map(([n, f]) => `${n} (${[...new Set(f)].join(', ')})`);
    expect(missing).toEqual([]);
  });

  test('client JS modules that use shortcodes are covered by the transform id filter', async () => {
    const { shouldTransformId } = await import('../src/integrations/sf-symbols');
    const clientWithShortcodes = files.filter(
      (f) => /\.(js|mjs|ts)$/.test(f) && /@sfs:[a-z0-9.]+@/.test(readFileSync(f, 'utf-8')) && !f.includes('astro-design/src/integrations'),
    );
    for (const f of clientWithShortcodes) expect(shouldTransformId(f)).toBe(true);
  });

  test('built bundles never contain a literal shortcode', () => {
    const leaks: string[] = [];
    for (const site of ['astro-ndi', 'astro-join', 'astro-asso']) {
      const dist = join(projectsDir, site, 'dist');
      if (!existsSync(dist)) continue; // sites are built in CI before this runs only if present
      const scan = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) scan(full);
          else if (/\.(js|mjs|html)$/.test(entry) && /@sfs:[a-z0-9.]+@/.test(readFileSync(full, 'utf-8'))) leaks.push(full.replace(projectsDir + '/', ''));
        }
      };
      scan(dist);
    }
    expect(leaks).toEqual([]);
  });
});
