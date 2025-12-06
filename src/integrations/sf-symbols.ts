/**
 * SF Symbols Astro Integration
 *
 * Replaces @sfs:symbol.name@ shortcodes with actual Unicode characters.
 * Handles both static shortcodes (at build time) and dynamic ones (after SSR).
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
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
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

// Find all HTML files recursively in a directory
function findHtmlFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (entry.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  scan(dir);
  return files;
}

// Vite plugin for SF Symbols replacement (handles static shortcodes)
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
  };
}

// Astro integration
export function sfSymbols(): AstroIntegration {
  let symbolsMap: Map<string, string>;

  return {
    name: 'astro-sf-symbols',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        symbolsMap = loadSymbolsMap();
        updateConfig({
          vite: {
            plugins: [sfSymbolsVitePlugin()],
          },
        });
      },

      // Post-process all generated HTML files after build
      'astro:build:done': async ({ dir }) => {
        const distDir = fileURLToPath(dir);
        console.log(`[sf-symbols] Build done, checking ${distDir}`);

        const htmlFiles = findHtmlFiles(distDir);

        console.log(`[sf-symbols] Post-processing ${htmlFiles.length} HTML files`);

        // Ensure symbols map is loaded
        if (!symbolsMap || symbolsMap.size === 0) {
          symbolsMap = loadSymbolsMap();
          console.log(`[sf-symbols] Loaded ${symbolsMap.size} symbol mappings (post-build)`);
        }

        let totalReplacements = 0;

        for (const file of htmlFiles) {
          const content = readFileSync(file, 'utf-8');

          // Reset regex lastIndex before testing
          SFS_PATTERN.lastIndex = 0;

          // Check if file contains shortcodes
          if (!SFS_PATTERN.test(content)) {
            continue;
          }

          // Reset regex lastIndex again for replacement
          SFS_PATTERN.lastIndex = 0;

          // Count replacements
          let fileReplacements = 0;
          const processed = content.replace(SFS_PATTERN, (match, symbolName) => {
            const char = symbolsMap.get(symbolName);
            if (char) {
              fileReplacements++;
              return char;
            }
            console.warn(`[sf-symbols] Unknown symbol: ${symbolName} in ${file}`);
            return match;
          });

          if (fileReplacements > 0) {
            writeFileSync(file, processed);
            totalReplacements += fileReplacements;
          }
        }

        if (totalReplacements > 0) {
          console.log(`[sf-symbols] Replaced ${totalReplacements} shortcodes in HTML files`);
        }
      },
    },
  };
}

export default sfSymbols;

// Export utilities for use in other scripts
export { SFS_PATTERN, loadSymbolsMap, replaceShortcodes };
