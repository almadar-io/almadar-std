import { describe, expect, it } from 'vitest';
import { XML_OPERATORS, getXmlOperators } from '../modules/xml.js';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { SHAPE } from '../signature.js';
import canonical from '../canonical-operators.json';

describe('xml/valid source contract', () => {
  it('publishes the exact source signature in the installed compiler table', () => {
    const operator = canonical.operators['xml/valid'];
    const source = XML_OPERATORS['xml/valid'];
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

  it('declares exactly one required string input and boolean output', () => {
    const operator = XML_OPERATORS['xml/valid'];
    expect(operator).toBeDefined();
    expect(operator.module).toBe('xml');
    expect(operator.category).toBe('std-codec');
    expect([operator.minArity, operator.maxArity]).toEqual([1, 1]);
    expect(operator.returnType).toBe('boolean');
    expect(operator.params?.map(({ name, type, optional }) => ({ name, type, optional: optional === true }))).toEqual([{ name: 's', type: 'string', optional: false }]);
  });

  it('exposes the same canonical source entry through the combined registry', () => {
    expect(getXmlOperators()).toContain('xml/valid');
    expect(STD_OPERATORS['xml/valid']).toBe(XML_OPERATORS['xml/valid']);
  });

  it('is pure and has no effect residence or host', () => {
    const operator = XML_OPERATORS['xml/valid'];
    expect(operator).toBeDefined();
    expect(operator.hasSideEffects).toBe(false);
    expect(operator.runsOn).toBeUndefined();
    expect(operator.host).toBeUndefined();
    expect(getOperatorRunsOn('xml/valid')).toBeUndefined();
  });

  it('control: xml/parse keeps its declared-shape contract plus the compiler-written listPaths', () => {
    const operator = XML_OPERATORS['xml/parse'];
    expect([operator.minArity, operator.maxArity]).toEqual([2, 3]);
    expect(operator.returnType).toEqual(SHAPE);
    expect(operator.params?.map(({ name, type, optional }) => ({ name, type, optional: optional === true }))).toEqual([
      { name: 's', type: 'string', optional: false },
      { name: 'shape', type: SHAPE, optional: false },
      { name: 'listPaths', type: { kind: 'array', of: { kind: 'array', of: 'string' } }, optional: true },
    ]);
    expect(operator.hasSideEffects).toBe(false);
    expect(getOperatorRunsOn('xml/parse')).toBeUndefined();
  });
});
