/**
 * Geo Module - 2D Collision & Geometry
 *
 * Rect = {x,y,w,h} (top-left origin). Circle = {x,y,r}. Point = {x,y}.
 * Segment = {x1,y1,x2,y2}. All operators are pure and total.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Geo module operators.
 */
export const GEO_OPERATORS: Record<string, StdOperatorMeta> = {
  'geo/aabb-overlap': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Axis-aligned bounding box overlap test',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: 'rect', description: 'First rect {x,y,w,h}' },
      { name: 'b', type: 'rect', description: 'Second rect {x,y,w,h}' },
    ],
    example:
      '["geo/aabb-overlap", {"x":0,"y":0,"w":10,"h":10}, {"x":5,"y":5,"w":10,"h":10}] // => true',
  },
  'geo/circle-overlap': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Circle overlap test: distance(centers) <= a.r+b.r',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: 'circle', description: 'First circle {x,y,r}' },
      { name: 'b', type: 'circle', description: 'Second circle {x,y,r}' },
    ],
    example:
      '["geo/circle-overlap", {"x":0,"y":0,"r":3}, {"x":4,"y":0,"r":2}] // => true',
  },
  'geo/rect-circle-overlap': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Rect-circle overlap via closest point on rect to circle center',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'rect', type: 'rect', description: 'Rect {x,y,w,h}' },
      { name: 'circle', type: 'circle', description: 'Circle {x,y,r}' },
    ],
    example:
      '["geo/rect-circle-overlap", {"x":0,"y":0,"w":10,"h":10}, {"x":12,"y":5,"r":3}] // => true',
  },
  'geo/point-in-rect': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Point containment in rect (inclusive bounds)',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'p', type: 'point', description: 'Point {x,y}' },
      { name: 'rect', type: 'rect', description: 'Rect {x,y,w,h}' },
    ],
    example: '["geo/point-in-rect", {"x":5,"y":5}, {"x":0,"y":0,"w":10,"h":10}] // => true',
  },
  'geo/point-in-circle': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Point containment in circle (inclusive)',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'p', type: 'point', description: 'Point {x,y}' },
      { name: 'circle', type: 'circle', description: 'Circle {x,y,r}' },
    ],
    example: '["geo/point-in-circle", {"x":1,"y":1}, {"x":0,"y":0,"r":2}] // => true',
  },
  'geo/reflect': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Reflect vector v across normal n (assumed normalized)',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'v', type: 'vector', description: 'Incident vector {x,y[,z]}' },
      { name: 'n', type: 'vector', description: 'Surface normal (normalized)' },
    ],
    example: '["geo/reflect", {"x":1,"y":-1}, {"x":0,"y":1}] // => {"x":1,"y":1}',
  },
  'geo/segment-intersect': {
    module: 'geo',
    category: 'std-geo',
    minArity: 2,
    maxArity: 2,
    description: 'Intersection point of two segments, or null when parallel/none',
    hasSideEffects: false,
    returnType: 'point | null',
    params: [
      { name: 'a', type: 'segment', description: 'First segment {x1,y1,x2,y2}' },
      { name: 'b', type: 'segment', description: 'Second segment {x1,y1,x2,y2}' },
    ],
    example:
      '["geo/segment-intersect", {"x1":0,"y1":0,"x2":4,"y2":4}, {"x1":0,"y1":4,"x2":4,"y2":0}] // => {"x":2,"y":2}',
  },
};

/**
 * Get all geo operator names.
 */
export function getGeoOperators(): string[] {
  return Object.keys(GEO_OPERATORS);
}
