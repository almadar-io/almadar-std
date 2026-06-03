/**
 * Smoke tests for `@almadar/std/factory-runtime`.
 *
 * Both cases validate the public contract — not the implementation. Bigger
 * end-to-end coverage lives in `orbital-verify` + `runtime-verify` on the
 * representative organism (per the SDK plan).
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import type { OrbitalSchema } from '@almadar/core';
import {
  applyParamsToOrb,
  applyParamsToWholeOrb,
  extractManifest,
} from '../factory-runtime/index.js';
import type { OrbitalTraitOverride } from '../factory-runtime/index.js';

const REGISTRY_ROOT = join(__dirname, '..', 'behaviors', 'registry');

async function loadOrb(topic: string, tier: string, name: string): Promise<OrbitalSchema> {
  const path = join(REGISTRY_ROOT, topic, tier, `${name}.orb`);
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as OrbitalSchema;
}

describe('factory-runtime', () => {
  describe('extractManifest', () => {
    it('emits one manifest per orbital with the canonical six paramFields + trait splits', async () => {
      const orb = await loadOrb('core', 'organisms', 'std-generic-app');
      const manifests = extractManifest(orb);

      expect(manifests.length).toBe(orb.orbitals.length);
      const item = manifests.find((m) => m.orbitalName === 'ItemOrbital');
      expect(item).toBeDefined();
      if (!item) throw new Error('expected ItemOrbital manifest');

      expect(item.organism).toBe('std-generic-app');
      expect(item.paramFields.map((f) => f.name)).toEqual([
        'fields',
        'pagePath',
        'persistence',
        'entityName',
        'collection',
        'traitOverrides',
      ]);
      // traitNames is the set of imported (ref:) traits — must be non-empty
      // for this organism, and must not contain any inline-only names.
      expect(item.traitNames.length).toBeGreaterThan(0);
      for (const refName of item.traitNames) {
        expect(item.inlineTraitNames).not.toContain(refName);
      }
    });
  });

  describe('applyParamsToOrb', () => {
    it('applies entityName + traitOverrides.config to a resolved orbital', async () => {
      // std-list is a small single-orbital molecule — simple shape to
      // exercise both entity rename and trait config merge.
      const orb = await loadOrb('core', 'molecules', 'std-list');
      const manifests = extractManifest(orb);
      const orbital = orb.orbitals[0];
      const manifest = manifests.find((m) => m.orbitalName === orbital.name);
      if (!manifest) throw new Error('expected manifest for first orbital');

      const overrides: Record<string, OrbitalTraitOverride> = {};
      if (manifest.traitNames.length > 0) {
        const firstTrait = manifest.traitNames[0];
        overrides[firstTrait] = { config: { listLabel: 'Custom Label' } };
      }

      const built = applyParamsToOrb(orb, orbital.name, manifest, {
        entityName: 'CustomThing',
        traitOverrides: overrides,
      });

      const entity = built.entity;
      if (typeof entity === 'string' || 'extends' in entity) {
        throw new Error('expected resolved Entity, got reference form');
      }
      expect(entity.name).toBe('CustomThing');

      if (manifest.traitNames.length > 0) {
        const firstTraitName = manifest.traitNames[0];
        const overridden = built.traits.find(
          (t) =>
            t !== null &&
            typeof t === 'object' &&
            'name' in t &&
            t.name === firstTraitName,
        );
        expect(overridden).toBeDefined();
      }
    });
  });

  describe('applyParamsToWholeOrb', () => {
    it('applies the same params bag to every orbital with a matching manifest', async () => {
      // std-generic-app is multi-orbital (8 orbitals) — broadest exercise for the
      // whole-orb path that the LLM-loop seam (`call_behavior`) takes.
      const orb = await loadOrb('core', 'organisms', 'std-generic-app');
      const manifests = extractManifest(orb);
      const built = applyParamsToWholeOrb(orb, manifests, {
        entityName: 'Metric',
      });
      expect(built.name).toBe(orb.name);
      expect(built.orbitals.length).toBe(orb.orbitals.length);
      // Every orbital that had a manifest should have its entity renamed
      // to 'Metric'. Orbitals without a manifest pass through unchanged.
      const manifestNames = new Set(manifests.map((m) => m.orbitalName));
      for (const orbital of built.orbitals) {
        if (!manifestNames.has(orbital.name)) continue;
        const entity = orbital.entity;
        if (typeof entity === 'string' || 'extends' in entity) {
          throw new Error('expected resolved Entity on rebuilt orbital');
        }
        expect(entity.name).toBe('Metric');
      }
    });
  });
});
