#!/usr/bin/env bun
/**
 * SF Symbols Font Subsetting Tool
 *
 * Scans Astro files for SFSymbol usage and creates a subset font
 * containing only the characters actually used.
 *
 * Prerequisites:
 *   pip install fonttools brotli
 *
 * Usage:
 *   bun run tools/subset-font.ts [project-path]
 *
 * Example:
 *   bun run tools/subset-font.ts ../astro-ndi
 */

import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import symbolsMap from "../src/symbols/sfsymbols.json";

// Matches SFSymbol component usage in Astro/TSX/JSX files.
// Example matched strings:
//   <SFSymbol name="symbolName" ...>
//   <SFSymbol ... name={'symbolName'} ...>
// The first capture group ([^"'}]+) extracts the symbol name value.
const SFSYMBOL_NAME_REGEX = /<SFSymbol[^>]*name=["'{]([^"'}]+)["'}]/g;

const __dirname = dirname(fileURLToPath(import.meta.url));
const designRoot = resolve(__dirname, "..");


// Convert symbols map to lookup
const symbolsLookup = new Map<string, string>(
  (symbolsMap as [string, string][]).map(([name, char]) => [name, char])
);

async function findAstroFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          await scan(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".astro") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Directory might not exist
      console.warn(`Warning: Could not scan directory '${currentDir}':`, e);
    }
  }

  await scan(dir);
  return files;
}

// Admin action symbols that are always needed (used inline in JS templates)
const ADMIN_SYMBOLS = [
  'pencil',           // Edit action
  'trash',            // Delete action
  'trash.fill',       // Delete action (filled)
  'xmark',            // Close/remove
  'xmark.circle',     // Close/remove (circled)
  'xmark.circle.fill', // Close/remove (filled)
  'checkmark',        // Approve/confirm
  'checkmark.circle', // Approve (circled)
  'checkmark.circle.fill', // Approve (filled)
  'plus',             // Add
  'plus.circle',      // Add (circled)
  'plus.circle.fill', // Add (filled)
  'chevron.right',    // Disclosure indicator
  'chevron.down',     // Disclosure indicator
  'chevron.left',     // Back
  'chevron.up',       // Collapse
  'gear',             // Settings
  'person',           // User
  'person.fill',      // User (filled)
];

async function extractSymbolNames(files: string[]): Promise<Set<string>> {
  const symbols = new Set<string>();

  // Always include admin action symbols
  for (const sym of ADMIN_SYMBOLS) {
    symbols.add(sym);
  }

  // Regex to match 'icon' property in MobileNav items
  const ICON_PROP_REGEX = /icon:\s*["']([^"']+)["']/g;
  const CTA_ICON_PATTERN = /ctaIcon=["'{]([^"'}]+)["'}]/g;

  for (const file of files) {
    try {
      const content = await Bun.file(file).text();

      // Match SFSymbol component usage: <SFSymbol name="..." or name={"..."}
      const matches = content.matchAll(SFSYMBOL_NAME_REGEX);
      for (const match of matches) {
        symbols.add(match[1]);
      }

      // Also match symbol prop in MobileNav items
      const iconMatches = content.matchAll(ICON_PROP_REGEX);
      for (const match of iconMatches) {
        symbols.add(match[1]);
      }

      // Match ctaIcon attribute in MobileNav: ctaIcon="..." or ctaIcon={"..."}
      const ctaIconMatches = content.matchAll(CTA_ICON_PATTERN);
      for (const match of ctaIconMatches) {
        symbols.add(match[1]);
      }
    } catch (e) {
      console.warn(`Warning: Could not read ${file}`);
    }
  }

  return symbols;
}

/**
 * Generate Latin character ranges for text rendering
 * Includes ASCII, Latin-1 Supplement, and Latin Extended-A
 */
function getLatinChars(): string {
  const chars: string[] = [];

  // ASCII printable (0x0020-0x007E)
  for (let i = 0x0020; i <= 0x007E; i++) {
    chars.push(String.fromCharCode(i));
  }

  // Latin-1 Supplement (0x00A0-0x00FF) - includes é, è, à, ç, etc.
  for (let i = 0x00A0; i <= 0x00FF; i++) {
    chars.push(String.fromCharCode(i));
  }

  // Latin Extended-A (0x0100-0x017F) - includes œ, Œ, etc.
  for (let i = 0x0100; i <= 0x017F; i++) {
    chars.push(String.fromCharCode(i));
  }

  return chars.join("");
}

function symbolsToChars(symbolNames: Set<string>, includeLatinText: boolean = false): string {
  const chars: string[] = [];

  // Include Latin text characters if requested
  if (includeLatinText) {
    chars.push(getLatinChars());
  }

  for (const name of symbolNames) {
    const char = symbolsLookup.get(name);
    if (char) {
      chars.push(char);
    } else {
      console.warn(`Warning: Unknown symbol "${name}"`);
    }
  }

  // Always include space
  if (!chars.includes(" ")) {
    chars.push(" ");
  }

  return chars.join("");
}

async function subsetFont(characters: string, outputPath: string) {
  const inputFont = join(designRoot, "src/fonts/Cupertino-Pro-Full.woff2");
  const charFile = join(designRoot, "tools/.subset-chars.txt");

  // Write characters to temp file
  await Bun.write(charFile, characters);

  console.log(`Creating subset font with ${characters.length} characters...`);

  try {
    await $`pyftsubset ${inputFont} --text-file=${charFile} --output-file=${outputPath} --flavor=woff2`.quiet();

    // Get file sizes
    const originalSize = (await Bun.file(inputFont).arrayBuffer()).byteLength;
    const subsetSize = (await Bun.file(outputPath).arrayBuffer()).byteLength;
    const reduction = ((originalSize - subsetSize) / originalSize * 100).toFixed(1);

    console.log(`✅ Font subset created: ${outputPath}`);
    console.log(`   ${(originalSize / 1024).toFixed(1)}KB → ${(subsetSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);

    // Clean up temp file
    await Bun.write(charFile, "");

  } catch (error: any) {
    console.error("❌ Failed to create font subset.");
    console.error("   Make sure pyftsubset is installed: pip install fonttools brotli");
    throw error;
  }
}

async function main() {
  const projectPath = process.argv[2];

  if (!projectPath) {
    console.log("Usage: bun run tools/subset-font.ts <project-path>");
    console.log("Example: bun run tools/subset-font.ts ../astro-ndi");
    process.exit(1);
  }

  const targetDir = resolve(process.cwd(), projectPath);
  const outputPath = join(targetDir, "public/fonts/Cupertino-Pro.woff2");

  console.log(`🔍 Scanning for SFSymbol usage in ${targetDir}...`);

  // Find all Astro files in the project and design system
  const projectFiles = await findAstroFiles(targetDir);
  const designFiles = await findAstroFiles(join(designRoot, "src"));
  const allFiles = [...projectFiles, ...designFiles];

  console.log(`   Found ${allFiles.length} files to scan`);

  // Extract symbol names
  const symbolNames = await extractSymbolNames(allFiles);
  console.log(`   Found ${symbolNames.size} unique symbols: ${[...symbolNames].join(", ")}`);

  if (symbolNames.size === 0) {
    console.log("⚠️  No SFSymbol usage found. Copying full font instead.");
    await $`mkdir -p ${join(targetDir, "public/fonts")}`;
    await $`cp ${join(designRoot, "src/fonts/Cupertino-Pro-Full.woff2")} ${outputPath}`;
    return;
  }

  // Convert to characters - always include Latin for text rendering
  const chars = symbolsToChars(symbolNames, true);
  console.log(`   Character set includes: Latin + ${symbolNames.size} SF Symbols`);

  // Create output directory
  await $`mkdir -p ${join(targetDir, "public/fonts")}`.quiet();

  // Create subset font
  await subsetFont(chars, outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
