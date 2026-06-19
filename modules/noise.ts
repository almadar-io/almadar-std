/**
 * Noise Module - Coherent Procedural Noise
 *
 * Deterministic coherent-noise generators (perlin-derived) for procedural
 * generation. All operators are pure and produce byte-identical JS↔Rust
 * output (shared verbatim permutation table). Output range [-1, 1].
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Noise module operators.
 */
export const NOISE_OPERATORS: Record<string, StdOperatorMeta> = {
  'noise/perlin': {
    module: 'noise',
    category: 'std-noise',
    minArity: 2,
    maxArity: 3,
    description: '2D Perlin noise at (x,y) with optional seed; output [-1,1]',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'x', type: 'number', description: 'X coordinate' },
      { name: 'y', type: 'number', description: 'Y coordinate' },
      { name: 'seed', type: 'number', description: 'Optional integer seed (default 0)', optional: true },
    ],
    example: '["noise/perlin", 1.5, 2.5, 0] // => coherent value in [-1,1]',
  },
  'noise/simplex': {
    module: 'noise',
    category: 'std-noise',
    minArity: 2,
    maxArity: 3,
    description: 'Value-coherent noise (perlin-derived) at (x,y) with optional seed; output [-1,1]',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'x', type: 'number', description: 'X coordinate' },
      { name: 'y', type: 'number', description: 'Y coordinate' },
      { name: 'seed', type: 'number', description: 'Optional integer seed (default 0)', optional: true },
    ],
    example: '["noise/simplex", 1.5, 2.5, 0] // => coherent value in [-1,1]',
  },
  'noise/fbm': {
    module: 'noise',
    category: 'std-noise',
    minArity: 3,
    maxArity: 4,
    description: 'Fractal Brownian motion: summed perlin octaves (clamped 1..8); output [-1,1]',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'x', type: 'number', description: 'X coordinate' },
      { name: 'y', type: 'number', description: 'Y coordinate' },
      { name: 'octaves', type: 'number', description: 'Octave count (floored, clamped to 1..8)' },
      { name: 'seed', type: 'number', description: 'Optional integer seed (default 0)', optional: true },
    ],
    example: '["noise/fbm", 1.5, 2.5, 4, 0] // => layered value in [-1,1]',
  },
};

/**
 * Get all noise operator names.
 */
export function getNoiseOperators(): string[] {
  return Object.keys(NOISE_OPERATORS);
}
