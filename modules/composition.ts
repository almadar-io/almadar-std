/**
 * Composition Module - Behavior Composition Operators
 *
 * Provides compile-time operators for composing N orbitals into a single
 * application schema. These operators are resolved during `.lolo` lowering
 * (or by the parallel Rust composition pass), not at runtime.
 *
 * Surfaced here so that the lolo type sync tool can publish them in
 * `signatures.lolo`, the Rust compiler can validate their arity and shape,
 * and IDE tooling can discover them through the unified std registry.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Composition module operators.
 * All operators are pure (no runtime side effects) and compile-time resolved.
 */
export const COMPOSITION_OPERATORS: Record<string, StdOperatorMeta> = {
  'behavior/compose': {
    module: 'composition',
    category: 'std-composition',
    minArity: 1,
    maxArity: 1,
    description: 'Compose N orbitals into one application schema. Wires events, picks layout, generates pages.',
    hasSideEffects: false,
    compileTime: true,
    returnType: 'object',
    params: [
      {
        name: 'config',
        type: 'object',
        description: 'ComposeBehaviorsInput: { appName, orbitals[], layoutStrategy?, eventWiring?, entityMappings? }',
      },
    ],
    example: '(behavior/compose { appName: "ShoppingApp" orbitals: [...] })',
  },
  'behavior/wire': {
    module: 'composition',
    category: 'std-composition',
    minArity: 2,
    maxArity: 2,
    description: 'Apply cross-orbital event wiring. Adds external emits/listens to inline traits.',
    hasSideEffects: false,
    compileTime: true,
    returnType: 'array',
    params: [
      {
        name: 'orbitals',
        type: 'array',
        description: 'Array of OrbitalDefinition to wire',
      },
      {
        name: 'wiring',
        type: 'array',
        description: 'Array of EventWiringEntry { from, event, to, triggers }',
      },
    ],
    example: '(behavior/wire orbitals wiring)',
  },
  'behavior/detect-layout': {
    module: 'composition',
    category: 'std-composition',
    minArity: 1,
    maxArity: 2,
    description: 'Auto-detect layout from orbital count and wiring topology. Returns single, tabs, sidebar, dashboard, or wizard-flow.',
    hasSideEffects: false,
    compileTime: true,
    returnType: 'string',
    params: [
      {
        name: 'orbitals',
        type: 'array',
        description: 'Array of OrbitalDefinition',
      },
      {
        name: 'wiring',
        type: 'array',
        description: 'Optional EventWiringEntry array',
        optional: true,
      },
    ],
    example: '(behavior/detect-layout orbitals)',
  },
  'behavior/pipe': {
    module: 'composition',
    category: 'std-composition',
    minArity: 2,
    maxArity: null,
    description: 'Left-to-right composition. Each step receives the previous result as its first arg.',
    hasSideEffects: false,
    compileTime: true,
    returnType: 'any',
    params: [
      {
        name: 'seed',
        type: 'any',
        description: 'Initial value to pipe through steps',
      },
      {
        name: '...steps',
        type: 'function[]',
        description: 'Functions, each receiving the previous result as first argument',
      },
    ],
    example: '(behavior/pipe orbitals (behavior/wire wiring) (behavior/compose { appName: "X" }))',
  },
};

/**
 * Get all composition operator names.
 */
export function getCompositionOperators(): string[] {
  return Object.keys(COMPOSITION_OPERATORS);
}
