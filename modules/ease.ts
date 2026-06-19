/**
 * Ease Module - Easing & Interpolation Curves
 *
 * Standard Penner easing curves and smoothstep. `t` is clamped to [0,1].
 * Unknown curve names fall back to linear. All operators are pure and total.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Ease module operators.
 */
export const EASE_OPERATORS: Record<string, StdOperatorMeta> = {
  'ease/apply': {
    module: 'ease',
    category: 'std-ease',
    minArity: 2,
    maxArity: 2,
    description:
      'Apply an easing curve to t∈[0,1]: linear, in-quad, out-quad, in-out-quad, in-cubic, out-cubic, in-out-cubic, elastic-out, bounce-out (unknown → linear)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'curve', type: 'string', description: 'Easing curve name' },
      { name: 't', type: 'number', description: 'Progress (clamped to 0-1)' },
    ],
    example: '["ease/apply", "in-quad", 0.5] // => 0.25',
  },
  'ease/smoothstep': {
    module: 'ease',
    category: 'std-ease',
    minArity: 3,
    maxArity: 3,
    description: 'Smoothstep: clamp((x-edge0)/(edge1-edge0),0,1) then t*t*(3-2*t)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'edge0', type: 'number', description: 'Lower edge' },
      { name: 'edge1', type: 'number', description: 'Upper edge' },
      { name: 'x', type: 'number', description: 'Input value' },
    ],
    example: '["ease/smoothstep", 0, 1, 0.5] // => 0.5',
  },
};

/**
 * Get all ease operator names.
 */
export function getEaseOperators(): string[] {
  return Object.keys(EASE_OPERATORS);
}
