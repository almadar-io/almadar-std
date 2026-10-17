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
  const cases: Array<[string, number, string[]]> = [
    ['str/encode-uri-component', 1, ['s']],
    ['str/decode-uri-component', 1, ['s']],
    ['base64/encode', 1, ['s']],
    ['base64/decode', 1, ['s']],
    ['hash/sha256', 2, ['s', 'encoding']],
    ['hash/md5', 2, ['bytes', 'encoding']],
    ['hmac/sha256', 3, ['key', 'message', 'encoding']],
  ];

  for (const [name, arity, params] of cases) {
    it(`${name} is pure with ${arity} required params`, () => {
      const op = STD_OPERATORS[name];
      expect(op).toBeDefined();
      expect(op.hasSideEffects).toBe(false);
      expect(op.returnType).toBe('string');
      expect([op.minArity, op.maxArity]).toEqual([arity, arity]);
      expect((op.params ?? []).map((p) => p.name)).toEqual(params);
      expect((op.params ?? []).every((p) => !p.optional)).toBe(true);
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

describe('redis effect', () => {
  const redis = STD_OPERATORS['redis'];
  const params = redis.params ?? [];

  it('is a server effect of arity 2-4 over a list of text, producing a reply and its key', () => {
    expect(redis.category).toBe('effect');
    expect(redis.hasSideEffects).toBe(true);
    expect(getOperatorRunsOn('redis')).toBe('server');
    expect([redis.minArity, redis.maxArity]).toEqual([2, 4]);
    expect(params.map((p) => p.name)).toEqual(['origin', 'command', 'options', 'more']);
    expect(params[1].type).toEqual({ kind: 'array', of: 'string' });
    expect(redis.effect?.kind).toBe('redis');
    const produces = redis.effect?.produces;
    expect(typeof produces === 'object' && produces.kind === 'object' ? Object.keys(produces.fields) : []).toEqual(['reply', 'key']);
  });

  it('types the reply as a union of text, number, null and lists nested three deep, never a generic type', () => {
    const text = JSON.stringify(redis.effect?.produces);
    expect(text).not.toMatch(/"(any|unknown|json)"/);
    expect(text.match(/"kind":"array"/g)).toHaveLength(3);
    expect(text).toContain('"number"');
  });

  it('control: only the connection and routing options are accepted, the cancelled route is not one', () => {
    const options = JSON.stringify(params[2].type);
    for (const name of ['auth', 'user', 'db', 'key', 'success', 'failure']) expect(options).toContain(`"${name}"`);
    expect(options).not.toContain('cancelled');
    expect(params[2].optional).toBe(true);
  });
});

describe('postgres effect', () => {
  const postgres = STD_OPERATORS['postgres'];
  const params = postgres.params ?? [];

  it('is a server effect of arity 3-5 over a statement and its bind list, producing rows, a count, columns and a key', () => {
    expect(postgres.category).toBe('effect');
    expect(postgres.hasSideEffects).toBe(true);
    expect(getOperatorRunsOn('postgres')).toBe('server');
    expect([postgres.minArity, postgres.maxArity]).toEqual([3, 5]);
    expect(params.map((p) => p.name)).toEqual(['origin', 'sql', 'params', 'options', 'more']);
    expect(postgres.effect?.kind).toBe('postgres');
    const produces = postgres.effect?.produces;
    expect(typeof produces === 'object' && produces.kind === 'object' ? Object.keys(produces.fields) : []).toEqual(['rows', 'rowCount', 'columns', 'key']);
  });

  it('types the options without a cancelled route and the rows without a generic type', () => {
    const options = JSON.stringify(params[3].type);
    for (const name of ['auth', 'user', 'database', 'tls', 'timeoutMs', 'key', 'success', 'failure']) expect(options).toContain(`"${name}"`);
    expect(options).not.toContain('cancelled');
    expect(JSON.stringify(postgres.effect?.produces)).not.toMatch(/"(any|unknown|json)"/);
    expect(params[3].optional).toBe(true);
  });
});
