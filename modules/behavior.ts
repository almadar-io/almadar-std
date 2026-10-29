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
import { BOOLEAN, DESCRIPTION, EMIT_ENVELOPE, EVENT_KEY, list, nullable, openShape, rec, shape, STRING, tv, union } from '../signature.js';

export const BEHAVIOR_OPERATORS: Record<string, StdOperatorMeta> = {
  'behavior/apply': {
    module: 'behavior', category: 'std-behavior-value',
    minArity: 2, maxArity: 2,
    description: 'Record overrides on a behavior value and return the new value of the same kind. A trait value takes the §8 trait-reference surface (config, events and fields merge key-wise, the later value winning; listens, emitsScope and linkedEntity replace); an orbital value takes the §8b import body (maps merge key-wise, traits per trait, extend and retype by field name, the rest replaces). Nothing is resolved until the value is bound or evaluated.',
    hasSideEffects: false,
    returnType: tv('V'),
    returnSemantics: 'identity-of-arg<0>',
    params: [
      { name: 'value', type: tv('V', union('trait', 'orbital')), description: 'A trait value or an orbital value' },
      { name: 'overrides', type: rec('O'), description: 'The LOLO §8 trait-reference overrides (trait value) or the §8b import body (orbital value)' },
    ],
    example: '["behavior/apply", "@entity.widget", { "config": { "compact": true } }]',
  },
  'behavior/ref': {
    module: 'behavior', category: 'std-behavior-value',
    minArity: 1, maxArity: 1,
    description: 'A whole behavior as a value (`.lolo` type `behavior`), named by its specifier: `<prefix>/<name>`, `std/behaviors/<name>`, or a workspace-relative `./<dir>/<name>` (what `program/eval` wrote). A literal specifier is resolved when the program is checked; a computed one when the value is mounted. Embedding the value in a render tree runs the whole program in place, with its own pages.',
    hasSideEffects: false,
    returnType: 'behavior',
    params: [
      { name: 'specifier', type: 'string', description: 'The behavior specifier' },
    ],
    example: '["behavior/ref", "./orbitals/shop"]',
  },
  'behavior/catalog': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'List the installed behaviors under registry folders (`<prefix>/<topic>[/<tier>]`), optionally narrowed by exposure. Each entry carries its traits as values and no vectors (`vectors: {}`, `model: ""`): the shipped vectors and the topics view are std\'s (`std-orb-behaviors`, `std-orb-vectors`). With `options.traits: false` it carries no `traits`; with `options.texts: true` it carries the facts the embedding texts read (`name`, `rank`, `textOrder`, `defaultEntityName`, `connectableEvents`, `capabilitiesText`).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: list('CatalogEntry'),
    params: [
      { name: 'scope', type: { kind: 'object', fields: { paths: { kind: 'array', of: 'string' }, exposure: { kind: 'array', of: 'string' } } }, description: 'Registry folders and an optional exposure filter' },
      {
        name: 'options',
        type: openShape({ key: STRING, traits: BOOLEAN, texts: BOOLEAN, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) }),
        description: 'Emit configuration ({ emit: { success, failure } }); `traits: false` omits the traits, `texts: true` adds the facts the embedding texts read',
        optional: true,
      },
    ],
    example: '["behavior/catalog", { "paths": ["std/ui/core/molecules"] }, { "emit": { "success": "LISTED", "failure": "LIST_FAILED" } }]',
  },
  'behavior/describe': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'Describe a trait value (its knobs, the events it emits and listens to, and its transition events), or an orbital value or a whole behavior `{ behavior }` (its app knobs and, per orbital, its knobs, primary entity fields, the entities it borrows from sibling orbitals, its traits and pages). It carries no vectors and no forwarded controls: `orb behaviors describe` attaches them.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: DESCRIPTION,
    params: [
      { name: 'value', type: union('trait', 'orbital', 'behavior'), description: 'A trait value, an orbital value, or { behavior }' },
      {
        name: 'options',
        type: openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) }),
        description: 'Emit configuration ({ emit: { success, failure } })',
        optional: true,
      },
    ],
    example: '["behavior/describe", "@entity.widget", { "emit": { "success": "DESCRIBED", "failure": "DESCRIBE_FAILED" } }]',
  },
  'behavior/source': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'The behavior a trait value, an orbital value or `{ behavior }` names, as a quoted program. With `options.file: true` it answers the source file instead, `{ path, source }`: the resolved file path and its text, as `orb mcp`\'s `read_behavior` does.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: union('sexpr', shape({ path: STRING, source: STRING })),
    params: [
      { name: 'value', type: union('trait', 'orbital', 'behavior'), description: 'A trait value, an orbital value, or { behavior }' },
      {
        name: 'options',
        type: openShape({ key: STRING, file: BOOLEAN, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) }),
        description: 'Emit configuration ({ emit: { success, failure } }); `file: true` answers `{ path, source }`',
        optional: true,
      },
    ],
    example: '["behavior/source", "@entity.widget", { "emit": { "success": "SOURCED", "failure": "SOURCE_FAILED" } }]',
  },
  'behavior/resolve': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 3,
    description: 'The behavior a trait value, an orbital value or `{ behavior }` names, resolved: every import and composed trait inlined, as a quoted program. With `{ path: true }`, where it resolves instead: `{ path, owner }`, the file and the package that owns it, as `orb behaviors which` prints them; with `{ expects: true }`, each orbital\'s derived expectations.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: union('sexpr', shape({ path: STRING, owner: STRING })),
    params: [
      { name: 'value', type: union('trait', 'orbital', 'behavior'), description: 'A trait value, an orbital value, or { behavior }' },
      { name: 'request', type: openShape({ path: BOOLEAN, expects: BOOLEAN }), description: '`path: true` answers `{ path, owner }`; `expects: true` answers each orbital\'s derived expectations (`{ <orbital>: … }`, as `orb behaviors expects` prints them; `behavior` may also name a `.orb` file)', optional: true },
      { name: 'options', type: EMIT_ENVELOPE, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/resolve", "@entity.app", { "emit": { "success": "RESOLVED", "failure": "RESOLVE_FAILED" } }]',
  },
  'behavior/dependencies': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'A program\'s dependency graph: each orbital\'s `uses` imports, then every installed behavior they reach, with its layer (io, std, a std UI primitive, or unknown) and its own imports.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: 'DependencyGraph',
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program (as written, with its `uses`)' },
      { name: 'options', type: EMIT_ENVELOPE, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/dependencies", "@entity.program", { "emit": { "success": "DEPENDENCIES", "failure": "DEPENDENCIES_FAILED" } }]',
  },
  'behavior/packages': {
    module: 'behavior', category: 'std-behavior',
    minArity: 0, maxArity: 1,
    description: 'The installed behavior packages, each `{ root, prefix, vectors }`: its directory, its behavior prefix and the path of its `orb.vectors` snapshot as the sidecar lock resolves it (the cached sidecar when locked, `null` when the package declares none).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: list(shape({ root: STRING, prefix: STRING, vectors: nullable(STRING) })),
    params: [
      { name: 'options', type: EMIT_ENVELOPE, description: 'Emit configuration ({ emit: { success, failure } })', optional: true },
    ],
    example: '["behavior/packages", { "emit": { "success": "PACKAGES", "failure": "PACKAGES_FAILED" } }]',
  },
};

export function getBehaviorOperators(): string[] {
  return Object.keys(BEHAVIOR_OPERATORS);
}
