import { describe, it, expect } from 'vitest';
import { EFFECT_OPERATORS, EFFECT_OPERATOR_FAMILIES } from '@almadar/core';
import { getStdEffectOperators } from '../registry';

const typed = new Set<string>(EFFECT_OPERATORS);
const families = new Set<string>(EFFECT_OPERATOR_FAMILIES);
const isTyped = (op: string): boolean => typed.has(op) || (op.includes('/') && families.has(op.split('/')[0]));

describe('every std effect operator has a typed Effect in @almadar/core', () => {
  it('no registered effect operator is missing from core', () => {
    expect(getStdEffectOperators().filter((op) => !isTyped(op))).toEqual([]);
  });

  it('control: an unknown operator is reported as untyped', () => {
    expect(isTyped('made-up/effect')).toBe(false);
    expect(isTyped('notify')).toBe(true);
    expect(isTyped('llm/generate')).toBe(true);
  });
});
