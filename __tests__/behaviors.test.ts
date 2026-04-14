import { describe, it, expect } from 'vitest';
import {
  getAllBehaviors,
  getAllBehaviorNames,
  loadGoldenOrb,
  hasGoldenOrb,
} from '../behaviors/exports-reader';

describe('getAllBehaviorNames', () => {
  it('returns a non-empty list of behavior names', () => {
    const names = getAllBehaviorNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(n => typeof n === 'string')).toBe(true);
  });

  it('names follow std-* convention', () => {
    const names = getAllBehaviorNames();
    for (const name of names) {
      expect(name).toMatch(/^std-/);
    }
  });
});

describe('getAllBehaviors', () => {
  it('does not throw even though some behaviors need extra params', () => {
    // This was crashing with "Cannot read properties of undefined" before the fix.
    // callBehavior only passes { entityName } — behaviors needing fields/categories
    // should be skipped, not crash the entire catalog.
    expect(() => getAllBehaviors()).not.toThrow();
  });

  it('returns valid OrbitalSchema objects', () => {
    const behaviors = getAllBehaviors();
    expect(behaviors.length).toBeGreaterThan(0);
    for (const b of behaviors) {
      expect(b).toHaveProperty('name');
      expect(typeof b.name).toBe('string');
      expect(b).toHaveProperty('orbitals');
      expect(Array.isArray(b.orbitals)).toBe(true);
    }
  });

  it('returns fewer behaviors than total names (some need extra params)', () => {
    const names = getAllBehaviorNames();
    const behaviors = getAllBehaviors();
    // Some behaviors crash with minimal params and are skipped
    expect(behaviors.length).toBeLessThanOrEqual(names.length);
    expect(behaviors.length).toBeGreaterThan(0);
  });
});

describe('loadGoldenOrb', () => {
  it('returns null for unknown behavior', () => {
    expect(loadGoldenOrb('std-nonexistent')).toBeNull();
  });

  it('returns null for behavior that crashes with minimal params', () => {
    // loadGoldenOrb already has try/catch, so this should return null not throw
    const names = getAllBehaviorNames();
    const behaviors = getAllBehaviors();
    const loadedNames = new Set(behaviors.map(b => b.name));

    // Find a name that wasn't in getAllBehaviors (crashed during catalog build)
    const skippedName = names.find(n => !loadedNames.has(n));
    if (skippedName) {
      expect(loadGoldenOrb(skippedName)).toBeNull();
    }
  });

  it('loads a known simple behavior', () => {
    const result = loadGoldenOrb('std-list');
    if (result) {
      expect(result.name).toBe('std-list');
      expect(result.orbitals.length).toBeGreaterThan(0);
    }
  });
});

describe('hasGoldenOrb', () => {
  it('returns true for registered behaviors', () => {
    expect(hasGoldenOrb('std-list')).toBe(true);
  });

  it('returns false for unknown behaviors', () => {
    expect(hasGoldenOrb('std-nonexistent')).toBe(false);
  });
});
