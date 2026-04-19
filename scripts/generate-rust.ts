#!/usr/bin/env npx tsx
/**
 * Generate canonical operator artifacts for the Rust compiler.
 *
 * Reads every STD_OPERATORS entry (core + library) directly from the std
 * module TypeScript sources and emits two artifacts:
 *
 *   1. packages/almadar-std/canonical-operators.json
 *      Flat JSON the orbital-compiler embeds via `include_str!`. Mirrors
 *      the shape of the retired @almadar/operators/operators.json so the
 *      Rust deserializer (EmbeddedOperator) continues to work unchanged.
 *
 *   2. orbital-rust/crates/orbital-compiler/src/phases/validation/canonical_operators.rs
 *      Legacy static Rust struct array. Kept for validators that still
 *      reference CANONICAL_OPERATORS; the embedded-JSON path is canonical.
 *
 * Usage:
 *   npx tsx packages/almadar-std/scripts/generate-rust.ts
 *   npx tsx packages/almadar-std/scripts/generate-rust.ts --json-only
 *   npx tsx packages/almadar-std/scripts/generate-rust.ts --rs-only
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STD_OPERATORS, STD_OPERATORS_BY_MODULE } from '../registry.js';
import type { StdOperatorMeta, StdModule } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STD_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(STD_ROOT, '..', '..');
const JSON_OUT = join(STD_ROOT, 'canonical-operators.json');
const RS_OUT = join(
    REPO_ROOT,
    'orbital-rust/crates/orbital-compiler/src/phases/validation/canonical_operators.rs'
);

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
    'std-time': { description: 'Date/time utilities', target: ['ts', 'rust'] },
    'std-validate': { description: 'Validation utilities', target: ['ts', 'rust'] },
    'std-format': { description: 'Formatting utilities', target: ['ts', 'rust'] },
    'std-async': { description: 'Async utilities (runtime only)', target: ['ts'] },
    'std-prob': { description: 'Probabilistic programming', target: ['ts'] },
    'std-os': { description: 'OS-level event watchers for system triggers', target: ['ts'] },
    'std-agent': { description: 'Agent intelligence: memory, context, tools, LLM', target: ['ts', 'rust'] },
    'std-composition': { description: 'Behavior composition (compile-time)', target: ['ts', 'rust'] },
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
}

function toCanonicalEntry(meta: StdOperatorMeta): CanonicalOperatorEntry {
    const entry: CanonicalOperatorEntry = {
        category: meta.category,
        minArity: meta.minArity,
        maxArity: meta.maxArity,
        returnType: meta.returnType,
        description: meta.description,
        module: meta.module,
    };
    if (meta.hasSideEffects) entry.hasSideEffects = true;
    return entry;
}

function writeCanonicalJson(): number {
    const operators: Record<string, CanonicalOperatorEntry> = {};
    const sortedNames = Object.keys(STD_OPERATORS).sort();
    for (const name of sortedNames) {
        operators[name] = toCanonicalEntry(STD_OPERATORS[name]);
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
// Rust artifact (legacy fallback: static OperatorMeta array)
// ============================================================================

function rustLiteral(s: string): string {
    return JSON.stringify(s);
}

function writeRustFile(): number {
    const rustTargeted = Object.entries(STD_OPERATORS).filter(([, meta]) => {
        const cat = CATEGORY_META[meta.category];
        return cat?.target.includes('rust');
    });
    rustTargeted.sort(([a], [b]) => a.localeCompare(b));

    const lines: string[] = [];
    lines.push(`// Auto-generated from @almadar/std STD_OPERATORS.`);
    lines.push(`// DO NOT EDIT MANUALLY.`);
    lines.push(`// Generated: ${new Date().toISOString()}`);
    lines.push(`// Total operators targeting Rust: ${rustTargeted.length}`);
    lines.push('');
    lines.push(`/// Operator metadata derived from the canonical @almadar/std registry.`);
    lines.push(`#[derive(Debug, Clone)]`);
    lines.push(`pub struct OperatorMeta {`);
    lines.push(`    pub name: &'static str,`);
    lines.push(`    pub category: &'static str,`);
    lines.push(`    pub min_arity: usize,`);
    lines.push(`    pub max_arity: Option<usize>,`);
    lines.push(`    pub return_type: &'static str,`);
    lines.push(`    pub description: &'static str,`);
    lines.push(`    pub has_side_effects: bool,`);
    lines.push(`}`);
    lines.push('');
    lines.push(`/// All operators that should be implemented in Rust`);
    lines.push(`pub static CANONICAL_OPERATORS: &[OperatorMeta] = &[`);
    for (const [name, meta] of rustTargeted) {
        const maxArity = meta.maxArity === null ? 'None' : `Some(${meta.maxArity})`;
        const sideEffects = meta.hasSideEffects ? 'true' : 'false';
        lines.push(`    OperatorMeta {`);
        lines.push(`        name: ${rustLiteral(name)},`);
        lines.push(`        category: ${rustLiteral(meta.category)},`);
        lines.push(`        min_arity: ${meta.minArity},`);
        lines.push(`        max_arity: ${maxArity},`);
        lines.push(`        return_type: ${rustLiteral(meta.returnType)},`);
        lines.push(`        description: ${rustLiteral(meta.description)},`);
        lines.push(`        has_side_effects: ${sideEffects},`);
        lines.push(`    },`);
    }
    lines.push(`];`);
    lines.push('');
    lines.push(`/// Check if an operator should be implemented in Rust`);
    lines.push(`pub fn is_canonical_operator(name: &str) -> bool {`);
    lines.push(`    CANONICAL_OPERATORS.iter().any(|op| op.name == name)`);
    lines.push(`}`);
    lines.push('');
    lines.push(`/// Get metadata for a canonical operator`);
    lines.push(`pub fn get_canonical_operator(name: &str) -> Option<&'static OperatorMeta> {`);
    lines.push(`    CANONICAL_OPERATORS.iter().find(|op| op.name == name)`);
    lines.push(`}`);
    lines.push('');
    lines.push(`/// Get all operators that are missing implementations`);
    lines.push(`pub fn get_missing_operators(implemented: &[&str]) -> Vec<&'static str> {`);
    lines.push(`    CANONICAL_OPERATORS`);
    lines.push(`        .iter()`);
    lines.push(`        .map(|op| op.name)`);
    lines.push(`        .filter(|name| !implemented.contains(name))`);
    lines.push(`        .collect()`);
    lines.push(`}`);
    lines.push('');
    lines.push(`#[cfg(test)]`);
    lines.push(`mod tests {`);
    lines.push(`    use super::*;`);
    lines.push('');
    lines.push(`    #[test]`);
    lines.push(`    fn test_canonical_operators_count() {`);
    lines.push(`        assert_eq!(CANONICAL_OPERATORS.len(), ${rustTargeted.length});`);
    lines.push(`    }`);
    lines.push('');
    lines.push(`    #[test]`);
    lines.push(`    fn test_core_categories_present() {`);
    lines.push(`        let categories: std::collections::HashSet<_> =`);
    lines.push(`            CANONICAL_OPERATORS.iter().map(|op| op.category).collect();`);
    lines.push(`        assert!(categories.contains("arithmetic"));`);
    lines.push(`        assert!(categories.contains("comparison"));`);
    lines.push(`        assert!(categories.contains("logic"));`);
    lines.push(`        assert!(categories.contains("control"));`);
    lines.push(`    }`);
    lines.push(`}`);
    lines.push('');

    mkdirSync(dirname(RS_OUT), { recursive: true });
    writeFileSync(RS_OUT, lines.join('\n'));
    return rustTargeted.length;
}

// ============================================================================
// Entrypoint
// ============================================================================

const args = process.argv.slice(2);
const jsonOnly = args.includes('--json-only');
const rsOnly = args.includes('--rs-only');

let jsonCount = 0;
let rustCount = 0;

if (!rsOnly) {
    jsonCount = writeCanonicalJson();
    console.log(`✓ wrote ${JSON_OUT} (${jsonCount} operators)`);
}
if (!jsonOnly) {
    rustCount = writeRustFile();
    console.log(`✓ wrote ${RS_OUT} (${rustCount} rust-targeted operators)`);
}

const byModule: Record<string, number> = {};
for (const [mod, ops] of Object.entries(STD_OPERATORS_BY_MODULE)) {
    byModule[mod] = Object.keys(ops).length;
}
console.error('\n=== Operators by module ===');
for (const [mod, count] of Object.entries(byModule).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.error(`  ${mod.padEnd(14)}: ${count}`);
}
