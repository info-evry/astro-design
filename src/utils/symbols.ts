/**
 * SF Symbols Utility - Server-side symbol lookup
 *
 * Provides a function to look up SF Symbol Unicode characters by name.
 * This is used for dynamic symbol rendering in Astro components where
 * build-time shortcode replacement doesn't work (e.g., template literals).
 *
 * Usage:
 *   import { getSymbol } from '../utils/symbols';
 *   const icon = getSymbol('house'); // Returns '􀎞' or the input if not found
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cache the symbols map
let symbolsMap: Map<string, string> | null = null;

/**
 * Load the symbols map from sfsymbols.json
 */
function loadSymbolsMap(): Map<string, string> {
  if (symbolsMap) {
    return symbolsMap;
  }

  const symbolsPath = resolve(__dirname, '../symbols/sfsymbols.json');

  if (!existsSync(symbolsPath)) {
    console.warn('[symbols] Warning: sfsymbols.json not found at', symbolsPath);
    symbolsMap = new Map();
    return symbolsMap;
  }

  try {
    const content = readFileSync(symbolsPath, 'utf-8');
    const entries = JSON.parse(content) as [string, string][];
    symbolsMap = new Map(entries);
    return symbolsMap;
  } catch (error) {
    console.error('[symbols] Error loading sfsymbols.json:', error);
    symbolsMap = new Map();
    return symbolsMap;
  }
}

/**
 * Get the Unicode character for an SF Symbol name
 * @param name - The SF Symbol name (e.g., 'house', 'info.circle')
 * @returns The Unicode character, or the input name if not found
 */
export function getSymbol(name: string): string {
  const map = loadSymbolsMap();
  return map.get(name) || name;
}

/**
 * Check if a symbol name exists in the mapping
 * @param name - The SF Symbol name to check
 * @returns true if the symbol exists
 */
export function hasSymbol(name: string): boolean {
  const map = loadSymbolsMap();
  return map.has(name);
}

export { loadSymbolsMap };
