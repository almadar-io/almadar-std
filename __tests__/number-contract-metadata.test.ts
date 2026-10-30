import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { nullable } from '../signature.js';
import canonical from '../canonical-operators.json';

describe('str/to-number contract', () => {
  it('publishes the exact source signature in the installed compiler table', () => {
    const operator = canonical.operators['str/to-number'];
    expect(operator).toBeDefined();
    const source = STD_OPERATORS['str/to-number'];
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
  });
  it('declares one string input, numeric output and no effect residence', () => {
    const operator = STD_OPERATORS['str/to-number'];
    expect(operator).toBeDefined();
    expect(operator.module).toBe('str');
    expect(operator.category).toBe('std-str');
    expect(operator.hasSideEffects).toBe(false);
    expect(operator.returnType).toEqual(nullable('number'));
    expect([operator.minArity, operator.maxArity]).toEqual([1, 1]);
    expect(operator.params?.map(({ name, type, optional }) => ({ name, type, optional: optional === true }))).toEqual([{ name: 's', type: 'string', optional: false }]);
    expect(getOperatorRunsOn('str/to-number')).toBeUndefined();
  });

  it('control: string concatenation keeps its existing string result', () => {
    expect(STD_OPERATORS['str/concat'].returnType).toBe('string');
    expect(STD_OPERATORS['str/concat'].hasSideEffects).toBe(false);
    expect(getOperatorRunsOn('str/concat')).toBeUndefined();
  });
});
