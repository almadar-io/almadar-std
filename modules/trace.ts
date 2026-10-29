/**
 * Trace Module - Observability: trace event emission and structured logging.
 *
 * Backed by @almadar/logger (emitTraceEvent / createLogger). Operators
 * resolve at runtime via EvaluationContextExtensions.trace → TraceContext.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { rec } from '../signature.js';

export const TRACE_OPERATORS: Record<string, StdOperatorMeta> = {
  'trace/emit': {
    module: 'trace', category: 'std-trace',
    host: 'substrate',
    minArity: 1, maxArity: 2,
    description: 'Emit a structured trace event for observability (115 call sites in rabit today).',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'event', type: 'string', description: 'Event type name' },
      { name: 'payload', type: rec('P'), description: 'Event payload', optional: true },
    ],
    example: '["trace/emit", "coordinator_state_changed", {"phase": "planning"}]',
  },
};

export function getTraceOperators(): string[] {
  return Object.keys(TRACE_OPERATORS);
}
