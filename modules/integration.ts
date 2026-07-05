/**
 * Integration Module - External integration operators (HTTP, GitHub, etc.)
 *
 * Zero-JsonValue return policy (§3.2 of design doc):
 * - integration/http requires a responseSchema param (Option B)
 * - integration/github-* are typed wrappers per endpoint (Option C)
 *
 * These are placeholder contracts today (rabit doesn't call external APIs yet);
 * they exist so a lolo organism can call external integrations with type safety.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const INTEGRATION_OPERATORS: Record<string, StdOperatorMeta> = {
  'integration/http': {
    module: 'integration', category: 'std-integration',
    minArity: 3, maxArity: 4,
    description: 'HTTP request with caller-declared response schema. Validates the response against the schema before returning.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'method', type: 'string', description: 'HTTP method (GET, POST, ...)' },
      { name: 'url', type: 'string', description: 'Request URL' },
      { name: 'responseSchema', type: { kind: 'object', fields: {}, open: true }, description: 'JSON Schema the response must satisfy' },
      { name: 'body', type: { kind: 'object', fields: {}, open: true }, description: 'Request body (for POST/PUT)', optional: true },
    ],
    example: '["integration/http", "GET", "https://api.github.com/repos/foo/bar", { name: "string", stars: "number" }]',
  },
  'integration/github-get-repo': {
    module: 'integration', category: 'std-integration',
    minArity: 2, maxArity: 2,
    description: 'Get a GitHub repository. Typed wrapper for the GitHub API.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'owner', type: 'string', description: 'Repository owner' },
      { name: 'repo', type: 'string', description: 'Repository name' },
    ],
    example: '["integration/github-get-repo", "almadar-io", "almadar"]',
  },
  'integration/github-create-issue': {
    module: 'integration', category: 'std-integration',
    minArity: 3, maxArity: 3,
    description: 'Create a GitHub issue. Typed wrapper for the GitHub API.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'repo', type: 'string', description: 'Full repo name (owner/repo)' },
      { name: 'title', type: 'string', description: 'Issue title' },
      { name: 'body', type: 'string', description: 'Issue body' },
    ],
    example: '["integration/github-create-issue", "almadar-io/almadar", "Bug: validate fails", "Details..."]',
  },
};

export function getIntegrationOperators(): string[] {
  return Object.keys(INTEGRATION_OPERATORS);
}
