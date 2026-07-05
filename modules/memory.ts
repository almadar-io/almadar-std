/**
 * Memory Module - Agent memory recall, store, and listing.
 *
 * Backed by rabit SessionStore memory adapter. Operators resolve at
 * runtime via EvaluationContextExtensions.memory → MemoryContext.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const MEMORY_OPERATORS: Record<string, StdOperatorMeta> = {
  'memory/recall': {
    module: 'memory', category: 'std-memory',
    minArity: 1, maxArity: 2,
    description: 'Search memories by semantic query. Returns matching memory records.',
    hasSideEffects: false,
    returnType: { kind: 'array', of: 'AgentMemoryRecord' },
    params: [
      { name: 'query', type: 'string', description: 'Semantic search query' },
      { name: 'limit', type: 'number', description: 'Max results to return', optional: true },
    ],
    example: '["memory/recall", "user prefers dark mode"]',
  },
  'memory/store': {
    module: 'memory', category: 'std-memory',
    minArity: 2, maxArity: 3,
    description: 'Store a new memory. Returns the new memory ID.',
    hasSideEffects: true,
    returnType: 'string',
    params: [
      { name: 'content', type: 'string', description: 'Memory content to store' },
      { name: 'category', type: 'string', description: 'Category: preference, correction, pattern-affinity, entity-template, error-resolution' },
      { name: 'scope', type: 'string', description: 'Scope: global or project', optional: true },
    ],
    example: '["memory/store", "user prefers PascalCase", "preference"]',
  },
  'memory/list': {
    module: 'memory', category: 'std-memory',
    minArity: 0, maxArity: 1,
    description: 'List all memories, optionally filtered by category.',
    hasSideEffects: false,
    returnType: { kind: 'array', of: 'AgentMemoryRecord' },
    params: [
      { name: 'category', type: 'string', description: 'Memory category filter', optional: true },
    ],
    example: '["memory/list", "preference"]',
  },
};

export function getMemoryOperators(): string[] {
  return Object.keys(MEMORY_OPERATORS);
}
