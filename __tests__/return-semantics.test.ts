import { describe, it, expect } from 'vitest';
import { STD_OPERATORS } from '../registry.js';

const PROVENANCE = /^(?:identity-of-arg|union-of-args)<(\d+(?:,\d+)*)>$/;

describe('returnSemantics provenance declarations', () => {
  it('every index a provenance kind names is a required argument of its operator', () => {
    for (const [name, meta] of Object.entries(STD_OPERATORS)) {
      const match = meta.returnSemantics ? PROVENANCE.exec(meta.returnSemantics) : null;
      if (!match) continue;
      for (const index of match[1].split(',').map(Number)) {
        expect(index, `${name} names arg ${index}`).toBeLessThan(meta.minArity);
      }
    }
  });

  it('list-shaping operators declare what their result elements are drawn from', () => {
    const declared = (name: string) => STD_OPERATORS[name]?.returnSemantics;
    for (const name of ['slice', 'sort', 'take', 'drop', 'takeLast', 'dropLast', 'reverse', 'shuffle', 'unique', 'remove', 'removeItem']) {
      expect(declared(`array/${name}`), name).toBe('identity-of-arg<0>');
    }
    expect(declared('array/concat')).toBe('union-of-args');
    expect(declared('array/append')).toBe('union-of-args<0,1>');
    expect(declared('array/prepend')).toBe('union-of-args<0,1>');
    expect(declared('array/insert')).toBe('union-of-args<0,2>');
    expect(declared('do')).toBe('last-of-args');
    expect(declared('let')).toBe('identity-of-arg<1>');
  });

  it('operators that create new elements stay undeclared', () => {
    for (const name of ['range', 'zip', 'groupBy', 'partition', 'flatten']) {
      expect(STD_OPERATORS[`array/${name}`]?.returnSemantics, name).toBeUndefined();
    }
  });
});
