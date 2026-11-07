/**
 * G-STD-278: one validation code declared in several std atoms carries one category and one
 * description. The code registry is generated from these declarations, so a second text for a
 * code is refused late (the lolo export test); this catches it in the package.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(__dirname, '../behaviors/lolo');
const DECL = /code: "([A-Z][A-Z0-9_]*)", category: "([^"]*)", description: "((?:[^"\\]|\\.)*)"/g;

interface Decl {
  file: string;
  category: string;
  description: string;
}

function lolo(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return lolo(full);
    return name.endsWith('.lolo') ? [full] : [];
  });
}

export function disagreements(decls: Map<string, Decl[]>): string[] {
  return [...decls]
    .filter(([, list]) => new Set(list.map((d) => `${d.category}\u0000${d.description}`)).size > 1)
    .map(([code]) => code);
}

function collect(files: string[]): Map<string, Decl[]> {
  const decls = new Map<string, Decl[]>();
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(DECL)) {
      const list = decls.get(m[1]) ?? [];
      list.push({ file: relative(root, file), category: m[2], description: m[3] });
      decls.set(m[1], list);
    }
  }
  return decls;
}

describe('G-STD-278 a code is declared identically in every std atom', () => {
  it('finds the declarations', () => {
    expect(collect(lolo(root)).size).toBeGreaterThan(50);
  });

  it('control: two texts for one code are reported', () => {
    const decls = new Map<string, Decl[]>([
      ['ORB_X', [{ file: 'a', category: 'lint', description: 'one' }, { file: 'b', category: 'lint', description: 'two' }]],
      ['ORB_Y', [{ file: 'a', category: 'lint', description: 'same' }, { file: 'b', category: 'lint', description: 'same' }]],
    ]);
    expect(disagreements(decls)).toEqual(['ORB_X']);
  });

  it('no code carries two categories or descriptions', () => {
    const decls = collect(lolo(root));
    const bad = disagreements(decls).map((code) => `${code}: ${decls.get(code)!.map((d) => d.file).join(', ')}`);
    expect(bad).toEqual([]);
  });
});
