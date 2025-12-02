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

const __dirname = dirname(fileURLToPath(import.meta.url));
const designRoot = resolve(__dirname, "..");

interface SymbolEntry {
  name: string;
  char: string;
}

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
    }
  }

  await scan(dir);
  return files;
}

async function extractSymbolNames(files: string[]): Promise<Set<string>> {
  const symbols = new Set<string>();

  for (const file of files) {
    try {
      const content = await Bun.file(file).text();

      // Match SFSymbol component usage: <SFSymbol name="..." or name={"..."}
      const matches = content.matchAll(/<SFSymbol[^>]*name=["'{]([^"'}]+)["'}]/g);
      for (const match of matches) {
        symbols.add(match[1]);
      }

      // Also match symbol prop in MobileNav items
      const iconMatches = content.matchAll(/icon:\s*["']([^"']+)["']/g);
      for (const match of iconMatches) {
        symbols.add(match[1]);
      }
    } catch (e) {
      console.warn(`Warning: Could not read ${file}`);
    }
  }

  return symbols;
}

function symbolsToChars(symbolNames: Set<string>): string {
  const chars: string[] = [];

  for (const name of symbolNames) {
    const char = symbolsLookup.get(name);
    if (char) {
      chars.push(char);
    } else {
      console.warn(`Warning: Unknown symbol "${name}"`);
    }
  }

  // Always include space and common characters for text rendering
  chars.push(" ");

  return chars.join("");
}

async function subsetFont(characters: string, outputPath: string) {
  const inputFont = join(designRoot, "src/fonts/Cupertino-Pro.woff2");
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
    await $`cp ${join(designRoot, "src/fonts/Cupertino-Pro.woff2")} ${outputPath}`;
    return;
  }

  // Convert to characters
  const chars = symbolsToChars(symbolNames);

  // Create output directory
  await $`mkdir -p ${join(targetDir, "public/fonts")}`.quiet();

  // Create subset font
  await subsetFont(chars, outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
