/**
 * Path Module - Grid Pathfinding
 *
 * Deterministic grid pathfinding over integer cells `{x,y}`. All operators
 * are pure and produce byte-identical JS↔Rust output via a fixed neighbor
 * order and stable tie-break (lower f, then lower h, then earliest insertion).
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Path module operators.
 */
export const PATH_OPERATORS: Record<string, StdOperatorMeta> = {
  'path/astar': {
    module: 'path',
    category: 'std-path',
    minArity: 5,
    maxArity: 6,
    description: 'A* shortest path on a w×h grid; returns cells start→goal (incl. both) or [] if none',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'start', type: 'vector', description: 'Start cell {x,y}' },
      { name: 'goal', type: 'vector', description: 'Goal cell {x,y}' },
      { name: 'blocked', type: { kind: 'array', of: 'vector' }, description: 'Blocked cells [{x,y}, ...]' },
      { name: 'w', type: 'number', description: 'Grid width (x in [0,w))' },
      { name: 'h', type: 'number', description: 'Grid height (y in [0,h))' },
      { name: 'diagonal', type: 'boolean', description: 'Allow 8-direction moves (default false)', optional: true },
    ],
    example: '["path/astar", {"x":0,"y":0}, {"x":2,"y":0}, [], 3, 1] // => [{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0}]',
  },
  'path/reachable': {
    module: 'path',
    category: 'std-path',
    minArity: 5,
    maxArity: 6,
    description: 'BFS cells reachable within N moves from start (incl. start); sorted row-major',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'start', type: 'vector', description: 'Start cell {x,y}' },
      { name: 'steps', type: 'number', description: 'Maximum number of moves' },
      { name: 'blocked', type: { kind: 'array', of: 'vector' }, description: 'Blocked cells [{x,y}, ...]' },
      { name: 'w', type: 'number', description: 'Grid width (x in [0,w))' },
      { name: 'h', type: 'number', description: 'Grid height (y in [0,h))' },
      { name: 'diagonal', type: 'boolean', description: 'Allow 8-direction moves (default false)', optional: true },
    ],
    example: '["path/reachable", {"x":1,"y":1}, 1, [], 3, 3, false] // => 5 cross-shaped cells, row-major',
  },
};

/**
 * Get all path operator names.
 */
export function getPathOperators(): string[] {
  return Object.keys(PATH_OPERATORS);
}
