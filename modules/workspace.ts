/**
 * Workspace Module - Orbital workspace file operations.
 *
 * Backed by @almadar/workspace (WorkspaceService). Operators resolve at
 * runtime via EvaluationContextExtensions.workspace → WorkspaceContext.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const WORKSPACE_OPERATORS: Record<string, StdOperatorMeta> = {
  'workspace/read-orbital': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Read an orbital definition from the workspace by name.',
    hasSideEffects: false,
    returnType: 'object',
    params: [{ name: 'name', type: 'string', description: 'Orbital name' }],
    example: '["workspace/read-orbital", "ProductOrbital"]',
  },
  'workspace/write-orbital': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 2, maxArity: 2,
    description: 'Write an orbital definition to the workspace.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'name', type: 'string', description: 'Orbital name' },
      { name: 'def', type: { kind: 'entityRef' }, description: 'Orbital definition to write' },
    ],
    example: '["workspace/write-orbital", "ProductOrbital", @entity.def]',
  },
  'workspace/read-file': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Read a file from the workspace.',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'path', type: 'string', description: 'File path relative to workspace root' }],
    example: '["workspace/read-file", ".almadar/sessions/Coordinator/messages.json"]',
  },
  'workspace/write-file': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 2, maxArity: 2,
    description: 'Write a file to the workspace.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'path', type: 'string', description: 'File path relative to workspace root' },
      { name: 'content', type: 'string', description: 'File content' },
    ],
    example: '["workspace/write-file", "orbitals/Product.orb", @entity.orbJson]',
  },
  'workspace/exists': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Check if a file exists in the workspace.',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'path', type: 'string', description: 'File path' }],
    example: '["workspace/exists", "orbitals/Product.orb"]',
  },
  'workspace/list-orbitals': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 0, maxArity: 0,
    description: 'List all orbital names in the workspace.',
    hasSideEffects: false,
    returnType: 'array',
    params: [],
    example: '["workspace/list-orbitals"] => ["ProductOrbital", "CartOrbital"]',
  },
  'workspace/read-schema': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 0, maxArity: 0,
    description: 'Read the composed schema.orb from the workspace.',
    hasSideEffects: false,
    returnType: 'object',
    params: [],
    example: '["workspace/read-schema"]',
  },
  'workspace/write-schema': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Write the composed schema.orb to the workspace.',
    hasSideEffects: true,
    returnType: 'void',
    params: [{ name: 'schema', type: { kind: 'entityRef' }, description: 'Composed schema' }],
    example: '["workspace/write-schema", @entity.composed]',
  },
  'workspace/read-plan': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 0, maxArity: 0,
    description: 'Read the plan snapshot from the workspace.',
    hasSideEffects: false,
    returnType: 'object',
    params: [],
    example: '["workspace/read-plan"]',
  },
  'workspace/write-plan': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Write the plan snapshot to the workspace.',
    hasSideEffects: true,
    returnType: 'void',
    params: [{ name: 'snapshot', type: { kind: 'object', fields: { id: 'string', status: 'string' } }, description: 'Plan snapshot' }],
    example: '["workspace/write-plan", @entity.plan]',
  },
  'workspace/archive-orbital': {
    module: 'workspace',
    category: 'std-workspace',
    minArity: 1, maxArity: 1,
    description: 'Archive (remove from active set) an orbital from the workspace.',
    hasSideEffects: true,
    returnType: 'void',
    params: [{ name: 'name', type: 'string', description: 'Orbital name to archive' }],
    example: '["workspace/archive-orbital", "OldFeatureOrbital"]',
  },
};

export function getWorkspaceOperators(): string[] {
  return Object.keys(WORKSPACE_OPERATORS);
}
