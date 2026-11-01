import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { getModuleFromOperator } from '../types.js';
import canonical from '../canonical-operators.json';

describe('http effect', () => {
  it('is retired: HTTP is std-http-client over os/*, so no operator, module or effect kind carries it', () => {
    expect(STD_OPERATORS['http']).toBeUndefined();
    expect(getOperatorRunsOn('http')).toBeUndefined();
    expect(canonical.operators).not.toHaveProperty('http');
    expect(Object.values(canonical.operators).some((op) => 'effect' in op && op.effect?.kind === 'http')).toBe(false);
  });

  it('control: the retired operator left the neighbours it shared a table with', () => {
    expect(STD_OPERATORS['call-service']).toBeDefined();
    expect(STD_OPERATORS['cancel-call']).toBeDefined();
    expect(JSON.stringify(STD_OPERATORS['call-service'].params?.[3]?.type)).toContain('onMessage');
  });

  it('the default ports of the URL schemes live on browser/beacon, the one operator that reads them', () => {
    expect(STD_OPERATORS['browser/beacon'].defaultPorts).toEqual({ http: 80, https: 443 });
    expect(canonical.operators['browser/beacon']).toMatchObject({ defaultPorts: { http: 80, https: 443 } });
  });
});

describe('codec operators', () => {
  const encoding = { kind: 'union', of: [{ kind: 'literal', value: 'hex' }, { kind: 'literal', value: 'base64' }] };
  const nullableString = { kind: 'union', of: ['string', { kind: 'literal', value: null }] };
  const cases: Array<[string, number, number, string[], string | typeof nullableString]> = [
    ['str/encode-uri-component', 1, 1, ['s'], 'string'],
    ['str/decode-uri-component', 1, 1, ['s'], nullableString],
    ['base64/encode', 1, 1, ['s'], 'string'],
    ['base64/decode', 1, 1, ['s'], nullableString],
    ['hash/sha256', 2, 3, ['data', 'encoding', 'input'], nullableString],
    ['hash/md5', 2, 2, ['bytes', 'encoding'], nullableString],
    ['hmac/sha256', 3, 4, ['key', 'message', 'encoding', 'prefix'], nullableString],
  ];

  for (const [name, minArity, maxArity, params, returnType] of cases) {
    it(`${name} is pure with ${minArity === maxArity ? minArity : `${minArity}-${maxArity}`} params`, () => {
      const op = STD_OPERATORS[name];
      expect(op).toBeDefined();
      expect(op.hasSideEffects).toBe(false);
      expect(op.returnType).toEqual(returnType);
      expect([op.minArity, op.maxArity]).toEqual([minArity, maxArity]);
      expect((op.params ?? []).map((p) => p.name)).toEqual(params);
      expect((op.params ?? []).filter((p) => !p.optional)).toHaveLength(minArity);
      expect(op.description.length).toBeGreaterThan(0);
      expect(getModuleFromOperator(name)).toBe(op.module);
    });
  }

  it('types the encoding argument as the hex|base64 literal union', () => {
    expect(STD_OPERATORS['hash/sha256'].params?.[1]?.type).toEqual(encoding);
    expect(STD_OPERATORS['hash/md5'].params?.[1]?.type).toEqual(encoding);
    expect(STD_OPERATORS['hmac/sha256'].params?.[2]?.type).toEqual(encoding);
  });

  it('control: an unregistered sibling is absent', () => {
    expect(STD_OPERATORS['hash/md4']).toBeUndefined();
  });
});
