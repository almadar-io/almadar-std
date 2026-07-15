/**
 * Smoke tests for `@almadar/std/factory-runtime`.
 *
 * Both cases validate the public contract — not the implementation. Bigger
 * end-to-end coverage lives in `orbital-verify` + `runtime-verify` on the
 * representative organism (per the SDK plan).
 */

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type { OrbitalSchema, TraitConfigValue } from '@almadar/core';
import {
  applyParamsToOrb,
  applyParamsToWholeOrb,
  applyDeclarationEntityRename,
  extractManifest,
} from '../factory-runtime/index.js';
import type { OrbitalTraitOverride } from '../factory-runtime/index.js';

const REGISTRY_ROOT = join(__dirname, '..', 'behaviors', 'registry');
const SIGNATURES_PATH = join(__dirname, '..', 'behaviors', 'registry', 'factory-signatures.json');

// ─── Config-override round-trip helpers ───────────────────────────────────────

interface OverridableConfigKey {
  readonly key: string;
  readonly type: string;
  readonly default?: unknown;
  readonly enumValues?: readonly string[];
}

interface TraitSig {
  readonly name: string;
  readonly overridableConfigKeys: readonly OverridableConfigKey[];
}

interface FactorySig {
  readonly organism: string;
  readonly orbital: string;
  readonly tier: string;
  readonly factoryPath: string;
  readonly traits: readonly TraitSig[];
}

interface FactorySignatureCatalog {
  readonly signatures: readonly FactorySig[];
}

/**
 * Synthesize a non-default value for every overridable config key so the
 * round-trip exercises a non-trivial override path through `applyParamsToOrb`.
 * The logic mirrors what the bug exposed: the old code flat-spread a config
 * object into a bare value, producing a schema `orb resolve` rejects.
 */
function synthesizeConfigOverride(knobs: readonly OverridableConfigKey[]): Record<string, TraitConfigValue> {
  const out: Record<string, TraitConfigValue> = {};
  for (const knob of knobs) {
    if (knob.type === 'boolean') {
      out[knob.key] = !(knob.default ?? false);
    } else if (knob.enumValues && knob.enumValues.length > 0) {
      out[knob.key] = knob.enumValues[0] as string;
    } else if (knob.type === 'number') {
      out[knob.key] = (typeof knob.default === 'number' ? knob.default : 0) + 1;
    } else {
      out[knob.key] = (knob.default ?? null) as TraitConfigValue;
    }
  }
  return out;
}

function resolveOrbBinary(): string | null {
  const homeOrb = join(process.env['HOME'] ?? '', 'bin', 'orb');
  if (existsSync(homeOrb)) return homeOrb;
  try {
    const { spawnSync: sp } = require('node:child_process') as typeof import('node:child_process');
    const r = sp('which', ['orb'], { encoding: 'utf-8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  } catch { /* not on PATH */ }
  return null;
}

/** Derive the .orb path from a factory signature's factoryPath. */
function orbPathFromSig(sig: FactorySig): string {
  // factoryPath: behaviors/functions/<topic>/[<subtopic>/]<tier>/<organism>.ts
  // .orb:        behaviors/registry/<topic>/[<subtopic>/]<tier>/<organism>.orb
  // REGISTRY_ROOT already points to behaviors/registry.
  const rel = sig.factoryPath
    .replace('behaviors/functions/', '')
    .replace(/\.ts$/, '.orb');
  return join(REGISTRY_ROOT, rel);
}

async function loadOrb(topic: string, tier: string, name: string): Promise<OrbitalSchema> {
  const path = join(REGISTRY_ROOT, topic, tier, `${name}.orb`);
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as OrbitalSchema;
}

describe('factory-runtime', () => {
  describe('extractManifest', () => {
    it('emits one manifest per orbital with the canonical six paramFields + trait splits', async () => {
      // std-list — a persisted single-orbital atom (entity `ListItem`,
      // collection `listitems`) so the persisted override surface
      // (persistence + collection) is present alongside the base four.
      const orb = await loadOrb('ui/core', 'atoms', 'std-list');
      const manifests = extractManifest(orb);

      expect(manifests.length).toBe(orb.orbitals.length);
      const item = manifests.find((m) => m.orbitalName === 'ListItemOrbital');
      expect(item).toBeDefined();
      if (!item) throw new Error('expected ListItemOrbital manifest');

      expect(item.organism).toBe('std-list');
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
    it('emits the CANONICAL entity + applies traitOverrides.config; the rename is post-stamp', async () => {
      // std-list is a small single-orbital atom — simple shape to exercise
      // both the (deferred) entity rename and the trait config merge.
      const orb = await loadOrb('ui/core', 'atoms', 'std-list');
      const manifests = extractManifest(orb);
      const orbital = orb.orbitals[0];
      const manifest = manifests.find((m) => m.orbitalName === orbital.name);
      if (!manifest) throw new Error('expected manifest for first orbital');
      const canonicalEntity =
        typeof orbital.entity === 'object' ? orbital.entity.name : '';

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
      // V4-W4 stamp-before-rename: the factory emits the CANONICAL entity name.
      // The `entityName` rename is a declaration-only concern applied AFTER
      // stamping (never inline), so the factory output still carries `ListItem`.
      expect(entity.name).toBe(canonicalEntity);

      // The trait config override IS applied inline (config is not a rename).
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

      // The declaration rename (the post-stamp step) renames the entity + every
      // inline trait's `linkedEntity` from canonical → effective, leaving the
      // `@entity` body tokens (resolved by stamped id) untouched.
      const renamed = applyDeclarationEntityRename(
        { name: orb.name, orbitals: [built] },
        { from: canonicalEntity, to: 'CustomThing' },
      );
      const renamedEntity = renamed.orbitals[0].entity;
      if (typeof renamedEntity !== 'object') throw new Error('expected resolved Entity');
      expect(renamedEntity.name).toBe('CustomThing');
      for (const t of renamed.orbitals[0].traits) {
        if (t && typeof t === 'object' && 'stateMachine' in t && t.linkedEntity !== undefined) {
          expect(t.linkedEntity).toBe('CustomThing');
        }
      }
    });
  });

  describe('applyParamsToWholeOrb', () => {
    it('rebuilds every orbital preserving its CANONICAL entity name (rename is post-stamp)', async () => {
      // learning-chemistry is multi-orbital (3 orbitals: Diffusion/Reaction/
      // Osmosis) — broadest exercise for the whole-orb path the LLM-loop seam
      // (`call_behavior`) takes.
      const orb = await loadOrb('ui/learning', 'organisms', 'learning-chemistry');
      const manifests = extractManifest(orb);
      const canonicalByOrbital = new Map(
        orb.orbitals.map((o) => [
          o.name,
          typeof o.entity === 'object' ? o.entity.name : '',
        ]),
      );
      const built = applyParamsToWholeOrb(orb, manifests, {
        entityName: 'Metric',
      });
      expect(built.name).toBe(orb.name);
      expect(built.orbitals.length).toBe(orb.orbitals.length);
      // V4-W4 stamp-before-rename: the whole-orb overlay emits each orbital's
      // CANONICAL entity name. A single `entityName` cannot rename a multi-orbital
      // whole-orb (each orbital owns a distinct entity), so every entity keeps its
      // canonical name; the rename is a post-stamp, single-orbital-gated concern.
      for (const orbital of built.orbitals) {
        const entity = orbital.entity;
        if (typeof entity === 'string' || 'extends' in entity) {
          throw new Error('expected resolved Entity on rebuilt orbital');
        }
        expect(entity.name).toBe(canonicalByOrbital.get(orbital.name));
      }
    });
  });

  describe('config-override round-trip (TS factory + orb resolve)', () => {
    it(
      'every factory with overridableConfigKeys produces an orb resolve-clean schema when config is overridden',
      async () => {
        const orbBin = resolveOrbBinary();
        if (!orbBin) {
          console.warn(
            '[factory-config-roundtrip] orb binary not found — skipping resolve checks. ' +
              'Install via `make release install` in orbital-rust.',
          );
          return;
        }

        const catalogRaw = await readFile(SIGNATURES_PATH, 'utf-8');
        const catalog = JSON.parse(catalogRaw) as FactorySignatureCatalog;

        const failures: string[] = [];
        const tempFiles: string[] = [];

        for (const sig of catalog.signatures) {
          const traitsWithConfig = sig.traits.filter(
            (t) => t.overridableConfigKeys.length > 0,
          );
          if (traitsWithConfig.length === 0) continue;

          const orbFilePath = orbPathFromSig(sig);
          let orb: OrbitalSchema;
          try {
            const raw = await readFile(orbFilePath, 'utf-8');
            orb = JSON.parse(raw) as OrbitalSchema;
          } catch {
            failures.push(`${sig.organism}::${sig.orbital} — could not read .orb at ${orbFilePath}`);
            continue;
          }

          const manifests = extractManifest(orb);
          const manifest = manifests.find((m) => m.orbitalName === sig.orbital);
          if (!manifest) {
            failures.push(`${sig.organism}::${sig.orbital} — extractManifest returned no entry`);
            continue;
          }

          // Build traitOverrides with synthesized config for every trait that
          // has overridable keys AND is in the manifest's traitNames (ref-traits only —
          // inline traits don't have a config override surface in the params bag).
          const traitOverrides: Record<string, OrbitalTraitOverride> = {};
          for (const traitSig of traitsWithConfig) {
            if (!manifest.traitNames.includes(traitSig.name)) continue;
            traitOverrides[traitSig.name] = {
              config: synthesizeConfigOverride(traitSig.overridableConfigKeys),
            };
          }
          if (Object.keys(traitOverrides).length === 0) continue;

          let builtOrbital;
          try {
            builtOrbital = applyParamsToOrb(orb, sig.orbital, manifest, { traitOverrides });
          } catch (e) {
            failures.push(
              `${sig.organism}::${sig.orbital} — applyParamsToOrb threw: ${String(e)}`,
            );
            continue;
          }

          // Wrap the single orbital back into an OrbitalSchema for `orb resolve`.
          const wrappedSchema: OrbitalSchema = {
            name: orb.name,
            orbitals: [builtOrbital],
          };
          const tmpPath = join(
            tmpdir(),
            `factory-config-roundtrip-${sig.organism}-${sig.orbital}-${Date.now()}.orb`,
          );
          tempFiles.push(tmpPath);
          await writeFile(tmpPath, JSON.stringify(wrappedSchema, null, 2), 'utf-8');

          const proc = spawnSync(orbBin, ['resolve', tmpPath], {
            encoding: 'utf-8',
            timeout: 30_000,
          });

          if (proc.status !== 0) {
            const output = `${proc.stdout ?? ''}\n${proc.stderr ?? ''}`.trim();
            failures.push(
              `${sig.organism}::${sig.orbital} — orb resolve failed:\n${output.split('\n').slice(0, 8).join('\n')}`,
            );
          }
        }

        // Clean up temp files regardless of outcome.
        await Promise.allSettled(tempFiles.map((f) => unlink(f).catch(() => undefined)));

        if (failures.length > 0) {
          throw new Error(
            `[factory-config-roundtrip] ${failures.length} factory/orbital(s) failed orb resolve with synthesized config overrides:\n\n` +
              failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n\n'),
          );
        }
      },
      120_000,
    );
  });
});
