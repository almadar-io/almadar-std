/**
 * Behavior Module - Orbital behavior composition, instantiation, validation, and lolo emission.
 *
 * Combines compose/*, behavior/*, validate/*, and lolo/* operators under one
 * module. All are backed by rabit's internal services (composeBehaviors,
 * instantiateOrbital, orb validate, emitLoloBody). The return types are
 * concrete substrate structs — zero JsonValue returns (§3.2 of the design doc).
 *
 * behavior/instantiate is runtime `uses` — meta-programming: the lolo program
 * composes other lolo behaviors at runtime, using the same registry + override
 * surface as compile-time `uses` declarations.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const BEHAVIOR_OPERATORS: Record<string, StdOperatorMeta> = {
  'compose/compose-all': {
    module: 'behavior', category: 'std-behavior',
    minArity: 0, maxArity: 0,
    description: 'Compose all orbitals in the workspace into a single schema. Backed by composeBehaviors.',
    hasSideEffects: true,
    returnType: 'ComposeAllResult',
    params: [],
    example: '["compose/compose-all"]',
  },
  'compose/compose-children': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 1,
    description: 'Compose child orbitals under a parent for recursive builds.',
    hasSideEffects: true,
    returnType: 'ComposeChildrenResult',
    params: [{ name: 'parentName', type: 'string', description: 'Parent orbital name' }],
    example: '["compose/compose-children", "GameScreenOrbital"]',
  },
  'behavior/instantiate': {
    module: 'behavior', category: 'std-behavior',
    minArity: 2, maxArity: 3,
    description: 'Instantiate a behavior from the registry at runtime (meta-programming). Equivalent to compile-time `uses` but dynamic — the behavior name is a runtime value. Applies the same override surface (linkedEntity, events, config, fields).',
    hasSideEffects: true,
    returnType: 'BuilderResult',
    params: [
      { name: 'behavior', type: 'string', description: 'Behavior/organism name (e.g. "std-ecommerce")' },
      { name: 'orbitalName', type: 'string', description: 'Canonical orbital name to instantiate' },
      { name: 'overrides', type: { kind: 'object', fields: { linkedEntity: 'string', method: 'string' }, open: true }, description: 'Override surface: linkedEntity, events, config, fields', optional: true },
    ],
    example: '["behavior/instantiate", "std-ecommerce", "ProductOrbital", { linkedEntity: "Product" }]',
  },
  'behavior/call': {
    module: 'behavior', category: 'std-behavior',
    minArity: 2, maxArity: 3,
    description: 'Call a behavior service action. Returns the ServiceCallResult union — resolves to the specific member when the (behavior, action) pair is a literal.',
    hasSideEffects: true,
    returnType: 'ServiceCallResult',
    params: [
      { name: 'behavior', type: 'string', description: 'Service/behavior name' },
      { name: 'action', type: 'string', description: 'Action name' },
      { name: 'args', type: { kind: 'object', fields: {}, open: true }, description: 'Action arguments', optional: true },
    ],
    example: '["behavior/call", "validator", "validate-composed"]',
  },
  'lolo/emit-body': {
    module: 'behavior', category: 'std-behavior',
    minArity: 3, maxArity: 3,
    description: 'Emit a .lolo orbital body from the LLM (free-lolo path). Returns the emitted lolo source.',
    hasSideEffects: true,
    returnType: 'LoloEmitResult',
    params: [
      { name: 'name', type: 'string', description: 'Orbital name' },
      { name: 'palette', type: { kind: 'object', fields: { topics: { kind: 'array', of: 'string' }, hints: { kind: 'array', of: 'string' } } }, description: 'Topic-tree palette + primitive hints' },
      { name: 'deltaPrompt', type: 'string', description: 'Per-orbital instruction prompt' },
    ],
    example: '["lolo/emit-body", "PlayerOrbital", { topics: ["game/2d"] }, "player ship with movement"]',
  },
  'validate/validate': {
    module: 'behavior', category: 'std-behavior',
    minArity: 1, maxArity: 2,
    description: 'Validate an orbital or the composed schema using orb validate.',
    hasSideEffects: true,
    returnType: 'ValidateResult',
    params: [
      { name: 'target', type: { kind: 'union', of: [{ kind: 'literal', value: 'orbital' }, { kind: 'literal', value: 'composed' }] }, description: 'Validation target' },
      { name: 'name', type: 'string', description: 'Orbital name (required when target is "orbital")', optional: true },
    ],
    example: '["validate/validate", "composed"]',
  },
};

export function getBehaviorOperators(): string[] {
  return Object.keys(BEHAVIOR_OPERATORS);
}
