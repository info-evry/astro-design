/**
 * File download helpers - Info Evry Design System
 * Replaces the copy-pasted "createObjectURL -> <a download> -> revoke" blocks.
 */

/** Anything the admin api client's `api()` function satisfies. */
export type ApiFn = (endpoint: string, options?: RequestInit) => Promise<unknown>;

const FALLBACK_FILENAME = 'download';
const MAX_FILENAME_LENGTH = 150;
const FORBIDDEN_FILENAME_CHARS = new Set(String.raw`\/:*?"<>|`);

/**
 * Make a string safe to use as a download filename: path separators,
 * reserved characters and control characters become `_`, leading dots and
 * surrounding whitespace are dropped, and overly long names are shortened
 * (keeping a short extension). Never returns an empty string.
 */
export function safeFilename(name: string): string {
  let cleaned = '';
  for (const char of String(name ?? '')) {
    const code = char.codePointAt(0) ?? 0;
    cleaned += code < 0x20 || code === 0x7f || FORBIDDEN_FILENAME_CHARS.has(char) ? '_' : char;
  }
  cleaned = cleaned.trim();
  while (cleaned.startsWith('.')) cleaned = cleaned.slice(1);
  cleaned = cleaned.trim();

  if (cleaned.length > MAX_FILENAME_LENGTH) {
    const dot = cleaned.lastIndexOf('.');
    const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : '';
    cleaned = cleaned.slice(0, MAX_FILENAME_LENGTH - ext.length) + ext;
  }
  return cleaned || FALLBACK_FILENAME;
}

/**
 * Trigger a browser download for a Blob or a string.
 * @param data - Blob, or text content
 * @param filename - Suggested name (sanitised with `safeFilename`)
 * @param mime - Content type. Strings default to `text/plain;charset=utf-8`;
 *   a Blob keeps its own type unless `mime` is given.
 */
export function downloadBlob(data: Blob | string, filename: string, mime?: string): void {
  let blob: Blob;
  if (typeof data === 'string') {
    blob = new Blob([data], { type: mime ?? 'text/plain;charset=utf-8' });
  } else if (mime && data.type !== mime) {
    blob = new Blob([data], { type: mime });
  } else {
    blob = data;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFilename(filename);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

function isResponseLike(value: unknown): value is Response {
  return typeof value === 'object' && value !== null && typeof (value as Response).blob === 'function';
}

/**
 * Fetch `endpoint` through the admin api client and download the result.
 * The client returns a raw `Response` for `text/csv` payloads (saved as-is);
 * JSON results are saved pretty-printed and plain strings as text.
 * Errors from `api` propagate so the caller can toast them.
 */
export async function downloadFromApi(api: ApiFn, endpoint: string, filename: string): Promise<void> {
  const result = await api(endpoint);

  if (isResponseLike(result)) {
    downloadBlob(await result.blob(), filename);
  } else if (typeof result === 'string') {
    downloadBlob(result, filename);
  } else {
    downloadBlob(JSON.stringify(result, null, 2), filename, 'application/json');
  }
}
