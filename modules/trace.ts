/**
 * Trace Module - Observability: trace event emission and structured logging.
 *
 * Backed by @almadar/logger (emitTraceEvent / createLogger). Operators
 * resolve at runtime via EvaluationContextExtensions.trace → TraceContext.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const TRACE_OPERATORS: Record<string, StdOperatorMeta> = {
  'trace/emit': {
    module: 'trace', category: 'std-trace',
    minArity: 1, maxArity: 2,
    description: 'Emit a structured trace event for observability (115 call sites in rabit today).',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'event', type: 'string', description: 'Event type name' },
      { name: 'payload', type: { kind: 'object', fields: {}, open: true }, description: 'Event payload', optional: true },
    ],
    example: '["trace/emit", "coordinator_state_changed", { phase: @entity.phase }]',
  },
  'trace/log': {
    module: 'trace', category: 'std-trace',
    minArity: 2, maxArity: 2,
    description: 'Log a message at the given level.',
    hasSideEffects: true,
    returnType: 'void',
    params: [
      { name: 'level', type: { kind: 'union', of: [{ kind: 'literal', value: 'info' }, { kind: 'literal', value: 'warn' }, { kind: 'literal', value: 'error' }, { kind: 'literal', value: 'debug' }] }, description: 'Log level' },
      { name: 'message', type: 'string', description: 'Log message' },
    ],
    example: '["trace/log", "info", "coordinator started"]',
  },
};

export function getTraceOperators(): string[] {
  return Object.keys(TRACE_OPERATORS);
}
