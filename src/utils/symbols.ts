/**
 * SF Symbols Utility - Server-side symbol lookup
 *
 * Provides a function to look up SF Symbol Unicode characters by name.
 * This is used for dynamic symbol rendering in Astro components where
 * build-time shortcode replacement doesn't work (e.g., template literals).
 *
 * Uses static JSON import for Cloudflare Workers compatibility.
 *
 * Usage:
 *   import { getSymbol } from '../utils/symbols';
 *   const icon = getSymbol('house'); // Returns '􀎞' or the input if not found
 */

// Static import - bundled at build time, works in Cloudflare Workers
import symbolsData from '../symbols/sfsymbols.json';

// Build the map once at module load time
const symbolsMap: Map<string, string> = new Map(symbolsData as [string, string][]);

/**
 * Get the Unicode character for an SF Symbol name
 * @param name - The SF Symbol name (e.g., 'house', 'info.circle')
 * @returns The Unicode character, or the input name if not found
 */
export function getSymbol(name: string): string {
  return symbolsMap.get(name) || name;
}

/**
 * Check if a symbol name exists in the mapping
 * @param name - The SF Symbol name to check
 * @returns true if the symbol exists
 */
export function hasSymbol(name: string): boolean {
  return symbolsMap.has(name);
}

/**
 * Get the symbols map (for advanced use cases)
 */
export function getSymbolsMap(): Map<string, string> {
  return symbolsMap;
}
