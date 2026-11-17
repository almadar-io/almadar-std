/**
 * Color Module - WCAG 2.2 colour measures
 *
 * Relative luminance, contrast ratio and compositing of CSS colour strings (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`,
 * `rgb()`, `rgba()`, `hsl()`, `hsla()`, named colours, `transparent`). A malformed colour is an error.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Color module operators.
 */
export const COLOR_OPERATORS: Record<string, StdOperatorMeta> = {
  'color/luminance': {
    module: 'color',
    category: 'std-color',
    evaluation: 'strict',
    minArity: 1,
    maxArity: 1,
    description: 'WCAG 2.2 relative luminance of a CSS colour, 0 (black) to 1 (white); malformed colour is an error',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'color', type: 'string', description: 'CSS colour string' }],
    example: '["color/luminance", "#ffffff"] // => 1',
  },
  'color/contrast': {
    module: 'color',
    category: 'std-color',
    evaluation: 'strict',
    minArity: 2,
    maxArity: 2,
    description:
      'WCAG 2.2 contrast ratio (lighter+0.05)/(darker+0.05), 1 to 21, order-free; a translucent first colour is composited over the second, which must be opaque; malformed colour is an error',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'string', description: 'CSS colour string (foreground; may be translucent)' },
      { name: 'b', type: 'string', description: 'CSS colour string (backdrop; must be opaque)' },
    ],
    example: '["color/contrast", "#000000", "#ffffff"] // => 21',
  },
  'color/composite': {
    module: 'color',
    category: 'std-color',
    evaluation: 'strict',
    minArity: 2,
    maxArity: 2,
    description:
      'A CSS colour (may be translucent) painted over an opaque backdrop, as #rrggbb with channels rounded half up; malformed colour or translucent backdrop is an error',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'top', type: 'string', description: 'CSS colour string (may be translucent)' },
      { name: 'backdrop', type: 'string', description: 'CSS colour string (must be opaque)' },
    ],
    example: '["color/composite", "rgba(0,0,0,0.5)", "#ffffff"] // => "#808080"',
  },
};

/**
 * Get all color operator names.
 */
export function getColorOperators(): string[] {
  return Object.keys(COLOR_OPERATORS);
}
