import { describe, it, expect } from 'vitest';
import { explodeBehaviorComposition } from '../behaviors/explode-behavior-composition';

describe('explodeBehaviorComposition', () => {
  describe('leaf atom (std-browse)', () => {
    it('returns a non-empty TraitReference array', () => {
      const refs = explodeBehaviorComposition('std-browse');
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    it('each entry carries a ref and from', () => {
      const refs = explodeBehaviorComposition('std-browse');
      for (const ref of refs) {
        expect(ref.ref).toBeTruthy();
        expect(ref.from).toBeTruthy();
      }
    });
  });

  describe('molecule (std-cart)', () => {
    it('returns a non-empty TraitReference array', () => {
      const refs = explodeBehaviorComposition('std-cart');
      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    it('backfills `from` from uses: header when the ref uses an alias', () => {
      const refs = explodeBehaviorComposition('std-cart');
      for (const ref of refs) {
        if (/^[A-Z][a-zA-Z0-9]*\.traits\./.test(ref.ref)) {
          expect(ref.from, `ref ${ref.ref} should have from populated`).toBeDefined();
        }
      }
    });
  });

  describe('unknown behavior', () => {
    it('throws with a descriptive message', () => {
      expect(() => explodeBehaviorComposition('std-does-not-exist')).toThrow(
        /not exported from @almadar\/std/,
      );
    });
  });
});
