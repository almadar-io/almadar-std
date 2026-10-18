import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import { NULL_REJECTING_OPERANDS } from '../modules/null-operands.js';

interface Probe {
  operator: string;
  position: number;
  rejects: boolean;
}

const mirror = new URL('./fixtures/null-operands.json', import.meta.url);
const canonical = new URL('../../almadar-parity/fixtures/operators/null-operands.json', import.meta.url);
const probes: Probe[] = JSON.parse(readFileSync(mirror, 'utf8'));

function flagged(operator: string, position: number): boolean {
  const params = STD_OPERATORS[operator]?.params ?? [];
  const own = params[position];
  if (own !== undefined) return own.rejectsNull === true;
  const last = params[params.length - 1];
  return last !== undefined && (last.name.startsWith('...') || STD_OPERATORS[operator]?.maxArity === null) && last.rejectsNull === true;
}

describe('null operands: the declared flags are the kernel behavior the shared fixture records', () => {
  it('has both a rejecting and a tolerant probe', () => {
    expect(probes.some((p) => p.rejects)).toBe(true);
    expect(probes.some((p) => !p.rejects)).toBe(true);
  });

  it('flags exactly the positions the kernel raises on', () => {
    const wrong = probes.filter((p) => flagged(p.operator, p.position) !== p.rejects).map((p) => `${p.operator}[${p.position}]`);
    expect(wrong).toEqual([]);
  });

  it('names no operator the fixture did not probe', () => {
    const probed = new Set(probes.map((p) => p.operator));
    expect(Object.keys(NULL_REJECTING_OPERANDS).filter((name) => !probed.has(name))).toEqual([]);
  });

  it.skipIf(!existsSync(canonical))('matches the canonical corpus byte-for-byte (monorepo)', () => {
    expect(readFileSync(mirror).equals(readFileSync(canonical))).toBe(true);
  });
});
