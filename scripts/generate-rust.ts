#!/usr/bin/env npx tsx
/**
 * Generate `canonical-operators.json` from STD_OPERATORS, preserving curated docs fields.
 * The Rust `canonical_operators.rs` is pattern-sync's (`rust` step), generated from this JSON.
 *
 * Usage: pnpm --filter @almadar/std run generate:operators
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STD_OPERATORS, STD_OPERATORS_BY_MODULE } from '../registry.js';
import type { OperatorEffectMeta, RunsOn, StdOperatorMeta, StdModule } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STD_ROOT = resolve(__dirname, '..');
const JSON_OUT = join(STD_ROOT, 'canonical-operators.json');

// ============================================================================
// Category metadata (which platforms the category targets)
// ============================================================================

const CATEGORY_META: Record<string, { description: string; target: string[] }> = {
    arithmetic: { description: 'Numeric operations', target: ['ts', 'rust'] },
    comparison: { description: 'Value comparison', target: ['ts', 'rust'] },
    logic: { description: 'Boolean logic', target: ['ts', 'rust'] },
    control: { description: 'Control flow', target: ['ts', 'rust'] },
    effect: { description: 'Side effects (runtime only)', target: ['ts'] },
    collection: { description: 'Collection operations', target: ['ts', 'rust'] },
    'std-math': { description: 'Math utilities', target: ['ts', 'rust'] },
    'std-str': { description: 'String utilities', target: ['ts', 'rust'] },
    'std-array': { description: 'Array utilities', target: ['ts', 'rust'] },
    'std-object': { description: 'Object utilities', target: ['ts', 'rust'] },
    'std-json': { description: 'JSON parsing/serialization', target: ['ts', 'rust'] },
    'std-time': { description: 'Date/time utilities', target: ['ts', 'rust'] },
    'std-validate': { description: 'Validation utilities', target: ['ts', 'rust'] },
    'std-format': { description: 'Formatting utilities', target: ['ts', 'rust'] },
    'std-async': { description: 'Async utilities (runtime only)', target: ['ts'] },
    'std-prob': { description: 'Probabilistic programming', target: ['ts'] },
    'std-os': { description: 'OS-level event watchers for system triggers', target: ['ts'] },
    'std-browser': { description: 'Browser device APIs (file picker, clipboard, geolocation) — client host effects', target: ['ts'] },
      'std-composition': { description: 'Behavior composition (compile-time)', target: ['ts', 'rust'] },
    'std-llm': { description: 'LLM interaction substrate (runtime)', target: ['ts'] },
    'std-workspace': { description: 'Workspace I/O substrate (runtime)', target: ['ts'] },
    'std-session': { description: 'Session state substrate (runtime)', target: ['ts'] },
    'std-memory': { description: 'Agent memory substrate (runtime)', target: ['ts'] },
    'std-trace': { description: 'Execution tracing substrate (runtime)', target: ['ts'] },
    'std-integration': { description: 'External integration calls (runtime)', target: ['ts'] },
    'std-behavior': { description: 'Behavior substrate effects (runtime)', target: ['ts'] },
    'std-vec': { description: '2D/3D vector math', target: ['ts', 'rust'] },
    'std-geo': { description: '2D collision and geometry', target: ['ts', 'rust'] },
    'std-grid': { description: 'Tile/cell coordinate operations', target: ['ts', 'rust'] },
    'std-anim': { description: 'Sprite animation helpers', target: ['ts', 'rust'] },
    'std-ease': { description: 'Easing and interpolation curves', target: ['ts', 'rust'] },
    'std-noise': { description: 'Coherent noise (procedural gen)', target: ['ts', 'rust'] },
    'std-path': { description: 'Grid pathfinding', target: ['ts', 'rust'] },
    'std-nn': { description: 'Neural network layer definitions', target: ['python'] },
    'std-tensor': { description: 'Tensor operations', target: ['python'] },
    'std-train': { description: 'Training operations', target: ['python'] },
    'ml-arch': { description: 'Architecture layer definitions (Python compile target)', target: ['python'] },
    'ml-effect': { description: 'ML execution effects (Python compile target)', target: ['python'] },
    'ml-tensor': { description: 'Tensor manipulation (Python compile target)', target: ['python'] },
    'ml-graph': { description: 'Graph construction (Python compile target)', target: ['python'] },
    'ml-contract': { description: 'Input/output contract validation (Python compile target)', target: ['python'] },
    'ml-data': { description: 'Data loading and preprocessing (Python compile target)', target: ['python'] },
};

// ============================================================================
// JSON artifact
// ============================================================================

interface CanonicalOperatorEntry {
    category: string;
    minArity: number;
    maxArity: number | null;
    returnType: string;
    description: string;
    hasSideEffects?: boolean;
    module?: StdModule;
    /**
     * Schema v2 effect metadata (see docs/Almadar_Operators_Migration.md §"Proposed schema (v2)").
     * Populated only when `hasSideEffects: true`. The Rust compiler reads this
     * field to type-check `emit: { success: "X" }` configs at call sites
     * (Almadar_Entity_V2_Plan.md P0.7/P0.8). Emitting is gated on
     * `meta.effect` presence so pre-v2 operators omit the field entirely and
     * the Rust deserializer's `#[serde(default)]` picks up the absence
     * cleanly.
     */
    effect?: OperatorEffectMeta;
    /**
     * F2 plan: input-dependent return-type tag for operators whose actual
     * return type comes from their argument expressions, not the static
     * `returnType` field. Validator (L2.5 + future binding-type rules)
     * reads this first and derives the concrete type from the call site.
     * Omitted for operators with fixed return types.
     */
    returnSemantics?: string;
    /**
     * 0-indexed argument position of the operator's lambda/callback, when it
     * takes one (`acceptsLambda`). The L2 validator uses it to reject a
     * `(fn …)` form found in any OTHER argument position — the decidable
     * wrong-arg-order class (e.g. `(array/reduce arr (fn …) init)`).
     */
    lambdaArgPosition?: number;
    runsOn?: RunsOn;
    /** Enrichment (docs): human title, parameter docs, lolo examples, provenance. */
    title?: string;
    params?: { name: string; type: unknown; description?: string }[];
    examples?: string[];
    docsSource?: string;
}

interface ExistingCanonicalFile {
    operators?: Record<string, CanonicalOperatorEntry>;
}

function readExistingOperators(): Record<string, CanonicalOperatorEntry> {
    if (!existsSync(JSON_OUT)) return {};
    try {
        const parsed = JSON.parse(readFileSync(JSON_OUT, 'utf8')) as ExistingCanonicalFile;
        return parsed.operators ?? {};
    } catch {
        return {};
    }
}

/** Convert a module-source JSON-array example (`["math/abs", -5] // => 5`) to the lolo form the enriched registry and the playground use (`(math/abs -5) // => 5`). */
function jsonExampleToLolo(example: string): string | undefined {
    const commentIdx = example.indexOf(' //');
    const exprPart = commentIdx > 0 ? example.slice(0, commentIdx).trim() : example.trim();
    const suffix = commentIdx > 0 ? example.slice(commentIdx) : '';
    let arr: unknown;
    try {
        arr = JSON.parse(exprPart);
    } catch {
        return undefined;
    }
    if (!Array.isArray(arr) || arr.length === 0 || typeof arr[0] !== 'string') return undefined;
    const arg = (a: unknown): string => {
        if (typeof a === 'string') return a.startsWith('@') ? a : JSON.stringify(a);
        if (a !== null && typeof a === 'object') return JSON.stringify(a);
        return String(a);
    };
    const args = arr.slice(1).map(arg);
    return `(${arr[0]}${args.length ? ' ' + args.join(' ') : ''})${suffix}`;
}

function toCanonicalEntry(
    meta: StdOperatorMeta,
    existing?: CanonicalOperatorEntry
): CanonicalOperatorEntry {
    const entry: CanonicalOperatorEntry = {
        category: meta.category,
        minArity: meta.minArity,
        maxArity: meta.maxArity,
        returnType: meta.returnType,
        description: meta.description,
        module: meta.module,
    };
    if (meta.hasSideEffects) entry.hasSideEffects = true;
    if (meta.effect) entry.effect = meta.effect;
    if (meta.returnSemantics) entry.returnSemantics = meta.returnSemantics;
    if (meta.runsOn) entry.runsOn = meta.runsOn;
    if (meta.acceptsLambda && meta.lambdaArgPosition != null) {
        entry.lambdaArgPosition = meta.lambdaArgPosition;
    }
    // Docs enrichment: existing curated fields win; the module source's
    // `example` is the fallback so regeneration never drops enrichment.
    const title = existing?.title;
    if (title) entry.title = title;
    const params = existing?.params ?? meta.params;
    if (params && params.length > 0) entry.params = params;
    const examples =
        existing?.examples && existing.examples.length > 0
            ? existing.examples
            : meta.example
              ? [jsonExampleToLolo(meta.example) ?? meta.example]
              : undefined;
    if (examples) entry.examples = examples;
    const docsSource = existing?.docsSource ?? (examples && !existing?.examples ? 'generated' : undefined);
    if (docsSource) entry.docsSource = docsSource;
    return entry;
}

function writeCanonicalJson(): number {
    const existing = readExistingOperators();
    const operators: Record<string, CanonicalOperatorEntry> = {};
    const sortedNames = Object.keys(STD_OPERATORS).sort();
    for (const name of sortedNames) {
        operators[name] = toCanonicalEntry(STD_OPERATORS[name], existing[name]);
    }

    const schema = {
        version: '2.0.0',
        description:
            'Canonical operator registry for Almadar. Generated from @almadar/std/modules. Consumed by orbital-compiler via include_str!.',
        generated: new Date().toISOString(),
        categories: CATEGORY_META,
        operators,
    };

    mkdirSync(dirname(JSON_OUT), { recursive: true });
    writeFileSync(JSON_OUT, JSON.stringify(schema, null, 2) + '\n');
    return sortedNames.length;
}

// ============================================================================
// Entrypoint
// ============================================================================

const jsonCount = writeCanonicalJson();
console.log(`✓ wrote ${JSON_OUT} (${jsonCount} operators)`);

const byModule: Record<string, number> = {};
for (const [mod, ops] of Object.entries(STD_OPERATORS_BY_MODULE)) {
    byModule[mod] = Object.keys(ops).length;
}
console.error('\n=== Operators by module ===');
for (const [mod, count] of Object.entries(byModule).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.error(`  ${mod.padEnd(14)}: ${count}`);
}
