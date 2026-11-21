// A data effect runs where its entity lives: `fetch`/`persist` declare which
// argument names the entity, and the site follows that entity's residence.
import { describe, expect, it } from 'vitest';
import { STD_OPERATORS } from '../registry.js';

describe('entityArgPosition', () => {
  it('fetch and persist declare their entity argument', () => {
    expect(STD_OPERATORS['fetch'].entityArgPosition).toBe(0);
    expect(STD_OPERATORS['persist'].entityArgPosition).toBe(1);
  });

  it('only server-run effects declare one', () => {
    const declaring = Object.entries(STD_OPERATORS).filter(([, m]) => m.entityArgPosition !== undefined);
    expect(declaring.every(([, m]) => m.runsOn === 'server')).toBe(true);
  });
});

