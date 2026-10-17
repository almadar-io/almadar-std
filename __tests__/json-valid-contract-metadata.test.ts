import { describe, expect, it } from 'vitest';
import { JSON_OPERATORS, getJsonOperators } from '../modules/json.js';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { SHAPE } from '../signature.js';
import canonical from '../canonical-operators.json';

describe('json/valid source contract', () => {
  it('publishes the exact source signature in the installed compiler table', () => {
    const operator = canonical.operators['json/valid'];
    const source = JSON_OPERATORS['json/valid'];
    expect(operator).toBeDefined();
    expect(operator).toMatchObject({
      module: source.module,
      category: source.category,
      minArity: source.minArity,
      maxArity: source.maxArity,
      params: source.params,
      returnType: source.returnType,
    });
    expect(operator).not.toHaveProperty('hasSideEffects', true);
    expect(operator).not.toHaveProperty('runsOn');
    expect(operator).not.toHaveProperty('host');
  });

  it('declares exactly one required string input and a boolean output', () => {
    const operator = JSON_OPERATORS['json/valid'];
    expect(operator).toBeDefined();
    expect(operator.module).toBe('json');
    expect(operator.category).toBe('std-json');
    expect([operator.minArity, operator.maxArity]).toEqual([1, 1]);
    expect(operator.returnType).toBe('boolean');
    expect(operator.params?.map(({ name, type, optional }) => ({ name, type, optional: optional === true }))).toEqual([{ name: 's', type: 'string', optional: false }]);
  });

  it('exposes the same canonical source entry through the combined registry', () => {
    expect(getJsonOperators()).toContain('json/valid');
    expect(STD_OPERATORS['json/valid']).toBe(JSON_OPERATORS['json/valid']);
  });

  it('is pure and has no effect residence or host', () => {
    const operator = JSON_OPERATORS['json/valid'];
    expect(operator).toBeDefined();
    expect(operator.hasSideEffects).toBe(false);
    expect(operator.runsOn).toBeUndefined();
    expect(operator.host).toBeUndefined();
    expect(getOperatorRunsOn('json/valid')).toBeUndefined();
  });

  it('control: json/parse retains its two-argument declared-shape contract', () => {
    const operator = JSON_OPERATORS['json/parse'];
    expect([operator.minArity, operator.maxArity]).toEqual([2, 2]);
    expect(operator.returnType).toEqual(SHAPE);
    expect(operator.params?.map(({ name, type, optional }) => ({ name, type, optional: optional === true }))).toEqual([
      { name: 's', type: 'string', optional: false },
      { name: 'shape', type: SHAPE, optional: false },
    ]);
    expect(operator.hasSideEffects).toBe(false);
    expect(getOperatorRunsOn('json/parse')).toBeUndefined();
  });
});
