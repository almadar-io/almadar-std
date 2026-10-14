import { describe, it, expect } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import canonical from '../canonical-operators.json';

interface CanonicalParam {
  name: string;
  type: unknown;
}

const canonicalOps: Record<string, { category: string; params?: CanonicalParam[] }> = canonical.operators;

/**
 * The argument types both evaluators check (D-12) are the module sources' `params`. The generated registry carries
 * the same lists, not a curated copy that outlives them.
 */
describe('operator params: the module source is the contract', () => {
  it('every generated params list is the module list', () => {
    const drift = Object.entries(STD_OPERATORS)
      .filter(([name, meta]) => {
        const generated = canonicalOps[name]?.params;
        const source = meta.params;
        const names = (list: { name: string; type: unknown }[] | undefined) => JSON.stringify((list ?? []).map((p) => [p.name, p.type]));
        return names(generated) !== names(source);
      })
      .map(([name]) => name);
    expect(drift).toEqual([]);
  });

  it('declares every position of the subtraction and the default operators the evaluators check', () => {
    expect(STD_OPERATORS['-'].params?.map((p) => p.name)).toEqual(['a', 'b']);
    expect(STD_OPERATORS['math/default'].params).toHaveLength(2);
    expect(STD_OPERATORS['str/default'].params).toHaveLength(2);
    expect(STD_OPERATORS['validate/length'].params?.map((p) => p.name)).toEqual(['value', 'exact']);
  });

  it('control: the logic operators declare booleans and type variables, never `any`', () => {
    expect(STD_OPERATORS.and.params?.[0].type).toEqual({ kind: 'var', name: 'T' });
    expect(STD_OPERATORS.or.params?.[0].type).toEqual({ kind: 'var', name: 'T' });
    expect(STD_OPERATORS.not.params?.[0].type).toBe('boolean');
    expect(STD_OPERATORS['<'].params?.[0].type).toEqual({ kind: 'var', name: 'T', bound: { kind: 'union', of: ['number', 'string'] } });
  });
});
