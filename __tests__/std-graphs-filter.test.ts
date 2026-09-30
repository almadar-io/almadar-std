// std-graphs row filter: a chart of "paid revenue" must never bucket an unpaid row. Every grouping in
// ITEMS_LOADED reads the filtered `rows`; only the filter itself reads the raw payload. The executed
// check (paid rows only, unfiltered control keeps all) runs through a composing fixture on the runtime.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Node = string | number | boolean | null | Node[] | { [key: string]: Node };

const orb = JSON.parse(readFileSync(join(__dirname, '../behaviors/registry/ui/core/atoms/std-graphs.orb'), 'utf-8')) as {
  orbitals: Array<{ traits: Array<{
    config: Record<string, { default: Node }>;
    stateMachine: { transitions: Array<{ event: string; effects: Node[] }> };
  }> }>;
};
const trait = orb.orbitals[0].traits[0];
const itemsLoaded = trait.stateMachine.transitions.find((t) => t.event === 'ITEMS_LOADED');

function count(node: Node, token: string): number {
  if (node === token) return 1;
  if (Array.isArray(node)) return node.reduce<number>((n, child) => n + count(child, token), 0);
  if (node !== null && typeof node === 'object') return Object.values(node).reduce<number>((n, child) => n + count(child, token), 0);
  return 0;
}

describe('std-graphs row filter', () => {
  const [letEffect] = itemsLoaded?.effects ?? [];
  const [op, bindings, body] = Array.isArray(letEffect) ? letEffect : [];

  it('binds the filtered rows first, reading the raw payload only there', () => {
    expect(op).toBe('let');
    expect(JSON.stringify(bindings)).toContain('@config.filterField');
    expect(count(bindings ?? null, '@payload.data')).toBeGreaterThan(0);
  });

  it('every grouping reads the filtered rows, never the raw payload', () => {
    expect(count(body ?? null, '@payload.data')).toBe(0);
    expect(count(body ?? null, '@rows')).toBeGreaterThan(0);
  });

  it('control: by default the filter keeps every row', () => {
    expect(trait.config.filterField.default).toBe('');
    expect(trait.config.filterValue.default).toBe('');
  });
});
