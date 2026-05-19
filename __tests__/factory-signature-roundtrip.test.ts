/**
 * Signature ↔ .orb roundtrip — for each behavior in the registry,
 * the emitted `<name>.signature.json` must cover every element that
 * lives in the source `.orb` (and contain nothing the orb doesn't
 * have).
 *
 * This test guards against:
 *   • Drift between `extractSignatures` and the actual `.orb` shape
 *     (e.g. trait emit added but signature emitter not updated).
 *   • Stale signature files left over from a prior regen.
 *
 * Run after `almadar-sync std-ts`. The Phase 2 translator reads
 * these files; a mismatch here means the translator would target a
 * non-existent param surface.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  FactorySignature,
  OrbitalDefinition,
  OrbitalSchema,
  TraitRef,
} from '@almadar/core';

const REGISTRY = path.resolve(__dirname, '..', 'behaviors', 'registry');
const FUNCTIONS = path.resolve(__dirname, '..', 'behaviors', 'functions');
const TIERS = ['atoms', 'molecules', 'organisms'] as const;
const TOPICS = ['core', 'agent', 'game', 'service', 'app', 'probes'] as const;

interface DiscoveredBehavior {
  topic: string;
  tier: (typeof TIERS)[number];
  behaviorName: string;
  orbPath: string;
  sigPath: string;
}

async function discoverBehaviors(): Promise<DiscoveredBehavior[]> {
  const out: DiscoveredBehavior[] = [];
  for (const topic of TOPICS) {
    for (const tier of TIERS) {
      const dir = path.join(REGISTRY, topic, tier);
      let entries: string[];
      try {
        entries = await fs.readdir(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.endsWith('.orb')) continue;
        const behaviorName = entry.slice(0, -'.orb'.length);
        const orbPath = path.join(dir, entry);
        const sigPath = path.join(
          FUNCTIONS,
          topic,
          tier,
          `${behaviorName}.signature.json`,
        );
        out.push({ topic, tier, behaviorName, orbPath, sigPath });
      }
    }
  }
  return out;
}

function isValidOrb(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Names of trait emits as they appear in the `.orb` (post-overrides
 * applied at the call site; orbitals only carry inline traits or refs
 * whose locally-rewritten emit set we can read directly).
 */
function orbEmitNames(orbital: OrbitalDefinition): Set<string> {
  const out = new Set<string>();
  const traits = orbital.traits ?? [];
  for (const t of traits) {
    const emits = readArray(t, 'emits');
    for (const e of emits) {
      const ev = readString(e, 'event');
      if (ev) out.add(ev);
    }
  }
  return out;
}

function orbListenNames(orbital: OrbitalDefinition): Set<string> {
  const out = new Set<string>();
  const traits = orbital.traits ?? [];
  for (const t of traits) {
    const listens = readArray(t, 'listens');
    for (const l of listens) {
      const ev = readString(l, 'event');
      if (ev) out.add(ev);
    }
  }
  return out;
}

function readArray(obj: TraitRef, key: 'emits' | 'listens'): ReadonlyArray<unknown> {
  if (typeof obj !== 'object' || obj === null) return [];
  const v = (obj as Record<string, unknown>)[key];
  return Array.isArray(v) ? v : [];
}

function readString(obj: unknown, key: string): string | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

describe('factory signatures cover their .orb', async () => {
  const behaviors = await discoverBehaviors();

  for (const b of behaviors) {
    const label = `${b.topic}/${b.tier}/${b.behaviorName}`;

    it(`${label} — signature matches .orb`, async () => {
      const orbText = await fs.readFile(b.orbPath, 'utf8');
      if (!isValidOrb(orbText)) {
        // Game-tier registry currently has empty `.orb` stubs; the
        // regenerator skips them with a "failed to parse" warning, so
        // they have no signature. Mirror that here.
        await expect(fs.access(b.sigPath)).rejects.toThrow();
        return;
      }
      const orb = JSON.parse(orbText) as OrbitalSchema;

      // Trait-only atom .orb files have no `orbitals[]` — they're
      // surface-only contracts inlined by composers. Mirror the
      // regenerator: signature file exists but holds an empty array.
      const orbitals = Array.isArray(orb.orbitals) ? orb.orbitals : [];

      const sigText = await fs.readFile(b.sigPath, 'utf8');
      const signatures = JSON.parse(sigText) as FactorySignature[];

      expect(signatures.length).toBe(orbitals.length);

      for (let i = 0; i < orbitals.length; i++) {
        const orbital = orbitals[i];
        const sig = signatures[i];
        expect(sig.orbital).toBe(orbital.name);
        expect(sig.organism).toBe(orb.name ?? b.behaviorName);
        expect(sig.tier).toBe(b.tier);

        const expectedEmits = orbEmitNames(orbital);
        const expectedListens = orbListenNames(orbital);
        const sigEmits = new Set(sig.emittedEvents);
        const sigListens = new Set(sig.listenedEvents);

        for (const e of expectedEmits) expect(sigEmits.has(e)).toBe(true);
        for (const e of sigEmits) expect(expectedEmits.has(e)).toBe(true);
        for (const l of expectedListens) expect(sigListens.has(l)).toBe(true);
        for (const l of sigListens) expect(expectedListens.has(l)).toBe(true);
      }
    });
  }
});
