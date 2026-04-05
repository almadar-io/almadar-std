/**
 * Agent Module - AI Agent Intelligence Operations
 *
 * Provides operators for agent memory management, LLM access,
 * tool invocation, context window management, and session control.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Agent module operators.
 */
export const AGENT_OPERATORS: Record<string, StdOperatorMeta> = {
  // ==========================================================================
  // Memory (Pure)
  // ==========================================================================
  'agent/recall': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 2,
    description: 'Search memories by semantic query. Returns matching AgentMemoryRecord array.',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'query', type: 'string', description: 'Semantic search query' },
      { name: 'limit', type: 'number', description: 'Max results to return', optional: true },
    ],
    example: '["agent/recall", "user prefers dark mode"] => [{id, content, strength, ...}]',
  },
  'agent/memories': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 1,
    description: 'List all memories, optionally filtered by category.',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'category', type: 'string', description: 'Memory category filter', optional: true },
    ],
    example: '["agent/memories", "preference"] => [{id, content, category, ...}]',
  },
  'agent/memory-strength': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Get the strength value (0-1) of a specific memory.',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'id', type: 'string', description: 'Memory record ID' },
    ],
    example: '["agent/memory-strength", "mem_abc123"] => 0.85',
  },
  'agent/is-pinned': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Check if a memory is pinned (immune to decay).',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'id', type: 'string', description: 'Memory record ID' },
    ],
    example: '["agent/is-pinned", "mem_abc123"] => true',
  },

  // ==========================================================================
  // LLM (Pure)
  // ==========================================================================
  'agent/provider': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get the name of the current LLM provider.',
    hasSideEffects: false,
    returnType: 'string',
    params: [],
    example: '["agent/provider"] => "deepseek"',
  },
  'agent/model': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get the name of the current LLM model.',
    hasSideEffects: false,
    returnType: 'string',
    params: [],
    example: '["agent/model"] => "deepseek-chat"',
  },

  // ==========================================================================
  // Tools (Pure)
  // ==========================================================================
  'agent/tools': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get the list of available tool names.',
    hasSideEffects: false,
    returnType: 'array',
    params: [],
    example: '["agent/tools"] => ["execute", "validate-schema", "generate-schema"]',
  },

  // ==========================================================================
  // Context (Pure)
  // ==========================================================================
  'agent/token-count': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get the current token count in the context window.',
    hasSideEffects: false,
    returnType: 'number',
    params: [],
    example: '["agent/token-count"] => 12450',
  },
  'agent/context-usage': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get context window usage as a ratio (0-1).',
    hasSideEffects: false,
    returnType: 'number',
    params: [],
    example: '["agent/context-usage"] => 0.62',
  },

  // ==========================================================================
  // Session (Pure)
  // ==========================================================================
  'agent/session-id': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Get the current session identifier.',
    hasSideEffects: false,
    returnType: 'string',
    params: [],
    example: '["agent/session-id"] => "sess_a3f2k"',
  },

  // ==========================================================================
  // Memory (Effects)
  // ==========================================================================
  'agent/memorize': {
    module: 'agent',
    category: 'std-agent',
    minArity: 2,
    maxArity: 3,
    description: 'Store a new memory. Returns the new memory ID.',
    hasSideEffects: true,
    returnType: 'string',
    params: [
      { name: 'content', type: 'string', description: 'Memory content to store' },
      { name: 'category', type: 'string', description: 'Category: preference, correction, pattern-affinity, entity-template, error-resolution' },
      { name: 'scope', type: 'string', description: 'Scope: global or project', optional: true, defaultValue: 'global' },
    ],
    example: '["agent/memorize", "user prefers PascalCase", "preference"]',
  },
  'agent/forget': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Remove a memory by ID.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'id', type: 'string', description: 'Memory record ID to remove' },
    ],
    example: '["agent/forget", "mem_abc123"]',
  },
  'agent/pin': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Pin a memory to prevent decay.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'id', type: 'string', description: 'Memory record ID to pin' },
    ],
    example: '["agent/pin", "mem_abc123"]',
  },
  'agent/reinforce': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Increase a memory\'s strength (reinforcement learning signal).',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'id', type: 'string', description: 'Memory record ID to reinforce' },
    ],
    example: '["agent/reinforce", "mem_abc123"]',
  },
  'agent/decay': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 0,
    description: 'Apply strength decay to all unpinned memories. Returns count of forgotten memories.',
    hasSideEffects: true,
    returnType: 'number',
    params: [],
    example: '["agent/decay"] => 15',
  },

  // ==========================================================================
  // LLM (Effects)
  // ==========================================================================
  'agent/generate': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 2,
    description: 'Generate text from the LLM. Returns generated string.',
    hasSideEffects: true,
    returnType: 'string',
    params: [
      { name: 'prompt', type: 'string', description: 'Prompt text to send to LLM' },
      { name: 'options', type: 'object', description: 'Options: { provider?, model?, maxTokens? }', optional: true },
    ],
    example: '["agent/generate", "Summarize the user request"]',
  },
  'agent/switch-provider': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 2,
    description: 'Switch the active LLM provider and optionally the model.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'provider', type: 'string', description: 'Provider name (e.g., "deepseek", "openai", "anthropic")' },
      { name: 'model', type: 'string', description: 'Model name override', optional: true },
    ],
    example: '["agent/switch-provider", "openai", "gpt-4o"]',
  },

  // ==========================================================================
  // Tools (Effects)
  // ==========================================================================
  'agent/invoke': {
    module: 'agent',
    category: 'std-agent',
    minArity: 2,
    maxArity: 2,
    description: 'Invoke a tool by name with arguments. Returns tool result.',
    hasSideEffects: true,
    returnType: 'any',
    params: [
      { name: 'toolName', type: 'string', description: 'Name of the tool to invoke' },
      { name: 'args', type: 'object', description: 'Arguments to pass to the tool' },
    ],
    example: '["agent/invoke", "validate-schema", {"schema": "@entity"}]',
  },

  // ==========================================================================
  // Context (Effects)
  // ==========================================================================
  'agent/compact': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 1,
    description: 'Compact the context window. Returns { before, after, strategy, summary? }.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'strategy', type: 'string', description: 'Strategy: hybrid, summarize, truncate, extract', optional: true, defaultValue: 'hybrid' },
    ],
    example: '["agent/compact", "summarize"] => {before: 50000, after: 12000, ...}',
  },

  // ==========================================================================
  // Session (Effects)
  // ==========================================================================
  'agent/fork': {
    module: 'agent',
    category: 'std-agent',
    minArity: 0,
    maxArity: 1,
    description: 'Fork the current session. Returns new session ID.',
    hasSideEffects: true,
    returnType: 'string',
    params: [
      { name: 'label', type: 'string', description: 'Optional label for the fork point', optional: true },
    ],
    example: '["agent/fork", "before-refactor"] => "sess_fork_x7k2m"',
  },
  'agent/label': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 1,
    description: 'Label the current session checkpoint for later reference.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'text', type: 'string', description: 'Label text for the checkpoint' },
    ],
    example: '["agent/label", "schema-v2-complete"]',
  },

  // ==========================================================================
  // Search (Effects)
  // ==========================================================================
  'agent/search-code': {
    module: 'agent',
    category: 'std-agent',
    minArity: 1,
    maxArity: 2,
    description: 'Search code repositories. Returns array of { repo, path, url }.',
    hasSideEffects: true,
    returnType: 'array',
    params: [
      { name: 'query', type: 'string', description: 'Code search query' },
      { name: 'language', type: 'string', description: 'Programming language filter', optional: true },
    ],
    example: '["agent/search-code", "orbital schema validation", "typescript"]',
  },
};

/**
 * Get all agent operator names.
 */
export function getAgentOperators(): string[] {
  return Object.keys(AGENT_OPERATORS);
}
