/**
 * Base-path utilities - Info Evry Design System
 *
 * Sites in the monorepo may be deployed under a sub-path (e.g. astro-ndi is
 * served from `/nuit-de-linfo`, astro-join from `/adhesion`) while others
 * are served from the root (astro-asso). Any hardcoded absolute path such
 * as `/favicon.svg` breaks once a site has a non-root `base` configured in
 * astro.config.mjs. `withBase` joins a path with the site's base without
 * producing doubled slashes, regardless of whether either side already has
 * a leading/trailing slash.
 */

/**
 * Join a path with a base URL, avoiding double slashes.
 * @param path - The path to resolve (e.g. '/favicon.svg' or 'favicon.svg')
 * @param base - The site's base URL (defaults to `import.meta.env.BASE_URL`)
 * @returns The joined path (e.g. '/nuit-de-linfo/favicon.svg')
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const normalizedBase = (base || '/').replace(/\/+$/, '');
  const normalizedPath = `/${(path || '').replace(/^\/+/, '')}`;

  if (!normalizedBase) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}
