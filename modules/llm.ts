/**
 * LLM Module - LLM generation, tool-calling, embeddings, and context management.
 *
 * Backed by @almadar/llm (LLMClient). Operators resolve at runtime via
 * EvaluationContextExtensions.llm → LlmContext.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const LLM_OPERATORS: Record<string, StdOperatorMeta> = {
  'llm/generate': {
    module: 'llm',
    category: 'std-llm',
    minArity: 1,
    maxArity: 2,
    description: 'Generate text from an LLM. Returns the generated string.',
    hasSideEffects: true,
    returnType: 'string',
    params: [
      { name: 'prompt', type: 'string', description: 'Prompt text to send to the LLM' },
      { name: 'options', type: { kind: 'object', fields: { json: 'boolean', maxTokens: 'number', provider: 'string', model: 'string' }, open: true }, description: 'Generation options', optional: true },
    ],
    example: '["llm/generate", "Summarize the user request"]',
  },
  'llm/call-tools': {
    module: 'llm',
    category: 'std-llm',
    minArity: 2,
    maxArity: 2,
    description: 'Call the LLM with tool definitions. Returns the assistant response with optional tool calls and token usage.',
    hasSideEffects: true,
    returnType: 'LlmCallToolsResult',
    params: [
      { name: 'messages', type: { kind: 'array', of: 'LlmMessage' }, description: 'Conversation messages' },
      { name: 'tools', type: { kind: 'array', of: 'LlmToolDef' }, description: 'Tool definitions available to the LLM' },
    ],
    example: '["llm/call-tools", @entity.messages, @entity.tools]',
  },
  'llm/embed': {
    module: 'llm',
    category: 'std-llm',
    minArity: 1,
    maxArity: 1,
    description: 'Generate embeddings for an array of texts. Returns a 2D array of floats.',
    hasSideEffects: true,
    returnType: 'array',
    params: [
      { name: 'texts', type: { kind: 'array', of: 'string' }, description: 'Texts to embed' },
    ],
    example: '["llm/embed", ["hello", "world"]]',
  },
  'llm/token-count': {
    module: 'llm',
    category: 'std-llm',
    minArity: 0,
    maxArity: 0,
    description: 'Get the current token count in the context window.',
    hasSideEffects: false,
    returnType: 'number',
    params: [],
    example: '["llm/token-count"] => 12450',
  },
  'llm/switch': {
    module: 'llm',
    category: 'std-llm',
    minArity: 1,
    maxArity: 2,
    description: 'Switch the active LLM provider and optionally the model.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'provider', type: 'string', description: 'Provider name (e.g. "deepseek", "openai")' },
      { name: 'model', type: 'string', description: 'Model name override', optional: true },
    ],
    example: '["llm/switch", "openai", "gpt-4o"]',
  },
  'llm/compact': {
    module: 'llm',
    category: 'std-llm',
    minArity: 0,
    maxArity: 1,
    description: 'Compact the context window. Returns before/after token counts.',
    hasSideEffects: true,
    returnType: 'object',
    params: [
      { name: 'strategy', type: { kind: 'union', of: [{ kind: 'literal', value: 'hybrid' }, { kind: 'literal', value: 'summarize' }, { kind: 'literal', value: 'truncate' }, { kind: 'literal', value: 'extract' }] }, description: 'Compaction strategy', optional: true },
    ],
    example: '["llm/compact", "summarize"]',
  },
};

export function getLlmOperators(): string[] {
  return Object.keys(LLM_OPERATORS);
}
