/**
 * SF Symbols Astro Integration
 *
 * Replaces @sfs:symbol.name@ shortcodes with actual Unicode characters.
 * Works as a Vite plugin that transforms HTML/Astro files during build.
 *
 * Usage in astro.config.mjs:
 *   import { sfSymbols } from './design/src/integrations/sf-symbols';
 *   export default defineConfig({
 *     integrations: [sfSymbols()],
 *   });
 *
 * Then use shortcodes in your HTML:
 *   <span class="sfs" data-sfs="@sfs:checkmark@"></span>
 *   <span class="sfs sfs-lg" data-sfs="@sfs:pencil@"></span>
 */

import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Shortcode pattern: @sfs:symbol.name@
const SFS_PATTERN = /@sfs:([a-zA-Z0-9._-]+)@/g;

// Load the symbols mapping
function loadSymbolsMap(): Map<string, string> {
  const symbolsPath = resolve(__dirname, '../symbols/sfsymbols.json');

  if (!existsSync(symbolsPath)) {
    console.warn('[sf-symbols] Warning: sfsymbols.json not found at', symbolsPath);
    return new Map();
  }

  try {
    const content = readFileSync(symbolsPath, 'utf-8');
    const entries = JSON.parse(content) as [string, string][];
    return new Map(entries);
  } catch (error) {
    console.error('[sf-symbols] Error loading sfsymbols.json:', error);
    return new Map();
  }
}

// Replace shortcodes with Unicode characters
function replaceShortcodes(content: string, symbolsMap: Map<string, string>): string {
  return content.replace(SFS_PATTERN, (match, symbolName) => {
    const char = symbolsMap.get(symbolName);
    if (char) {
      return char;
    }
    console.warn(`[sf-symbols] Unknown symbol: ${symbolName}`);
    return match; // Keep original if not found
  });
}

// Vite plugin for SF Symbols replacement
function sfSymbolsVitePlugin(): Plugin {
  let symbolsMap: Map<string, string>;

  return {
    name: 'vite-plugin-sf-symbols',
    enforce: 'pre',

    configResolved() {
      symbolsMap = loadSymbolsMap();
      console.log(`[sf-symbols] Loaded ${symbolsMap.size} symbol mappings`);
    },

    transform(code, id) {
      // Only process Astro and HTML files
      if (!id.endsWith('.astro') && !id.endsWith('.html') && !id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null;
      }

      // Skip if no shortcodes present
      if (!SFS_PATTERN.test(code)) {
        return null;
      }

      // Reset regex lastIndex
      SFS_PATTERN.lastIndex = 0;

      const transformed = replaceShortcodes(code, symbolsMap);
      return {
        code: transformed,
        map: null,
      };
    },

    // Also transform the final HTML output
    transformIndexHtml(html) {
      if (!SFS_PATTERN.test(html)) {
        return html;
      }
      SFS_PATTERN.lastIndex = 0;
      return replaceShortcodes(html, symbolsMap);
    },
  };
}

// Astro integration
export function sfSymbols(): AstroIntegration {
  return {
    name: 'astro-sf-symbols',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [sfSymbolsVitePlugin()],
          },
        });
      },
    },
  };
}

export default sfSymbols;

// Export utilities for use in other scripts
export { SFS_PATTERN, loadSymbolsMap, replaceShortcodes };
