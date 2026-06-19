/**
 * Grid Module - Tile/Cell Coordinate Operations
 *
 * Grid cells are {x,y} integers. Conversions between cell space, world space,
 * and isometric screen space. Cell arrays are returned in deterministic order
 * (parity depends on order). All operators are pure and total.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Grid module operators.
 */
export const GRID_OPERATORS: Record<string, StdOperatorMeta> = {
  'grid/to-world': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'Cell to world-space center point',
    hasSideEffects: false,
    returnType: 'point',
    params: [
      { name: 'cell', type: 'cell', description: 'Grid cell {x,y}' },
      { name: 'cellSize', type: 'number', description: 'Cell size in world units' },
    ],
    example: '["grid/to-world", {"x":2,"y":3}, 32] // => {"x":80,"y":112}',
  },
  'grid/from-world': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'World point to grid cell (floor)',
    hasSideEffects: false,
    returnType: 'cell',
    params: [
      { name: 'point', type: 'point', description: 'World point {x,y}' },
      { name: 'cellSize', type: 'number', description: 'Cell size in world units' },
    ],
    example: '["grid/from-world", {"x":80,"y":112}, 32] // => {"x":2,"y":3}',
  },
  'grid/iso-to-screen': {
    module: 'grid',
    category: 'std-grid',
    minArity: 3,
    maxArity: 3,
    description: 'Isometric cell to screen point',
    hasSideEffects: false,
    returnType: 'point',
    params: [
      { name: 'cell', type: 'cell', description: 'Grid cell {x,y}' },
      { name: 'tileW', type: 'number', description: 'Tile width' },
      { name: 'tileH', type: 'number', description: 'Tile height' },
    ],
    example: '["grid/iso-to-screen", {"x":1,"y":0}, 64, 32] // => {"x":32,"y":16}',
  },
  'grid/screen-to-iso': {
    module: 'grid',
    category: 'std-grid',
    minArity: 3,
    maxArity: 3,
    description: 'Screen point to isometric cell coordinates',
    hasSideEffects: false,
    returnType: 'point',
    params: [
      { name: 'point', type: 'point', description: 'Screen point {x,y}' },
      { name: 'tileW', type: 'number', description: 'Tile width' },
      { name: 'tileH', type: 'number', description: 'Tile height' },
    ],
    example: '["grid/screen-to-iso", {"x":32,"y":16}, 64, 32] // => {"x":1,"y":0}',
  },
  'grid/distance': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'Chebyshev distance max(|dx|,|dy|)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'cell', description: 'First cell {x,y}' },
      { name: 'b', type: 'cell', description: 'Second cell {x,y}' },
    ],
    example: '["grid/distance", {"x":0,"y":0}, {"x":3,"y":2}] // => 3',
  },
  'grid/manhattan-distance': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'Manhattan distance |dx|+|dy|',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'cell', description: 'First cell {x,y}' },
      { name: 'b', type: 'cell', description: 'Second cell {x,y}' },
    ],
    example: '["grid/manhattan-distance", {"x":0,"y":0}, {"x":3,"y":2}] // => 5',
  },
  'grid/neighbors': {
    module: 'grid',
    category: 'std-grid',
    minArity: 1,
    maxArity: 2,
    description: 'Adjacent cells in order N,E,S,W (+NE,SE,SW,NW if diagonal)',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'cell', type: 'cell', description: 'Center cell {x,y}' },
      { name: 'diagonal', type: 'boolean', description: 'Include diagonals', optional: true, defaultValue: false },
    ],
    example:
      '["grid/neighbors", {"x":1,"y":1}] // => [{"x":1,"y":0},{"x":2,"y":1},{"x":1,"y":2},{"x":0,"y":1}]',
  },
  'grid/cells-in-radius': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'All cells within Euclidean radius r (row-major order)',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'cell', type: 'cell', description: 'Center cell {x,y}' },
      { name: 'r', type: 'number', description: 'Radius' },
    ],
    example:
      '["grid/cells-in-radius", {"x":0,"y":0}, 1] // => [{"x":0,"y":-1},{"x":-1,"y":0},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1}]',
  },
  'grid/line': {
    module: 'grid',
    category: 'std-grid',
    minArity: 2,
    maxArity: 2,
    description: 'Bresenham line cells from a to b, inclusive, in step order',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'a', type: 'cell', description: 'Start cell {x,y}' },
      { name: 'b', type: 'cell', description: 'End cell {x,y}' },
    ],
    example:
      '["grid/line", {"x":0,"y":0}, {"x":2,"y":2}] // => [{"x":0,"y":0},{"x":1,"y":1},{"x":2,"y":2}]',
  },
  'grid/in-bounds': {
    module: 'grid',
    category: 'std-grid',
    minArity: 3,
    maxArity: 3,
    description: 'Whether cell lies within a w×h grid',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'cell', type: 'cell', description: 'Grid cell {x,y}' },
      { name: 'w', type: 'number', description: 'Grid width' },
      { name: 'h', type: 'number', description: 'Grid height' },
    ],
    example: '["grid/in-bounds", {"x":2,"y":3}, 5, 5] // => true',
  },
};

/**
 * Get all grid operator names.
 */
export function getGridOperators(): string[] {
  return Object.keys(GRID_OPERATORS);
}
