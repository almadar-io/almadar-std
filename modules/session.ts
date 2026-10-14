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
import { STRING, list } from '../signature.js';

export const SESSION_OPERATORS: Record<string, StdOperatorMeta> = {
  'session/read-spec': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital spec.json from the session store.',
    hasSideEffects: false,
    returnType: 'OrbitalDefinition',
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-spec", "ProductOrbital"]',
  },
  'session/write-spec': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write the per-orbital spec.json to the session store.',
    hasSideEffects: true, runsOn: 'any', returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'spec', type: 'OrbitalDefinition', description: 'Orbital spec' },
    ],
    example: '["session/write-spec", "ProductOrbital", {"goal": "manage products"}]',
  },
  'session/read-memory': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital memory from the session store.',
    hasSideEffects: false,
    returnType: list('AgentMemoryRecord'),
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-memory", "ProductOrbital"]',
  },
  'session/write-memory': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write per-orbital memory to the session store.',
    hasSideEffects: true, runsOn: 'any', returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'memory', type: list('AgentMemoryRecord'), description: 'Orbital memory' },
    ],
    example: '["session/write-memory", "ProductOrbital", {"notes": ["initial draft"]}]',
  },
  'session/read-history': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read the per-orbital conversation history.',
    hasSideEffects: false,
    returnType: list('SessionHistoryEntry'),
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-history", "ProductOrbital"]',
  },
  'session/append-history': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Append an entry to the per-orbital conversation history.',
    hasSideEffects: true, runsOn: 'any', returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'entry', type: 'SessionHistoryEntry', description: 'History entry' },
    ],
    example: '["session/append-history", "ProductOrbital", { "role": "user", "content": "Add a search bar" }]',
  },
  'session/read-errors': {
    module: 'session', category: 'std-session',
    minArity: 1, maxArity: 1,
    description: 'Read validation errors for an orbital.',
    hasSideEffects: false,
    returnType: list(STRING),
    params: [{ name: 'orbitalName', type: 'string', description: 'Orbital name' }],
    example: '["session/read-errors", "ProductOrbital"]',
  },
  'session/write-errors': {
    module: 'session', category: 'std-session',
    minArity: 2, maxArity: 2,
    description: 'Write validation errors for an orbital.',
    hasSideEffects: true, runsOn: 'any', returnType: 'void',
    params: [
      { name: 'orbitalName', type: 'string', description: 'Orbital name' },
      { name: 'errors', type: list(STRING), description: 'Validation errors' },
    ],
    example: '["session/write-errors", "ProductOrbital", []]',
  },
  'session/read-analysis': {
    module: 'session', category: 'std-session',
    minArity: 0, maxArity: 0,
    description: 'Read the pre-computed analysis result.',
    hasSideEffects: false,
    returnType: 'AnalysisResult',
    params: [],
    example: '["session/read-analysis"]',
  },
};

export function getSessionOperators(): string[] {
  return Object.keys(SESSION_OPERATORS);
}
