/**
 * Eval F — Registry sync output coverage.
 *
 * Asserts that the generated `behaviors-registry.json` carries the metadata
 * the analyzer / decideMethod / call_behavior pipelines depend on. Each
 * gap below references the gap-doc section that motivated it:
 *
 * - Gap 5 (`docs/Almadar_Studio_Agent_Gaps.md §4`): `topic`, `defaultOrbitalName`,
 *   real `description`, real `family` per entry.
 * - Gap 8 (`Almadar_Studio_Agent_Gaps.md §6`): `topic` derived from the on-disk
 *   tier directory so the analyzer can prefer `app/` for whole-app prompts.
 *
 * This is a fixture test — it runs against the on-disk registry, not the agent.
 * Regenerate via `npx tsx tools/behavior-registry-sync/index.ts` before running.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const REGISTRY_PATH = path.resolve(__dirname, '..', 'behaviors', 'behaviors-registry.json');
const REGISTRY_DIR = path.resolve(__dirname, '..', 'behaviors', 'registry');

const TIER_DIRS = ['atoms', 'molecules', 'organisms', 'templates'] as const;

/**
 * Topics are DERIVED from the registry tree, not hardcoded.
 *
 * The previous literal list — ['core', 'agent', 'core-variations', 'infra'] —
 * went stale when the UI topics moved under `ui/*`. Two things followed, and the
 * second is the dangerous one: 420 topic assertions failed, and `findOrbPath`
 * (which iterated the same list) returned null for EVERY behavior, so the
 * "topic matches the .orb path" assertion below skipped itself every time and
 * had been passing vacuously. A hardcoded list of things the repo generates is
 * a guarantee that the test drifts away from the data it checks.
 */
function discoverTopics(root: string, prefix = ''): string[] {
    if (!fs.existsSync(root)) return [];
    const out: string[] = [];
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if ((TIER_DIRS as readonly string[]).includes(entry.name)) {
            if (prefix) out.push(prefix);
            continue;
        }
        const nested = prefix ? `${prefix}/${entry.name}` : entry.name;
        out.push(...discoverTopics(path.join(root, entry.name), nested));
    }
    return [...new Set(out)];
}

const VALID_TOPICS = discoverTopics(REGISTRY_DIR);
const VALID_LEVELS = ['atom', 'molecule', 'organism'] as const;

interface RegistryEntry {
    name: string;
    level: string;
    topic?: string;
    family: string;
    layer: string;
    description: string;
    defaultOrbitalName?: string;
    defaultEntity: { name: string; fields: unknown[] };
    statePattern: string;
    complexity: { states: number; events: number; transitions: number };
    composableWith: string[];
    connectableEvents: string[];
}

interface RegistryFile {
    $generated: string;
    $source: string;
    totalBehaviors: number;
    atoms: number;
    molecules: number;
    organisms: number;
    behaviors: Record<string, RegistryEntry>;
}

function loadRegistry(): RegistryFile {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw) as RegistryFile;
}

function findOrbPath(name: string): string | null {
    for (const topic of VALID_TOPICS) {
        for (const tier of TIER_DIRS) {
            // `topic` may be nested (e.g. "ui/core"), so split it into segments
            // rather than passing it to path.join as one component.
            const candidate = path.join(REGISTRY_DIR, ...topic.split('/'), tier, `${name}.orb`);
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return null;
}

describe('behaviors-registry.json — metadata coverage (Eval F)', () => {
    const registry = loadRegistry();
    const entries = Object.values(registry.behaviors);

    it('contains at least one behavior', () => {
        expect(entries.length).toBeGreaterThan(0);
    });

    describe.each(entries)('$name', (entry) => {
        it('has a valid `level` (atom | molecule | organism)', () => {
            expect(VALID_LEVELS).toContain(entry.level);
        });

        it('has a `topic` ∈ {core, agent, core-variations, infra}', () => {
            expect(entry.topic).toBeDefined();
            expect(VALID_TOPICS).toContain(entry.topic as (typeof VALID_TOPICS)[number]);
        });

        it('`topic` matches the .orb file path tier directory', () => {
            const orbPath = findOrbPath(entry.name);
            // If the .orb is missing on disk we skip — covered by other tests.
            if (!orbPath) return;
            // Path shape: .../registry/<topic...>/<tier>/<name>.orb — the topic
            // can span several segments ("ui/core"), so take everything between
            // `registry` and the tier directory rather than one segment.
            const segments = orbPath.split(path.sep);
            const registryIdx = segments.indexOf('registry');
            const tierIdx = segments.length - 2;
            const onDiskTopic = segments.slice(registryIdx + 1, tierIdx).join('/');
            expect(entry.topic).toBe(onDiskTopic);
        });

        it('has a `defaultOrbitalName` matching ^[A-Z][A-Za-z0-9]+Orbital$', () => {
            expect(entry.defaultOrbitalName).toBeDefined();
            // Digits allowed after the first uppercase (e.g. `GameCanvas2dOrbital`,
            // `Avl3DApplicationOrbital`). Must end in `Orbital`.
            expect(entry.defaultOrbitalName).toMatch(/^[A-Z][A-Za-z0-9]+Orbital$/);
        });

        it('`description` is non-stub and non-empty', () => {
            expect(entry.description).toBeDefined();
            expect(entry.description.length).toBeGreaterThan(0);
            // Stub patterns the registry-sync used to emit:
            expect(entry.description).not.toBe(`${entry.name} as a Function`);
        });

        it('`family` is real (not the literal string "unknown")', () => {
            expect(entry.family).toBeDefined();
            expect(entry.family).not.toBe('unknown');
        });
    });
});
