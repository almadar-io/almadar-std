/**
 * Tensor Module - Tensor Operations
 *
 * Provides operators for creating and manipulating tensors.
 * Tensors are multi-dimensional arrays used for neural network inputs/outputs.
 * Compiled to native tensor libraries (PyTorch, NumPy, etc.) by the Rust compiler.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

/**
 * Tensor module operators.
 * These operators create and manipulate tensors.
 */
export const TENSOR_OPERATORS: Record<string, StdOperatorMeta> = {
  // ============================================================================
  // Creation
  // ============================================================================

  'tensor/from': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Create tensor from array',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'data', type: 'array', description: 'Array of numbers (can be nested for multi-dimensional)' },
    ],
    example: '["tensor/from", [1.0, 2.0, 3.0]]',
  },
  'tensor/zeros': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Create tensor filled with zeros',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'shape', type: 'number[]', description: 'Shape of the tensor' },
    ],
    example: '["tensor/zeros", [3, 4]] // 3x4 tensor of zeros',
  },
  'tensor/ones': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Create tensor filled with ones',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'shape', type: 'number[]', description: 'Shape of the tensor' },
    ],
    example: '["tensor/ones", [3, 4]] // 3x4 tensor of ones',
  },
  'tensor/rand': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Create tensor with random values in [0, 1)',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'shape', type: 'number[]', description: 'Shape of the tensor' },
    ],
    example: '["tensor/rand", [16]] // Random 16-element vector',
  },
  'tensor/randn': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Create tensor with random values from standard normal distribution',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'shape', type: 'number[]', description: 'Shape of the tensor' },
    ],
    example: '["tensor/randn", [16]] // Random normal 16-element vector',
  },

  // ============================================================================
  // Shape & Indexing
  // ============================================================================

  'tensor/shape': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Get tensor shape as array',
    hasSideEffects: false,
    returnType: 'number[]',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
    ],
    example: '["tensor/shape", [[1, 2], [3, 4]]] // => [2, 2]',
  },
  'tensor/get': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Get element at index',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'index', type: 'number | number[]', description: 'Index (single for 1D, array for multi-D)' },
    ],
    example: '["tensor/get", [10, 20, 30, 40], 3] // Get 4th element',
  },
  'tensor/slice': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 3,
    maxArity: 3,
    description: 'Get slice of tensor',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'start', type: 'number', description: 'Start index' },
      { name: 'end', type: 'number', description: 'End index (exclusive)' },
    ],
    example: '["tensor/slice", [10, 20, 30, 40], 0, 3] // First 3 elements',
  },
  'tensor/reshape': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Reshape tensor to new shape (total elements must match)',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'shape', type: 'number[]', description: 'New shape' },
    ],
    example: '["tensor/reshape", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], [4, 4]] // Reshape to 4x4',
  },
  'tensor/flatten': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Flatten tensor to 1D',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
    ],
    example: '["tensor/flatten", [[1, 2], [3, 4]]]',
  },

  // ============================================================================
  // Math Operations
  // ============================================================================

  'tensor/add': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Element-wise addition',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor | number', description: 'Second tensor or scalar' },
    ],
    example: '["tensor/add", [1, 2], [3, 4]]',
  },
  'tensor/sub': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Element-wise subtraction',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor | number', description: 'Second tensor or scalar' },
    ],
    example: '["tensor/sub", [1, 2], [3, 4]]',
  },
  'tensor/mul': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Element-wise multiplication',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor | number', description: 'Second tensor or scalar' },
    ],
    example: '["tensor/mul", [0.5, 0.7], 0.99] // Decay weights',
  },
  'tensor/div': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Element-wise division',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor | number', description: 'Second tensor or scalar' },
    ],
    example: '["tensor/div", [10, 20], 2]',
  },
  'tensor/matmul': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Matrix multiplication',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor (NxM)' },
      { name: 'b', type: 'tensor', description: 'Second tensor (MxK)' },
    ],
    example: '["tensor/matmul", [[1, 2], [3, 4]], [[5, 6], [7, 8]]]',
  },
  'tensor/dot': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Dot product of two 1D tensors',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: 'tensor', description: 'First vector' },
      { name: 'b', type: 'tensor', description: 'Second vector' },
    ],
    example: '["tensor/dot", [1, 2], [3, 4]]',
  },

  // ============================================================================
  // Reductions
  // ============================================================================

  'tensor/sum': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'Sum of tensor elements',
    hasSideEffects: false,
    returnType: 'number | tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Dimension to reduce', optional: true },
    ],
    example: '["tensor/sum", [1, 0, 1]] // Total reward',
  },
  'tensor/mean': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'Mean of tensor elements',
    hasSideEffects: false,
    returnType: 'number | tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Dimension to reduce', optional: true },
    ],
    example: '["tensor/mean", [0.2, 0.4, 0.6]]',
  },
  'tensor/max': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'Maximum value in tensor',
    hasSideEffects: false,
    returnType: 'number | tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Dimension to reduce', optional: true },
    ],
    example: '["tensor/max", [0.1, 0.9, 0.3]]',
  },
  'tensor/min': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'Minimum value in tensor',
    hasSideEffects: false,
    returnType: 'number | tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Dimension to reduce', optional: true },
    ],
    example: '["tensor/min", [3, 1, 2]]',
  },
  'tensor/argmax': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'Index of maximum value',
    hasSideEffects: false,
    returnType: 'number | tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Dimension to reduce', optional: true },
    ],
    example: '["tensor/argmax", [0.1, 0.9, 0.3]] // Best action index',
  },
  'tensor/norm': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 2,
    description: 'L2 norm of tensor',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'p', type: 'number', description: 'Norm order (default 2)', optional: true, defaultValue: 2 },
    ],
    example: '["tensor/norm", [3, 4]]',
  },

  // ============================================================================
  // Range Validation (for contracts)
  // ============================================================================

  'tensor/allInRange': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Check if all elements are within range [min, max]',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'range', type: '[number, number]', description: 'Range as [min, max]' },
    ],
    example: '["tensor/allInRange", [0.5, -0.2], [-1.0, 1.0]]',
  },
  'tensor/outOfRangeIndices': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Get indices of elements outside range',
    hasSideEffects: false,
    returnType: 'number[]',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'range', type: '[number, number]', description: 'Range as [min, max]' },
    ],
    example: '["tensor/outOfRangeIndices", [0.5, 1.5], [-1.0, 1.0]]',
  },
  'tensor/clamp': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 3,
    maxArity: 3,
    description: 'Clamp all elements to range [min, max]',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'min', type: 'number', description: 'Minimum value' },
      { name: 'max', type: 'number', description: 'Maximum value' },
    ],
    example: '["tensor/clamp", [5, -15, 3], -10.0, 10.0]',
  },
  'tensor/clampPerDim': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Clamp each dimension to its specified range',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'ranges', type: 'object', description: 'Per-dimension ranges { "0": {min, max}, ... }' },
    ],
    example: '["tensor/clampPerDim", [5, -15], {"0": {"min": 0, "max": 10}, "1": {"min": -10, "max": 10}}]',
  },
  'tensor/outOfRangeDims': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Get dimensions that exceed their specified ranges',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'ranges', type: 'object', description: 'Per-dimension ranges { "0": {min, max}, ... }' },
    ],
    example: '["tensor/outOfRangeDims", [5, -15], {"0": {"min": 0, "max": 10}, "1": {"min": -10, "max": 10}}]',
  },

  // ============================================================================
  // Conversion
  // ============================================================================

  'tensor/toArray': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Convert tensor to nested array',
    hasSideEffects: false,
    returnType: 'array',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
    ],
    example: '["tensor/toArray", [[1, 2], [3, 4]]]',
  },
  'tensor/toList': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Convert 1D tensor to flat array',
    hasSideEffects: false,
    returnType: 'number[]',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor (must be 1D)' },
    ],
    example: '["tensor/toList", [1, 2, 3]]',
  },

  // ============================================================================
  // Concatenation / stacking / shape manipulation
  // ============================================================================

  'tensor/cat': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Concatenate two tensors along the last dimension',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor', description: 'Second tensor' },
    ],
    example: '["tensor/cat", [1, 2], [3, 4]]',
  },
  'tensor/stack': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Stack two tensors along a new leading dimension',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'a', type: 'tensor', description: 'First tensor' },
      { name: 'b', type: 'tensor', description: 'Second tensor' },
    ],
    example: '["tensor/stack", [1, 2], [3, 4]]',
  },
  'tensor/transpose': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 3,
    description: 'Transpose a tensor (optionally swapping two named dimensions)',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor to transpose' },
      { name: 'dim0', type: 'number', description: 'First dimension to swap (optional)' },
      { name: 'dim1', type: 'number', description: 'Second dimension to swap (optional)' },
    ],
    example: '["tensor/transpose", [[1, 2], [3, 4]], 0, 1]',
  },
  'tensor/unsqueeze': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 2,
    maxArity: 2,
    description: 'Insert a dimension of size one at the given position',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
      { name: 'dim', type: 'number', description: 'Position to insert the new dimension' },
    ],
    example: '["tensor/unsqueeze", [1, 2, 3], 0]',
  },
  'tensor/squeeze': {
    module: 'tensor',
    category: 'ml-tensor',
    minArity: 1,
    maxArity: 1,
    description: 'Remove all dimensions of size one',
    hasSideEffects: false,
    returnType: 'tensor',
    params: [
      { name: 'tensor', type: 'tensor', description: 'The tensor' },
    ],
    example: '["tensor/squeeze", [[1, 2, 3]]]',
  },
};

/**
 * Get all tensor operator names.
 */
export function getTensorOperators(): string[] {
  return Object.keys(TENSOR_OPERATORS);
}
