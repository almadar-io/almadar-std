/**
 * Vec Module - 2D/3D Vector Operations
 *
 * Vectors are objects `{x,y}` or `{x,y,z}`. Dimensionality follows the first
 * vector argument; missing `z` reads as 0. All operators are pure and total
 * (degenerate input returns a defined value, never an error).
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Vec module operators.
 */
export const VEC_OPERATORS: Record<string, StdOperatorMeta> = {
  'vec/add': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Componentwise vector addition a+b',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/add", {"x":1,"y":2}, {"x":3,"y":4}] // => {"x":4,"y":6}',
  },
  'vec/sub': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Componentwise vector subtraction a-b',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/sub", {"x":5,"y":7}, {"x":1,"y":2}] // => {"x":4,"y":5}',
  },
  'vec/scale': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Componentwise scalar multiply a*k',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' },
      { name: 'k', type: 'number', description: 'Scalar factor' },
    ],
    example: '["vec/scale", {"x":2,"y":3}, 2] // => {"x":4,"y":6}',
  },
  'vec/dot': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Dot product ax·bx+ay·by(+az·bz)',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/dot", {"x":1,"y":2}, {"x":3,"y":4}] // => 11',
  },
  'vec/cross': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: '3D cross product → vector; 2D → scalar ax·by-ay·bx',
    hasSideEffects: false,
    returnType: 'vector | number',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/cross", {"x":1,"y":0}, {"x":0,"y":1}] // => 1',
  },
  'vec/length': {
    module: 'vec',
    category: 'std-vec',
    minArity: 1,
    maxArity: 1,
    description: 'Vector magnitude sqrt(dot(a,a))',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' }],
    example: '["vec/length", {"x":3,"y":4}] // => 5',
  },
  'vec/length-sq': {
    module: 'vec',
    category: 'std-vec',
    minArity: 1,
    maxArity: 1,
    description: 'Squared magnitude dot(a,a)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' }],
    example: '["vec/length-sq", {"x":3,"y":4}] // => 25',
  },
  'vec/normalize': {
    module: 'vec',
    category: 'std-vec',
    minArity: 1,
    maxArity: 1,
    description: 'Unit vector a/len; zero-length → zero vector (same dim)',
    hasSideEffects: false,
    returnType: 'vector',
    params: [{ name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' }],
    example: '["vec/normalize", {"x":3,"y":4}] // => {"x":0.6,"y":0.8}',
  },
  'vec/distance': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Euclidean distance length(sub(a,b))',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/distance", {"x":0,"y":0}, {"x":3,"y":4}] // => 5',
  },
  'vec/distance-sq': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Squared distance length-sq(sub(a,b))',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'vector', description: 'First vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Second vector {x,y[,z]}' },
    ],
    example: '["vec/distance-sq", {"x":0,"y":0}, {"x":3,"y":4}] // => 25',
  },
  'vec/lerp': {
    module: 'vec',
    category: 'std-vec',
    minArity: 3,
    maxArity: 3,
    description: 'Componentwise linear interpolation a+(b-a)*t',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'Start vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'End vector {x,y[,z]}' },
      { name: 't', type: 'number', description: 'Interpolation factor' },
    ],
    example: '["vec/lerp", {"x":0,"y":0}, {"x":10,"y":20}, 0.5] // => {"x":5,"y":10}',
  },
  'vec/angle': {
    module: 'vec',
    category: 'std-vec',
    minArity: 1,
    maxArity: 2,
    description: 'Heading atan2(y,x) (1 arg) or angle between two vectors (2 args), radians',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' },
      { name: 'b', type: 'vector', description: 'Optional second vector', optional: true },
    ],
    example: '["vec/angle", {"x":1,"y":0}, {"x":0,"y":1}] // => 1.5707963267948966',
  },
  'vec/rotate': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: '2D rotate by rad (z preserved): x\'=x·cos-y·sin, y\'=x·sin+y·cos',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' },
      { name: 'rad', type: 'number', description: 'Rotation angle in radians' },
    ],
    example: '["vec/rotate", {"x":1,"y":0}, 1.5707963267948966] // => {"x":0,"y":1}',
  },
  'vec/clamp-length': {
    module: 'vec',
    category: 'std-vec',
    minArity: 2,
    maxArity: 2,
    description: 'Clamp magnitude to max (preserves direction)',
    hasSideEffects: false,
    returnType: 'vector',
    params: [
      { name: 'a', type: 'vector', description: 'Vector {x,y[,z]}' },
      { name: 'max', type: 'number', description: 'Maximum magnitude' },
    ],
    example: '["vec/clamp-length", {"x":3,"y":4}, 2.5] // => {"x":1.5,"y":2}',
  },
};

/**
 * Get all vec operator names.
 */
export function getVecOperators(): string[] {
  return Object.keys(VEC_OPERATORS);
}
