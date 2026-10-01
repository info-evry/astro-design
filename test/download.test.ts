/**
 * Download Script Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { downloadBlob, downloadFromApi, safeFilename } from '../src/scripts/download';

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
const originalClick = HTMLAnchorElement.prototype.click;

let createSpy: ReturnType<typeof vi.fn>;
let revokeSpy: ReturnType<typeof vi.fn>;
let clicked: Array<{ href: string; download: string; inDom: boolean }>;

beforeEach(() => {
  document.body.innerHTML = '';
  clicked = [];
  createSpy = vi.fn(() => 'blob:mock-url');
  revokeSpy = vi.fn();
  URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    clicked.push({ href: this.href, download: this.download, inDom: document.body.contains(this) });
  };
});

afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  HTMLAnchorElement.prototype.click = originalClick;
});

describe('safeFilename', () => {
  test('keeps ordinary names', () => {
    expect(safeFilename('participants_officiel.csv')).toBe('participants_officiel.csv');
  });

  test('replaces separators, reserved and control characters', () => {
    expect(safeFilename('a/b\\c:d*e?f"g<h>i|j\u0001k')).toBe('a_b_c_d_e_f_g_h_i_j_k');
    expect(safeFilename('../../etc/passwd')).toBe('_.._etc_passwd');
  });

  test('drops leading dots and surrounding whitespace', () => {
    expect(safeFilename('  ..hidden.csv ')).toBe('hidden.csv');
  });

  test('falls back for empty or unusable names', () => {
    expect(safeFilename('')).toBe('download');
    expect(safeFilename('...')).toBe('download');
    expect(safeFilename(undefined as unknown as string)).toBe('download');
  });

  test('shortens long names but keeps a short extension', () => {
    const long = safeFilename(`${'a'.repeat(300)}.csv`);
    expect(long.length).toBe(150);
    expect(long.endsWith('.csv')).toBe(true);
    expect(safeFilename('b'.repeat(300)).length).toBe(150);
    // a "extension" that is too long to be one is not preserved
    expect(safeFilename(`${'c'.repeat(200)}.${'x'.repeat(40)}`).length).toBe(150);
  });
});

describe('downloadBlob', () => {
  test('creates an object URL, clicks an attached anchor, then cleans up', () => {
    const blob = new Blob(['a,b'], { type: 'text/csv' });

    downloadBlob(blob, 'members.csv');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clicked).toEqual([{ href: 'blob:mock-url', download: 'members.csv', inDom: true }]);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url');
    expect(document.querySelector('a')).toBeNull();
  });

  test('wraps strings in a Blob with the given or default type', async () => {
    downloadBlob('hello', 'a.txt');
    const defaulted = createSpy.mock.calls[0][0] as Blob;
    expect(defaulted.type).toContain('text/plain');
    expect(await defaulted.text()).toBe('hello');

    downloadBlob('{}', 'a.json', 'application/json');
    expect((createSpy.mock.calls[1][0] as Blob).type).toBe('application/json');
  });

  test('re-types a Blob only when a different mime is requested', () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    downloadBlob(blob, 'a.csv', 'text/plain');
    expect(createSpy.mock.calls[0][0]).toBe(blob);

    downloadBlob(blob, 'a.csv', 'text/csv');
    expect((createSpy.mock.calls[1][0] as Blob).type).toBe('text/csv');
  });

  test('sanitises the filename', () => {
    downloadBlob('x', '../evil/name.csv');
    expect(clicked[0].download).toBe('_evil_name.csv');
  });

  test('cleans up even if click throws', () => {
    HTMLAnchorElement.prototype.click = () => { throw new Error('blocked'); };
    expect(() => downloadBlob('x', 'a.txt')).toThrow('blocked');
    expect(revokeSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a')).toBeNull();
  });
});

describe('downloadFromApi', () => {
  test('downloads the Response blob returned for text/csv', async () => {
    const api = vi.fn().mockResolvedValue(
      new Response('a,b\n1,2', { headers: { 'Content-Type': 'text/csv' } })
    );

    await downloadFromApi(api, '/admin/export', 'participants.csv');

    expect(api).toHaveBeenCalledWith('/admin/export');
    expect(clicked[0].download).toBe('participants.csv');
    expect(await (createSpy.mock.calls[0][0] as Blob).text()).toBe('a,b\n1,2');
  });

  test('saves JSON results pretty-printed', async () => {
    await downloadFromApi(vi.fn().mockResolvedValue({ year: 2025 }), '/x', 'archive.json');
    const blob = createSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toBe('{\n  "year": 2025\n}');
  });

  test('saves string results as text', async () => {
    await downloadFromApi(vi.fn().mockResolvedValue('raw,csv'), '/x', 'a.csv');
    expect(await (createSpy.mock.calls[0][0] as Blob).text()).toBe('raw,csv');
  });

  test('propagates api errors without downloading', async () => {
    const api = vi.fn().mockRejectedValue(new Error('Unauthorized'));
    await expect(downloadFromApi(api, '/x', 'a.csv')).rejects.toThrow('Unauthorized');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
