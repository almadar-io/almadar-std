import { describe, it, expect } from 'vitest';

import { STD_OPERATORS } from '../registry.js';
import type { OperatorTypeRef } from '../types.js';

function objectAt(ref: OperatorTypeRef | undefined, path: string[]): Extract<OperatorTypeRef, { kind: 'object' }> {
  let at = ref;
  for (const step of path) {
    if (at === undefined || typeof at === 'string') throw new Error(`no ${step}`);
    if (at.kind === 'array') at = at.of;
    if (typeof at === 'string' || at.kind !== 'object') throw new Error(`not an object at ${step}`);
    at = at.fields[step];
  }
  if (at === undefined || typeof at === 'string') throw new Error('no type');
  if (at.kind === 'array') at = at.of;
  if (typeof at === 'string' || at.kind !== 'object') throw new Error('not an object');
  return at;
}

describe('program/step played effect', () => {
  const effect = objectAt(STD_OPERATORS['program/step'].returnType, ['result', 'effects']);

  it('declares the nested effects a compound effect ran, as an optional list', () => {
    expect(effect.fields.nested).toBeDefined();
    expect(effect.optional).toContain('nested');
  });

  it('control: type, args, status and routed stay required', () => {
    for (const field of ['type', 'args', 'status', 'routed']) {
      expect(effect.fields[field]).toBeDefined();
      expect(effect.optional ?? []).not.toContain(field);
    }
  });
});
