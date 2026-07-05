/**
 * Session Module - Per-orbital generation context (spec, memory, history, errors).
 *
 * Backed by rabit SessionStore. Operators resolve at runtime via
 * EvaluationContextExtensions.session → SessionContext.
 * No session/read-json or session/write-json — every key is typed.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const SESSION_OPERATORS: Record<string, StdOperatorMeta> = {
  'session/read-spec': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital spec.json from the session store.',
    hasSideEffects: false,
    returnType: 'object',
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-spec", "ProductOrbital"]',
  },
  'session/write-spec': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write the per-orbital spec.json to the session store.',
    hasSideEffects: true, returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'spec', type: { kind: 'object', fields: { orbitalName: 'string', organism: 'string', method: 'string' } }, description: 'Orbital spec' },
    ],
    example: '["session/write-spec", "ProductOrbital", @entity.spec]',
  },
  'session/read-memory': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital memory from the session store.',
    hasSideEffects: false,
    returnType: 'object',
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-memory", "ProductOrbital"]',
  },
  'session/write-memory': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write per-orbital memory to the session store.',
    hasSideEffects: true, returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'memory', type: { kind: 'object', fields: { entityName: 'string', notes: { kind: 'array', of: 'string' } }, open: true }, description: 'Orbital memory' },
    ],
    example: '["session/write-memory", "ProductOrbital", @entity.memory]',
  },
  'session/read-history': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital conversation history.',
    hasSideEffects: false,
    returnType: 'array',
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-history", "ProductOrbital"]',
  },
  'session/append-history': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Append an entry to the per-orbital conversation history.',
    hasSideEffects: true, returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'entry', type: { kind: 'object', fields: { role: 'string', content: 'string' } }, description: 'History entry' },
    ],
    example: '["session/append-history", "ProductOrbital", { role: "user", content: "Add a search bar" }]',
  },
  'session/read-errors': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read validation errors for an orbital.',
    hasSideEffects: false,
    returnType: 'array',
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-errors", "ProductOrbital"]',
  },
  'session/write-errors': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write validation errors for an orbital.',
    hasSideEffects: true, returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'errors', type: { kind: 'array', of: 'ValidationError' }, description: 'Validation errors' },
    ],
    example: '["session/write-errors", "ProductOrbital", @entity.errors]',
  },
  'session/read-analysis': {
    module: 'session', category: 'std-session',
    minArity: 0, maxArity: 0,
    description: 'Read the pre-computed analysis result.',
    hasSideEffects: false,
    returnType: 'object',
    params: [],
    example: '["session/read-analysis"]',
  },
};

export function getSessionOperators(): string[] {
  return Object.keys(SESSION_OPERATORS);
}
