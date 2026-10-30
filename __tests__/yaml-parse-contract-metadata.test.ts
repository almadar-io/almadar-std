import { describe, expect, it } from 'vitest';
import { JSON_OPERATORS } from '../modules/json.js';
import { YAML_OPERATORS, getYamlOperators } from '../modules/yaml.js';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { SHAPE, nullable } from '../signature.js';
import canonical from '../canonical-operators.json';

describe('yaml/parse source contract', () => {
  it('publishes the exact source signature in the installed compiler table', () => {
    const operator = canonical.operators['yaml/parse'];
    const source = YAML_OPERATORS['yaml/parse'];
    expect(operator).toBeDefined();
    expect(operator).toMatchObject({
      module: source.module,
      category: source.category,
      minArity: source.minArity,
      maxArity: source.maxArity,
      params: source.params,
      returnType: source.returnType,
    });
    expect(operator).toHaveProperty('failable');
    expect(operator).not.toHaveProperty('runsOn');
    expect(operator).not.toHaveProperty('host');
  });

  it('mirrors json/parse: text and a declared shape in, the shape or null out, failable, pure, no host', () => {
    const yaml = YAML_OPERATORS['yaml/parse'];
    const json = JSON_OPERATORS['json/parse'];
    expect([yaml.minArity, yaml.maxArity]).toEqual([json.minArity, json.maxArity]);
    expect(yaml.params?.map(({ name, type }) => ({ name, type }))).toEqual(json.params?.map(({ name, type }) => ({ name, type })));
    expect(yaml.returnType).toEqual(nullable(SHAPE));
    expect(yaml.failable).toEqual(json.failable);
    expect(yaml.hasSideEffects).toBe(false);
    expect(yaml.runsOn).toBeUndefined();
    expect(getOperatorRunsOn('yaml/parse')).toBe(getOperatorRunsOn('json/parse'));
  });

  it('is exposed through the combined registry', () => {
    expect(getYamlOperators()).toEqual(['yaml/parse']);
    expect(STD_OPERATORS['yaml/parse']).toBe(YAML_OPERATORS['yaml/parse']);
  });
});
