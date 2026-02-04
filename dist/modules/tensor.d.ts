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
export declare const TENSOR_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all tensor operator names.
 */
export declare function getTensorOperators(): string[];
