import { describe, expect, it } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import canonical from '../canonical-operators.json';

describe('credential-status scope contract', () => {
  it('publishes the same explicit scope selection without changing forget', () => {
    expect(canonical.operators['credential-status'].params).toEqual(STD_OPERATORS['credential-status'].params);
    expect(canonical.operators['credential-forget'].params).toEqual(STD_OPERATORS['credential-forget'].params);
  });

  it('declares a bare credential or a closed object with explicit app/user scope', () => {
    expect(STD_OPERATORS['credential-status'].params?.[0]?.type).toEqual({
      kind: 'union',
      of: ['string', { kind: 'object', fields: {
        credential: 'string',
        scope: { kind: 'union', of: [{ kind: 'literal', value: 'app' }, { kind: 'literal', value: 'user' }] },
      } }],
    });
    expect(STD_OPERATORS['credential-status'].description).toMatch(/bare.*user/i);
    expect(STD_OPERATORS['credential-status'].description).toMatch(/app/i);
  });

  it('keeps server residence, arity, payload and user-only forget unchanged', () => {
    expect(STD_OPERATORS['credential-status']).toMatchObject({ minArity: 1, maxArity: 2, runsOn: 'server', returnType: 'void' });
    expect(STD_OPERATORS['credential-status'].effect?.produces).toEqual({ kind: 'object', fields: { connected: 'boolean' } });
    expect(STD_OPERATORS['credential-forget'].params?.[0]?.type).toBe('string');
    expect(STD_OPERATORS['credential-forget'].description).toMatch(/signed-in viewer/i);
  });
});

describe('credential administration effects', () => {
  const admin = ['credential-list', 'credential-set', 'credential-remove', 'credential-test', 'credential-mode', 'credential-rotate'] as const;

  it('are server effects with one request argument, optional routes and the payload the kernel answers', () => {
    for (const name of admin) {
      expect(STD_OPERATORS[name], name).toMatchObject({ minArity: 1, maxArity: 2, runsOn: 'server', hasSideEffects: true, returnType: 'void' });
      expect(STD_OPERATORS[name].effect?.kind).toBe(name);
      expect(canonical.operators[name].params).toEqual(STD_OPERATORS[name].params);
    }
    expect(STD_OPERATORS['credential-set'].effect?.produces).toEqual({ kind: 'object', fields: { saved: 'boolean', service: 'string', envVar: 'string', last4: 'string' } });
    expect(STD_OPERATORS['credential-rotate'].effect?.produces).toEqual({ kind: 'object', fields: { rotated: 'number', alreadyCurrent: 'number', unreadable: 'number' } });
  });

  it('name the role gate on every changing effect and leave list open', () => {
    for (const name of ['credential-set', 'credential-remove', 'credential-test', 'credential-mode', 'credential-rotate'] as const) {
      expect(STD_OPERATORS[name].description, name).toMatch(/ALMADAR_CREDENTIAL_ADMIN_ROLES/);
    }
    expect(STD_OPERATORS['credential-list'].description).toMatch(/open to every caller/i);
    expect(STD_OPERATORS['credential-list'].description).not.toMatch(/ALMADAR_CREDENTIAL_ADMIN_ROLES/);
  });

  it('hash/scrypt is a pure two-argument operator over a hex salt', () => {
    expect(STD_OPERATORS['hash/scrypt']).toMatchObject({ minArity: 2, maxArity: 2, hasSideEffects: false, category: 'std-codec' });
    expect(canonical.operators['hash/scrypt'].params).toEqual(STD_OPERATORS['hash/scrypt'].params);
    expect(STD_OPERATORS['hash/scrypt'].runsOn).toBeUndefined();
  });
});
