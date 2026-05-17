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
  extractManifest,
} from '../factory-runtime/index.js';

const REGISTRY_ROOT = join(__dirname, '..', 'behaviors', 'registry');

async function loadOrb(topic: string, tier: string, name: string): Promise<OrbitalSchema> {
  const path = join(REGISTRY_ROOT, topic, tier, `${name}.orb`);
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as OrbitalSchema;
}

describe('factory-runtime', () => {
  describe('extractManifest', () => {
    it('emits one manifest per orbital with the canonical six paramFields + trait splits', async () => {
      const orb = await loadOrb('app', 'organisms', 'std-embedded-dashboard');
      const manifests = extractManifest(orb);

      expect(manifests.length).toBe(orb.orbitals.length);
      const dash = manifests.find((m) => m.orbitalName === 'DashboardOrbital');
      expect(dash).toBeDefined();
      if (!dash) throw new Error('expected DashboardOrbital manifest');

      expect(dash.organism).toBe('std-embedded-dashboard');
      expect(dash.paramFields.map((f) => f.name)).toEqual([
        'fields',
        'pagePath',
        'persistence',
        'entityName',
        'collection',
        'traitOverrides',
      ]);
      // traitNames is the set of imported (ref:) traits — must be non-empty
      // for this organism, and must not contain any inline-only names.
      expect(dash.traitNames.length).toBeGreaterThan(0);
      for (const refName of dash.traitNames) {
        expect(dash.inlineTraitNames).not.toContain(refName);
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

      const overrides: Record<string, { config?: Record<string, unknown> }> = {};
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
});
