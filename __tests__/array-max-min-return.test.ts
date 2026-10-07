import { describe, it, expect } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import canonical from '../canonical-operators.json';

/**
 * `array/max` / `array/min` are `null` when no element counts (the one contract both
 * evaluators follow, G-CROSS-082), so the registry declares it — a compiler then never
 * treats the result as a definite number.
 */
describe('array/max and array/min return type', () => {
  it('declares the null an empty list yields', () => {
    expect(STD_OPERATORS['array/max'].returnType).toBe('number | null');
    expect(STD_OPERATORS['array/min'].returnType).toBe('number | null');
  });

  it('the generated canonical registry carries it', () => {
    const ops = canonical.operators as Record<string, { returnType?: string }>;
    expect(ops['array/max'].returnType).toBe('number | null');
    expect(ops['array/min'].returnType).toBe('number | null');
  });

  it('control: array/sum stays a definite number', () => {
    expect(STD_OPERATORS['array/sum'].returnType).toBe('number');
  });
});
