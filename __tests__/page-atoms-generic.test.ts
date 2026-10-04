/**
 * The std page atoms are the generic substrate for browser extensions: no site lives here. Sites are
 * io realization data (`@almadar-io/behaviors` `sites/`). The rule is deterministic: every host a
 * std page atom names (in a URL or a match pattern) is a reserved example domain (RFC 2606).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Hosts named in URLs and match patterns (`https://host/…`, `*://*.host/…`). */
function hostsIn(text: string): string[] {
  return [...text.matchAll(/(?:https?|\*|file|ftp):\/\/(?:\*\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)].map((m) => m[1].toLowerCase());
}

const RESERVED = /(^|\.)(example\.(com|org|net)|[a-z0-9-]+\.(test|example|invalid|localhost))$/;
const isReserved = (host: string) => RESERVED.test(host);

const atomsDir = resolve(__dirname, '../behaviors/lolo/infra/atoms');
const pageAtoms = readdirSync(atomsDir).filter((f) => /^std-page-.*\.lolo$/.test(f));

describe('std page atoms name no real site', () => {
  it('finds the page atoms', () => {
    expect(pageAtoms.sort()).toEqual(['std-page-open.lolo', 'std-page-search.lolo', 'std-page-treat.lolo', 'std-page-watch.lolo']);
  });

  it.each(pageAtoms)('%s names only reserved example hosts', (file) => {
    const hosts = hostsIn(readFileSync(join(atomsDir, file), 'utf8'));
    expect(hosts.filter((h) => !isReserved(h))).toEqual([]);
  });

  it('control: the scanner flags a real site in a URL and in a match pattern', () => {
    const hosts = hostsIn('searchUrl: "https://www.youtube.com/results" match: "*://*.tiktok.com/*"');
    expect(hosts).toEqual(['www.youtube.com', 'tiktok.com']);
    expect(hosts.filter((h) => !isReserved(h))).toEqual(['www.youtube.com', 'tiktok.com']);
  });

  it('edge: reserved example domains pass, look-alikes do not', () => {
    expect(['example.com', 'search.example.org', 'shop.test', 'a.example'].every(isReserved)).toBe(true);
    expect(['example.com.evil.net', 'notexample.com', 'test.com'].some(isReserved)).toBe(false);
  });
});
