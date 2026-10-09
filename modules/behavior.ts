/**
 * Behavior Module — behaviors as first-class values, and reflection over them.
 *
 * A trait value (`std/std-kanban.traits.KanbanBoard`, held in a `trait`-typed
 * field) names a trait of an installed behavior package; an orbital value
 * (`std/std-kanban.orbitals.KanbanOrbital`, `orbital`-typed) names one of its
 * orbitals. `behavior/apply` records overrides on either (the LOLO §8
 * trait-reference surface, or the §8b orbital-import body); `program/eval`
 * performs them through the compiler's own reference forms.
 * `behavior/catalog|describe|source` read the host's installed packages through
 * `orb`, so they run on the server. Design: `docs/Almadar_Studio_Behavior.md`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const BEHAVIOR_OPERATORS: Record<string, StdOperatorMeta> = {
  'behavior/apply': {
    module: 'behavior', category: 'std-behavior-value',
    minArity: 2, maxArity: 2,
    description: 'Record overrides on a behavior value and return the new value of the same kind. A trait value takes the §8 trait-reference surface (config, events and fields merge key-wise, the later value winning; listens, emitsScope and linkedEntity replace); an orbital value takes the §8b import body (maps merge key-wise, traits per trait, extend and retype by field name, the rest replaces). Nothing is resolved until the value is bound or evaluated.',
    hasSideEffects: false,
    returnType: 'any',
    returnSemantics: 'identity-of-arg<0>',
    params: [
      { name: 'value', type: 'any', description: 'A trait value or an orbital value' },
      { name: 'overrides', type: { kind: 'object', fields: {}, open: true }, description: 'The LOLO §8 trait-reference overrides (trait value) or the §8b import body (orbital value)' },
    ],
    example: '["behavior/apply", "@entity.widget", { "config": { "compact": true } }]',
  },
  'behavior/catalog': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'List the installed behaviors under registry folders (`<prefix>/<topic>[/<tier>]`), optionally narrowed by exposure. Each entry carries its traits as values and its shipped embedding vectors.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'CatalogEntry[]',
    params: [
      { name: 'scope', type: { kind: 'object', fields: { paths: { kind: 'array', of: 'string' }, exposure: { kind: 'array', of: 'string' } } }, description: 'Registry folders and an optional exposure filter' },
      { name: 'options', type: { kind: 'object', fields: {}, open: true }, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/catalog", { "paths": ["std/ui/core/molecules"] }, { "emit": { "success": "LISTED", "failure": "LIST_FAILED" } }]',
  },
  'behavior/describe': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'Describe a trait value (its knobs, the events it emits and listens to, its transition events, and the shipped knob embedding vectors), or an orbital value or a whole behavior `{ behavior }` (its app knobs and, per orbital, its knobs, primary entity fields, the entities it borrows from sibling orbitals, its traits and pages).',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'any',
    params: [
      { name: 'value', type: 'any', description: 'A trait value, an orbital value, or { behavior }' },
      { name: 'options', type: { kind: 'object', fields: {}, open: true }, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/describe", "@entity.widget", { "emit": { "success": "DESCRIBED", "failure": "DESCRIBE_FAILED" } }]',
  },
  'behavior/source': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'The behavior a trait value belongs to, as a quoted program.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'sexpr',
    params: [
      { name: 'value', type: 'trait', description: 'The trait value' },
      { name: 'options', type: { kind: 'object', fields: {}, open: true }, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/source", "@entity.widget", { "emit": { "success": "SOURCED", "failure": "SOURCE_FAILED" } }]',
  },
};

export function getBehaviorOperators(): string[] {
  return Object.keys(BEHAVIOR_OPERATORS);
}
