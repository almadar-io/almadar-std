import { describe, expect, it } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import type { OperatorTypeRef } from '../types.js';
import canonical from '../canonical-operators.json';

function fields(type: OperatorTypeRef | undefined): Record<string, OperatorTypeRef> {
  if (typeof type !== 'object' || type?.kind !== 'object') throw new Error('expected object metadata');
  return type.fields;
}

describe('HTTP contract metadata', () => {
  it('declares the reply key with its actual nullable wire type', () => {
    expect(fields(STD_OPERATORS.http.effect?.produces).key).toEqual({ kind: 'union', of: ['string', { kind: 'literal', value: null }] });
  });
  it('keeps the generated compiler contract aligned with source metadata', () => {
    expect(canonical.operators.http.params).toEqual(STD_OPERATORS.http.params);
  });
  const request = () => fields(STD_OPERATORS.http.params?.[3]?.type);

  it('declares every approved auth scheme and scoped credential slot', () => {
    const auth = fields(request().auth);
    const scheme = auth.scheme;
    if (typeof scheme !== 'object' || scheme.kind !== 'union') throw new Error('expected auth union');
    expect(scheme.of).toEqual(['bearer', 'api-key', 'basic', 'oauth2-client', 'hmac-sha256', 'token-exchange', 'jwt-bearer', 'aws-sigv4', 'vapid', 'oauth-client'].map(value => ({ kind: 'literal', value })));
    expect(auth.credential).toMatchObject({ kind: 'union' });
    expect(auth.key).toEqual(auth.credential);
    expect(auth.privateKey).toEqual(auth.credential);
    expect(auth.accessKeyId).toEqual(auth.credential);
  });

  it('declares advanced request parts without exposing execution clock metadata', () => {
    const parts = request();
    for (const key of ['multipart', 'webpush', 'retry', 'presign', 'formEncoding']) expect(parts[key]).toBeDefined();
    expect(parts.nowMs).toBeUndefined();
    expect(fields(parts.presign).expiresSec).toBe('number');
    expect(fields(parts.webpush).payload).toBe('string');
  });

  it('control: keeps ordinary bodies and header value types', () => {
    const parts = request();
    expect(parts.text).toBe('string');
    expect(parts.bytes).toBe('string');
    expect(parts.headers).toMatchObject({ kind: 'map' });
  });

  it('declares the closed grant-request surface under auth, not the resource or body', () => {
    const parts = request();
    const auth = fields(parts.auth);
    const grantRequest = auth.grantRequest;
    expect(grantRequest).toBeDefined();
    expect(grantRequest).not.toHaveProperty('open', true);
    expect(Object.keys(fields(grantRequest)).sort()).toEqual(['headers', 'method', 'retry', 'timeoutMs']);
    expect(parts.grantRequest).toBeUndefined();
    expect(fields(auth.body).grantRequest).toBeUndefined();
    const scheme = auth.scheme;
    if (typeof scheme !== 'object' || scheme.kind !== 'union') throw new Error('expected auth union');
    expect(scheme.of).toEqual(expect.arrayContaining(
      ['token-exchange', 'oauth2-client', 'jwt-bearer'].map(value => ({ kind: 'literal', value })),
    ));
  });

  it('keeps grant headers ordinary string values rather than credential slots', () => {
    const parts = request();
    const auth = fields(parts.auth);
    const headers = fields(auth.grantRequest).headers;
    expect(headers).toEqual({ kind: 'map', key: 'string', value: 'string' });
    expect(headers).toEqual(parts.headers);
    expect(auth.credential).toMatchObject({ kind: 'union' });
    expect(headers).not.toEqual(auth.credential);
  });

  it('shares one retry metadata object between the resource and grant', () => {
    const parts = request();
    const grant = fields(fields(parts.auth).grantRequest);
    expect(grant.retry).toBeDefined();
    expect(grant.retry).toBe(parts.retry);
  });

  it('declares the six explicit retry outcome tags and the exact status code number', () => {
    const on = fields(request().retry).on;
    if (typeof on !== 'object' || on.kind !== 'array') throw new Error('expected retry outcome list');
    const tags = on.of;
    if (typeof tags !== 'object' || tags.kind !== 'union') throw new Error('expected closed retry outcome union');
    expect(tags.of).toHaveLength(7);
    expect(tags.of).toContain('number');
    expect(tags.of).toEqual(expect.arrayContaining(
      ['1xx', '408', '5xx', '429', 'timeout', 'failed'].map(value => ({ kind: 'literal', value })),
    ));
    expect(tags.of).not.toContain('string');
    expect(tags.of).not.toContainEqual({ kind: 'literal', value: 'cancelled' });
    expect(tags.of).not.toContainEqual({ kind: 'literal', value: '4xx' });
  });

  it('declares the closed retry shape with both explicit delay forms and the shared-index cap', () => {
    const retry = request().retry;
    const policy = fields(retry);
    expect(Object.keys(policy).sort()).toEqual(['backoffMs', 'max', 'noResponseMax', 'on', 'scheduleMs']);
    expect(retry).not.toHaveProperty('open', true);
    expect(policy.max).toBe('number');
    expect(policy.backoffMs).toBe('number');
    expect(policy.scheduleMs).toEqual({ kind: 'array', of: 'number' });
    expect(policy.noResponseMax).toBe('number');
    expect(policy.timeoutMs).toBeUndefined();
    expect(policy.headers).toBeUndefined();
  });

  it('declares the grant deadline with its explicitly nullable millisecond type', () => {
    const grant = fields(fields(request().auth).grantRequest);
    expect(grant.timeoutMs).toEqual({ kind: 'union', of: ['number', { kind: 'literal', value: null }] });
    expect(grant.nowMs).toBeUndefined();
    expect(grant.origin).toBeUndefined();
    expect(grant.tokenUrl).toBeUndefined();
  });

  it('declares the existing nullable resource deadline independently of grant options', () => {
    const parts = request();
    expect(parts.timeoutMs).toEqual({ kind: 'union', of: ['number', { kind: 'literal', value: null }] });
    expect(parts.nowMs).toBeUndefined();
    expect(parts.text).toBe('string');
    expect(parts.bytes).toBe('string');
  });
});

describe('OAuth and OS grant metadata', () => {
  const oauth = () => STD_OPERATORS.http.oauth;

  it('names every oauth-client op the auth `op` union allows, each with its inputs and endpoint', () => {
    const auth = fields(STD_OPERATORS.http.params?.[3]?.type);
    const opType = fields(auth.auth).op;
    if (typeof opType !== 'object' || opType.kind !== 'union') throw new Error('expected the op union');
    const words = opType.of.map((member) => (typeof member === 'object' && member.kind === 'literal' ? member.value : undefined));
    expect(oauth()?.ops.map((op) => op.name)).toEqual(words);
    expect(oauth()?.ops.find((op) => op.name === 'connect')).toEqual({ name: 'connect', required: ['code', 'state', 'provider'], optional: [], endpoint: 'token' });
    expect(oauth()?.ops.find((op) => op.name === 'discovery')?.endpoint).toBeUndefined();
    expect(oauth()?.endpointTarget).toBe('oauth-endpoint');
    expect(canonical.operators.http.oauth).toEqual(oauth());
  });

  it('control: only http carries oauth metadata, and every endpoint an op names is a declared endpoint kind', () => {
    expect(Object.entries(STD_OPERATORS).filter(([, m]) => m.oauth).map(([name]) => name)).toEqual(['http']);
    for (const op of oauth()?.ops ?? []) {
      if (op.endpoint !== undefined) expect(oauth()?.endpointKinds).toContain(op.endpoint);
    }
  });

  it('declares a grant on every os/ and kv/ effect, and on nothing else', () => {
    const host = Object.entries(STD_OPERATORS).filter(([, m]) => m.host === 'os' || m.host === 'kv');
    expect(host.length).toBe(102);
    for (const [name, meta] of host) expect(meta.grant, name).toBeDefined();
    expect(Object.entries(STD_OPERATORS).filter(([, m]) => m.grant && m.host !== 'os' && m.host !== 'kv')).toEqual([]);
  });

  it('declares argument positions that exist and a handle call with no need', () => {
    expect(STD_OPERATORS['os/copy'].grant).toEqual([
      { kind: 'fs', access: 'read', path: 0 },
      { kind: 'fs', access: 'create', path: 1 },
    ]);
    expect(STD_OPERATORS['os/sendto'].grant).toEqual([{ kind: 'net', access: ['udp'], host: 2, port: 3 }]);
    expect(STD_OPERATORS['os/read'].grant).toEqual([]);
    for (const [name, meta] of Object.entries(STD_OPERATORS)) {
      for (const need of meta.grant ?? []) {
        const positions = Object.entries(need).filter(([key, value]) => typeof value === 'number' && key !== 'kind').map(([, value]) => value as number);
        for (const at of positions) expect(at, name).toBeLessThan(meta.params?.length ?? 0);
      }
    }
  });
});

describe('host effect and key metadata', () => {
  const optionsOf = (name: string) => fields(STD_OPERATORS[name].params?.at(-1)?.type);

  it('marks exactly the host effects as closed calls, with the byte range as data', () => {
    const marked = Object.entries(STD_OPERATORS).filter(([, m]) => m.closedCall).map(([name]) => name).sort();
    expect(marked).toEqual(['access-check', 'credential-forget', 'credential-list', 'credential-mode', 'credential-remove', 'credential-rotate', 'credential-set', 'credential-status', 'credential-test', 'random-bytes']);
    expect(STD_OPERATORS['random-bytes'].closedCall).toEqual({ intRange: { arg: 0, min: 1, max: 1024 } });
    expect(STD_OPERATORS['credential-set'].closedCall).toEqual({ request: true });
    expect(STD_OPERATORS.fetch.closedCall).toBeUndefined();
  });

  it('declares the credential-list request closed with service optional, and the others with every field required', () => {
    const list = STD_OPERATORS['credential-list'].params?.[0]?.type;
    expect(list).toEqual({ kind: 'object', fields: { service: 'string' }, optional: ['service'] });
    const set = STD_OPERATORS['credential-set'].params?.[0]?.type;
    expect(set).toMatchObject({ kind: 'object' });
    expect(set && typeof set === 'object' && 'optional' in set ? set.optional : undefined).toBeUndefined();
  });

  it('gives oauth-authorize the key its lint checks, and random-bytes the only other keyed host effect', () => {
    expect(Object.keys(optionsOf('oauth-authorize'))).toEqual(['key', 'emit']);
    expect(Object.keys(optionsOf('random-bytes'))).toEqual(['key', 'emit']);
    for (const name of ['access-check', 'credential-status', 'oauth-connection-status', 'oauth-connection-forget']) expect(optionsOf(name).key, name).toBeUndefined();
  });

  it('declares program/compose options as the app name, layout, theme and overrides, not the emit envelope', () => {
    const options = STD_OPERATORS['program/compose'].params?.[1]?.type;
    expect(options).toMatchObject({ kind: 'object', optional: ['layout', 'theme', 'overrides'] });
    expect(Object.keys(fields(options))).toEqual(['appName', 'layout', 'theme', 'overrides']);
  });

  it('carries a key only on the ask families that echo one: call/http, random-bytes, oauth-authorize, os/, kv/, browser/, auth/sign-in and the program host', () => {
    const keyed = Object.entries(STD_OPERATORS).filter(([, m]) => m.params?.some((p) => typeof p.type === 'object' && p.type.kind === 'object' && 'key' in p.type.fields)).map(([name]) => name);
    const allowed = new Set(['call-service', 'http', 'random-bytes', 'oauth-authorize']);
    for (const name of keyed) {
      const m = STD_OPERATORS[name];
      expect(allowed.has(name) || name.startsWith('os/') || name.startsWith('kv/') || name.startsWith('browser/') || name === 'auth/sign-in' || m.host === 'program', name).toBe(true);
    }
    for (const name of ['fetch', 'persist', 'fetch-stream', 'credential-set']) expect(keyed, name).not.toContain(name);
  });
});

describe('retired protocol operators', () => {
  it('keeps no protocol operator: the std drivers speak over os/tcp-connect', () => {
    expect(STD_OPERATORS.redis).toBeUndefined();
    expect(canonical.operators.redis).toBeUndefined();
  });
});
