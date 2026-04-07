/**
 * Composition Module Tests
 *
 * Verifies the four behavior composition operators are registered with the
 * correct shape (compileTime, params, module, category) and that they are
 * surfaced through the central registry.
 */

import { describe, it, expect } from 'vitest';

import { COMPOSITION_OPERATORS, getCompositionOperators } from '../composition.js';
import { STD_OPERATORS, STD_OPERATORS_BY_MODULE } from '../../registry.js';

const EXPECTED_OPERATORS = [
  'behavior/compose',
  'behavior/wire',
  'behavior/detect-layout',
  'behavior/pipe',
] as const;

describe('COMPOSITION_OPERATORS', () => {
  it('contains all four expected operators', () => {
    for (const name of EXPECTED_OPERATORS) {
      expect(COMPOSITION_OPERATORS[name]).toBeDefined();
    }
    expect(Object.keys(COMPOSITION_OPERATORS)).toHaveLength(EXPECTED_OPERATORS.length);
  });

  it('marks every operator as compileTime: true', () => {
    for (const name of EXPECTED_OPERATORS) {
      expect(COMPOSITION_OPERATORS[name].compileTime).toBe(true);
    }
  });

  it('gives every operator a non-empty params array', () => {
    for (const name of EXPECTED_OPERATORS) {
      const meta = COMPOSITION_OPERATORS[name];
      expect(Array.isArray(meta.params)).toBe(true);
      expect(meta.params && meta.params.length).toBeGreaterThan(0);
    }
  });

  it('uses module: "composition" and category: "std-composition"', () => {
    for (const name of EXPECTED_OPERATORS) {
      const meta = COMPOSITION_OPERATORS[name];
      expect(meta.module).toBe('composition');
      expect(meta.category).toBe('std-composition');
      expect(meta.hasSideEffects).toBe(false);
    }
  });

  it('uses the documented arities', () => {
    expect(COMPOSITION_OPERATORS['behavior/compose'].minArity).toBe(1);
    expect(COMPOSITION_OPERATORS['behavior/compose'].maxArity).toBe(1);

    expect(COMPOSITION_OPERATORS['behavior/wire'].minArity).toBe(2);
    expect(COMPOSITION_OPERATORS['behavior/wire'].maxArity).toBe(2);

    expect(COMPOSITION_OPERATORS['behavior/detect-layout'].minArity).toBe(1);
    expect(COMPOSITION_OPERATORS['behavior/detect-layout'].maxArity).toBe(2);

    expect(COMPOSITION_OPERATORS['behavior/pipe'].minArity).toBe(2);
    expect(COMPOSITION_OPERATORS['behavior/pipe'].maxArity).toBeNull();
  });

  it('exposes operator names through getCompositionOperators()', () => {
    const names = getCompositionOperators();
    for (const name of EXPECTED_OPERATORS) {
      expect(names).toContain(name);
    }
  });
});

describe('STD_OPERATORS integration', () => {
  it('exposes behavior/compose through the central registry', () => {
    expect(STD_OPERATORS['behavior/compose']).toBeDefined();
    expect(STD_OPERATORS['behavior/compose'].compileTime).toBe(true);
  });

  it('exposes all four composition operators through the central registry', () => {
    for (const name of EXPECTED_OPERATORS) {
      expect(STD_OPERATORS[name]).toBeDefined();
    }
  });

  it('groups composition operators under STD_OPERATORS_BY_MODULE.composition', () => {
    const moduleEntries = STD_OPERATORS_BY_MODULE['composition'];
    expect(moduleEntries).toBeDefined();
    expect(Object.keys(moduleEntries)).toHaveLength(EXPECTED_OPERATORS.length);
    for (const name of EXPECTED_OPERATORS) {
      expect(moduleEntries[name]).toBeDefined();
    }
  });
});
