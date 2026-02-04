/**
 * Neural Network Module - Neural Network Operations
 *
 * Provides operators for defining and executing neural networks.
 * Networks are defined as S-expressions and compiled to native code
 * by the Rust compiler for each target backend (PyTorch, TensorFlow, etc.).
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta } from '../types.js';
/**
 * Neural network module operators.
 * These operators define network architecture and forward passes.
 */
export declare const NN_OPERATORS: Record<string, StdOperatorMeta>;
/**
 * Get all nn operator names.
 */
export declare function getNnOperators(): string[];
