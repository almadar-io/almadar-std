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
    expect(Object.keys(fields(grantRequest)).sort()).toEqual(['headers', 'retry', 'timeoutMs']);
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
