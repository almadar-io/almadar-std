/**
 * Anim Module - Sprite Animation Helpers
 *
 * Frame selection, sprite-sheet rect extraction, and facing direction from
 * movement delta. All operators are pure and total.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Anim module operators.
 */
export const ANIM_OPERATORS: Record<string, StdOperatorMeta> = {
  'anim/frame-at': {
    module: 'anim',
    category: 'std-anim',
    minArity: 3,
    maxArity: 4,
    description: 'Frame index for elapsed time; loops by default, else clamps to last',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'elapsed', type: 'number', description: 'Elapsed time' },
      { name: 'frameDur', type: 'number', description: 'Duration per frame' },
      { name: 'frameCount', type: 'number', description: 'Total frame count' },
      { name: 'loop', type: 'boolean', description: 'Loop the animation', optional: true, defaultValue: true },
    ],
    example: '["anim/frame-at", 0.35, 0.1, 3] // => 0',
  },
  'anim/sheet-rect': {
    module: 'anim',
    category: 'std-anim',
    minArity: 4,
    maxArity: 4,
    description: 'Source rect {sx,sy,sw,sh} for a frame index on a sprite sheet',
    hasSideEffects: false,
    returnType: 'object',
    params: [
      { name: 'frameIndex', type: 'number', description: 'Zero-based frame index' },
      { name: 'cols', type: 'number', description: 'Columns in the sheet' },
      { name: 'frameW', type: 'number', description: 'Frame width' },
      { name: 'frameH', type: 'number', description: 'Frame height' },
    ],
    example: '["anim/sheet-rect", 5, 4, 16, 16] // => {"sx":16,"sy":16,"sw":16,"sh":16}',
  },
  'anim/direction-from-delta': {
    module: 'anim',
    category: 'std-anim',
    minArity: 2,
    maxArity: 3,
    description: 'Facing direction string from (dx,dy); 4-way (default) or 8-way',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'dx', type: 'number', description: 'X delta' },
      { name: 'dy', type: 'number', description: 'Y delta' },
      { name: 'ways', type: 'number', description: 'Number of directions (4 or 8)', optional: true, defaultValue: 4 },
    ],
    example: '["anim/direction-from-delta", 1, 0] // => "right"',
  },
};

/**
 * Get all anim operator names.
 */
export function getAnimOperators(): string[] {
  return Object.keys(ANIM_OPERATORS);
}
