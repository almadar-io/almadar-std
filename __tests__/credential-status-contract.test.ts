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
    expect(STD_OPERATORS['credential-status'].effect?.produces).toEqual({ kind: 'object', fields: { connected: 'boolean', label: 'string' } });
    expect(STD_OPERATORS['credential-forget'].params?.[0]?.type).toBe('string');
    expect(STD_OPERATORS['credential-forget'].description).toMatch(/signed-in viewer/i);
  });
});

describe('credential administration effects', () => {
  const admin = ['credential-list', 'credential-set', 'credential-remove', 'credential-test', 'credential-mode', 'credential-rotate'] as const;

  it('are server effects with one request argument (none for rotate), optional routes and the payload the kernel answers', () => {
    for (const name of admin) {
      const arity = name === 'credential-rotate' ? { minArity: 0, maxArity: 1 } : { minArity: 1, maxArity: 2 };
      expect(STD_OPERATORS[name], name).toMatchObject({ ...arity, runsOn: 'server', hasSideEffects: true, returnType: 'void' });
      expect(STD_OPERATORS[name].effect?.kind).toBe(name);
      expect(canonical.operators[name].params).toEqual(STD_OPERATORS[name].params);
    }
    expect(STD_OPERATORS['credential-set'].effect?.produces).toEqual({ kind: 'object', fields: { saved: 'boolean' } });
    expect(STD_OPERATORS['credential-rotate'].effect?.produces).toEqual({ kind: 'object', fields: { rotated: 'number', alreadyCurrent: 'number', unreadable: 'number' } });
  });

  it('name the role gate on every changing effect and leave list open', () => {
    for (const name of ['credential-set', 'credential-remove', 'credential-test', 'credential-mode', 'credential-rotate'] as const) {
      expect(STD_OPERATORS[name].description, name).toMatch(/ALMADAR_CREDENTIAL_ADMIN_ROLES/);
    }
    expect(STD_OPERATORS['credential-list'].description).toMatch(/role gate are the std-credential-admin program's/i);
    expect(STD_OPERATORS['credential-list'].description).not.toMatch(/ALMADAR_CREDENTIAL_ADMIN_ROLES/);
  });

  it('hash/scrypt is a pure two-argument operator over a hex salt', () => {
    expect(STD_OPERATORS['hash/scrypt']).toMatchObject({ minArity: 2, maxArity: 2, hasSideEffects: false, category: 'std-codec' });
    expect(canonical.operators['hash/scrypt'].params).toEqual(STD_OPERATORS['hash/scrypt'].params);
    expect(STD_OPERATORS['hash/scrypt'].runsOn).toBeUndefined();
  });
});

describe('credential-connect grant contract', () => {
  const connect = STD_OPERATORS['credential-connect'];
  const request = connect.params?.[0]?.type;

  it('declares grant as a union of the four literal words and publishes it in the table', () => {
    expect(request).toMatchObject({ kind: 'object', fields: { grant: { kind: 'union' } } });
    const grant = typeof request === 'object' && request.kind === 'object' ? request.fields.grant : undefined;
    const members = typeof grant === 'object' && grant.kind === 'union' ? grant.of : [];
    const words = members.map((member) => (typeof member === 'object' && member.kind === 'literal' ? member.value : null));
    expect(words).toEqual(['authorization_code', 'refresh_token', 'jwt-bearer', 'json-token']);
    expect(canonical.operators['credential-connect'].params[0]).toEqual(connect.params?.[0]);
    expect(canonical.operators['credential-connect'].closedCall).toEqual(connect.closedCall);
  });

  it('lists required keys for exactly the declared grant words, each a declared request field the shape leaves optional or required', () => {
    const by = connect.closedCall?.requestKeysByLiteral;
    const fields = Object.keys((request as { fields: Record<string, unknown> }).fields);
    expect(by?.key).toBe('grant');
    expect(Object.keys(by?.required ?? {})).toEqual(['authorization_code', 'refresh_token', 'jwt-bearer', 'json-token']);
    for (const keys of Object.values(by?.required ?? {})) {
      for (const key of keys) expect(fields).toContain(key);
    }
    expect(by?.required['authorization_code']).toEqual(['code', 'redirectUri', 'clientAuth']);
  });

  it('control: no other closed call declares per-literal request keys', () => {
    const others = Object.entries(STD_OPERATORS).filter(([name, meta]) => name !== 'credential-connect' && meta.closedCall?.requestKeysByLiteral);
    expect(others).toEqual([]);
  });
});
