import { describe, expect, it } from 'vitest';
import { STD_OPERATORS, getOperatorRunsOn } from '../registry.js';
import { getModuleFromOperator } from '../types.js';

describe('http effect', () => {
  const http = STD_OPERATORS['http'];
  const params = http.params ?? [];

  it('is a server effect of arity 3-5 producing the reply payload', () => {
    expect(http.category).toBe('effect');
    expect(http.hasSideEffects).toBe(true);
    expect(getOperatorRunsOn('http')).toBe('server');
    expect([http.minArity, http.maxArity]).toEqual([3, 5]);
    expect(params.map((p) => p.name)).toEqual(['method', 'origin', 'path', 'request', 'options']);
    expect(http.effect?.kind).toBe('http');
    expect(http.effect?.produces).toEqual({
      kind: 'object',
      fields: {
        status: 'number',
        headers: { kind: 'map', key: 'string', value: 'string' },
        body: 'string',
        key: { kind: 'union', of: ['string', { kind: 'literal', value: null }] },
      },
    });
  });

  it('types the method as the five-word literal union', () => {
    const method = params[0].type;
    expect(method).toEqual({
      kind: 'union',
      of: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ kind: 'literal', value })),
    });
  });

  it('declares key and all four emit routes in the options', () => {
    const options = params[4];
    expect(options.optional).toBe(true);
    expect(JSON.stringify(options.type)).toContain('onMessage');
    expect(JSON.stringify(options.type)).toContain('cancelled');
    expect(JSON.stringify(options.type)).toContain('"key"');
  });

  it('call-service options also route onMessage', () => {
    expect(JSON.stringify(STD_OPERATORS['call-service'].params?.[3]?.type)).toContain('onMessage');
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
    ['hmac/sha256', 3, 3, ['key', 'message', 'encoding'], nullableString],
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
